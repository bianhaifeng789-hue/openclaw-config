/**
 * Claude AI Limits Service
 * Phase 11 - 使用量限制追踪系统
 * 
 * 借鉴 Claude Code services/claudeAiLimits.ts
 * 功能: 5h/7d 限额追踪、Early Warning、Rate limit 消息生成
 *
 * This module keeps in-memory quota state only; do not persist quota snapshots into heartbeat-state.json.
 */

// ============================================
// Types
// ============================================

export type QuotaStatus = 'allowed' | 'allowed_warning' | 'rejected'

export type RateLimitType =
  | 'five_hour'
  | 'seven_day'
  | 'seven_day_opus'
  | 'seven_day_sonnet'
  | 'overage'

export type OverageDisabledReason =
  | 'overage_not_provisioned'
  | 'org_level_disabled'
  | 'org_level_disabled_until'
  | 'out_of_credits'
  | 'seat_tier_level_disabled'
  | 'member_level_disabled'
  | 'seat_tier_zero_credit_limit'
  | 'group_zero_credit_limit'
  | 'member_zero_credit_limit'
  | 'org_service_level_disabled'
  | 'org_service_zero_credit_limit'
  | 'no_limits_configured'
  | 'unknown'

export interface ClaudeAILimits {
  status: QuotaStatus
  unifiedRateLimitFallbackAvailable: boolean
  resetsAt?: number
  rateLimitType?: RateLimitType
  utilization?: number
  overageStatus?: QuotaStatus
  overageResetsAt?: number
  overageDisabledReason?: OverageDisabledReason
  isUsingOverage?: boolean
  surpassedThreshold?: number
}

export interface WindowUtilization {
  utilization: number // 0-1 fraction
  resetsAt: number // unix epoch seconds
}

export interface RawUtilization {
  fiveHour?: WindowUtilization
  sevenDay?: WindowUtilization
}

export interface EarlyWarningThreshold {
  utilization: number // 0-1 scale
  timePct: number // 0-1 scale
}

export interface EarlyWarningConfig {
  rateLimitType: RateLimitType
  claimAbbrev: '5h' | '7d'
  windowSeconds: number
  thresholds: EarlyWarningThreshold[]
}

export interface LimitsState {
  currentLimits: ClaudeAILimits
  rawUtilization: RawUtilization
  lastCheck: string | null
  warningCount: number
  rejectedCount: number
}

// ============================================
// Constants
// ============================================

const RATE_LIMIT_DISPLAY_NAMES: Record<RateLimitType, string> = {
  five_hour: '会话限制',
  seven_day: '周限制',
  seven_day_opus: 'Opus 限制',
  seven_day_sonnet: 'Sonnet 限制',
  overage: '额外使用限制',
}

// Early Warning 配置（按优先级）
const EARLY_WARNING_CONFIGS: EarlyWarningConfig[] = [
  {
    rateLimitType: 'five_hour',
    claimAbbrev: '5h',
    windowSeconds: 5 * 60 * 60,
    thresholds: [{ utilization: 0.9, timePct: 0.72 }],
  },
  {
    rateLimitType: 'seven_day',
    claimAbbrev: '7d',
    windowSeconds: 7 * 24 * 60 * 60,
    thresholds: [
      { utilization: 0.75, timePct: 0.6 },
      { utilization: 0.5, timePct: 0.35 },
      { utilization: 0.25, timePct: 0.15 },
    ],
  },
]

const EARLY_WARNING_CLAIM_MAP: Record<string, RateLimitType> = {
  '5h': 'five_hour',
  '7d': 'seven_day',
  overage: 'overage',
}

// ============================================
// State Management
// ============================================

let _state: LimitsState = {
  currentLimits: {
    status: 'allowed',
    unifiedRateLimitFallbackAvailable: false,
    isUsingOverage: false,
  },
  rawUtilization: {},
  lastCheck: null,
  warningCount: 0,
  rejectedCount: 0,
}

type StatusChangeListener = (limits: ClaudeAILimits) => void
const _listeners: Set<StatusChangeListener> = new Set()

export function getState(): LimitsState {
  return {
    ..._state,
    currentLimits: { ..._state.currentLimits },
    rawUtilization: { ..._state.rawUtilization },
  }
}

export function resetState(): void {
  _state = {
    currentLimits: {
      status: 'allowed',
      unifiedRateLimitFallbackAvailable: false,
      isUsingOverage: false,
    },
    rawUtilization: {},
    lastCheck: null,
    warningCount: 0,
    rejectedCount: 0,
  }
  _listeners.clear()
}

// ============================================
// Core Functions
// ============================================

/**
 * 获取限制显示名称
 */
export function getRateLimitDisplayName(type: RateLimitType): string {
  return RATE_LIMIT_DISPLAY_NAMES[type] || type
}

/**
 * 计算时间窗口进度
 */
function computeTimeProgress(resetsAt: number, windowSeconds: number): number {
  const nowSeconds = Date.now() / 1000
  const windowStart = resetsAt - windowSeconds
  const elapsed = nowSeconds - windowStart
  return Math.max(0, Math.min(1, elapsed / windowSeconds))
}

/**
 * 获取原始利用率
 */
export function getRawUtilization(): RawUtilization {
  return { ..._state.rawUtilization }
}

/**
 * 从响应头提取利用率
 */
export function extractRawUtilization(headers: Headers): RawUtilization {
  const result: RawUtilization = {}
  
  for (const [key, abbrev] of [
    ['fiveHour', '5h'],
    ['sevenDay', '7d'],
  ] as const) {
    const util = headers.get(`anthropic-ratelimit-unified-${abbrev}-utilization`)
    const reset = headers.get(`anthropic-ratelimit-unified-${abbrev}-reset`)
    
    if (util !== null && reset !== null) {
      result[key] = {
        utilization: Number(util),
        resetsAt: Number(reset),
      }
    }
  }
  
  return result
}

/**
 * 检查 Early Warning
 */
export function checkEarlyWarning(
  utilization: number,
  resetsAt: number,
  rateLimitType: RateLimitType,
): boolean {
  const config = EARLY_WARNING_CONFIGS.find(c => c.rateLimitType === rateLimitType)
  
  if (!config) return false
  
  const timeProgress = computeTimeProgress(resetsAt, config.windowSeconds)
  
  // 检查是否超过阈值
  for (const threshold of config.thresholds) {
    if (utilization >= threshold.utilization && timeProgress <= threshold.timePct) {
      return true
    }
  }
  
  return false
}

/**
 * 生成 Early Warning 消息
 */
export function getEarlyWarningMessage(
  utilization: number,
  resetsAt: number,
  rateLimitType: RateLimitType,
): string {
  const displayName = getRateLimitDisplayName(rateLimitType)
  const utilPct = Math.round(utilization * 100)
  
  const resetDate = new Date(resetsAt * 1000)
  const resetTimeStr = resetDate.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
  
  const hoursTillReset = Math.round((resetsAt - Date.now() / 1000) / 3600)
  
  return `⚠️ **${displayName} 使用预警**
已使用 **${utilPct}%**，但时间窗口仅过去不到阈值比例。
重置时间: ${resetTimeStr}（约 ${hoursTillReset} 小时后）

建议:
- 节省 token 使用（避免长对话）
- 等待重置后再进行大任务
- 或切换到备用模型`
}

/**
 * 生成 Rate Limit 错误消息
 */
export function getRateLimitErrorMessage(limits: ClaudeAILimits): string {
  if (limits.status !== 'rejected') {
    return ''
  }
  
  const displayName = getRateLimitDisplayName(limits.rateLimitType || 'five_hour')
  const resetDate = limits.resetsAt 
    ? new Date(limits.resetsAt * 1000)
    : null
  
  const resetTimeStr = resetDate 
    ? resetDate.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '未知'
  
  let message = `❌ **${displayName} 已耗尽**

重置时间: ${resetTimeStr}
`
  
  // 检查 overage 状态
  if (limits.overageStatus === 'allowed') {
    message += `\n✅ 可以使用 Overage（额外用量）
继续使用将消耗额外配额。`
  } else if (limits.overageDisabledReason) {
    const reasonMap: Record<OverageDisabledReason, string> = {
      overage_not_provisioned: '未配置 Overage',
      org_level_disabled: '组织级 Overage 已禁用',
      out_of_credits: '组织积分不足',
      seat_tier_level_disabled: '席位层级未启用 Overage',
      member_level_disabled: '账户 Overage 已禁用',
      no_limits_configured: '未配置 Overage 限制',
      unknown: '未知原因',
      org_level_disabled_until: '组织 Overage 暂时禁用',
      seat_tier_zero_credit_limit: '席位积分限制为零',
      group_zero_credit_limit: '组积分限制为零',
      member_zero_credit_limit: '账户积分限制为零',
      org_service_level_disabled: '组织服务 Overage 已禁用',
      org_service_zero_credit_limit: '组织服务积分限制为零',
    }
    
    const reasonText = reasonMap[limits.overageDisabledReason] || limits.overageDisabledReason
    message += `\n❌ Overage 不可用: ${reasonText}`
  }
  
  return message
}

/**
 * 生成 Rate Limit 警告消息
 */
export function getRateLimitWarning(limits: ClaudeAILimits): string {
  if (limits.status !== 'allowed_warning') {
    return ''
  }
  
  const displayName = getRateLimitDisplayName(limits.rateLimitType || 'five_hour')
  const utilPct = Math.round((limits.utilization || 0) * 100)
  
  return `⚠️ **${displayName} 接近耗尽**
已使用 **${utilPct}%**

请谨慎使用 token，避免长对话。`
}

/**
 * 更新限制状态
 */
export function updateLimits(limits: ClaudeAILimits): void {
  _state.currentLimits = { ...limits }
  _state.lastCheck = new Date().toISOString()
  
  if (limits.status === 'allowed_warning') {
    _state.warningCount++
  } else if (limits.status === 'rejected') {
    _state.rejectedCount++
  }
  
  // 发送状态变更事件
  emitStatusChange(limits)
}

/**
 * 更新原始利用率
 */
export function updateRawUtilization(utilization: RawUtilization): void {
  _state.rawUtilization = { ...utilization }
}

/**
 * 发送状态变更事件
 */
export function emitStatusChange(limits: ClaudeAILimits): void {
  _listeners.forEach(listener => listener(limits))
}

/**
 * 添加状态监听器
 */
export function addStatusListener(listener: StatusChangeListener): void {
  _listeners.add(listener)
}

/**
 * 移除状态监听器
 */
export function removeStatusListener(listener: StatusChangeListener): void {
  _listeners.delete(listener)
}

// ============================================
// Quota Check
// ============================================

/**
 * 检查配额状态（模拟）
 * 实际实现需要调用 API
 */
export async function checkQuotaStatus(): Promise<ClaudeAILimits> {
  // 模拟返回（实际应调用 Anthropic API）
  const mockLimits: ClaudeAILimits = {
    status: 'allowed',
    unifiedRateLimitFallbackAvailable: true,
    resetsAt: Math.floor(Date.now() / 1000) + 5 * 60 * 60,
    rateLimitType: 'five_hour',
    utilization: 0.45,
    isUsingOverage: false,
  }
  
  // 检查 Early Warning
  if (mockLimits.utilization && mockLimits.resetsAt && mockLimits.rateLimitType) {
    const hasWarning = checkEarlyWarning(
      mockLimits.utilization,
      mockLimits.resetsAt,
      mockLimits.rateLimitType,
    )
    
    if (hasWarning) {
      mockLimits.status = 'allowed_warning'
      mockLimits.surpassedThreshold = mockLimits.utilization
    }
  }
  
  updateLimits(mockLimits)
  
  return mockLimits
}

/**
 * 处理 API 响应头
 */
export function processRateLimitHeaders(headers: Headers): ClaudeAILimits {
  const utilization = extractRawUtilization(headers)
  updateRawUtilization(utilization)
  
  // 构建 limits 对象
  const limits: ClaudeAILimits = {
    status: 'allowed',
    unifiedRateLimitFallbackAvailable: false,
    isUsingOverage: false,
  }
  
  // 检查 5h 限制
  if (utilization.fiveHour) {
    limits.rateLimitType = 'five_hour'
    limits.utilization = utilization.fiveHour.utilization
    limits.resetsAt = utilization.fiveHour.resetsAt
    
    // 检查是否耗尽
    if (utilization.fiveHour.utilization >= 1) {
      limits.status = 'rejected'
    } else if (checkEarlyWarning(
      utilization.fiveHour.utilization,
      utilization.fiveHour.resetsAt,
      'five_hour',
    )) {
      limits.status = 'allowed_warning'
    }
  }
  
  // 检查 7d 限制
  if (utilization.sevenDay) {
    if (utilization.sevenDay.utilization >= 1) {
      limits.status = 'rejected'
      limits.rateLimitType = 'seven_day'
      limits.utilization = utilization.sevenDay.utilization
      limits.resetsAt = utilization.sevenDay.resetsAt
    }
  }
  
  updateLimits(limits)
  
  return limits
}

// ============================================
// OpenClaw Integration Hooks
// ============================================

/**
 * 创建限制检查 Hook（接入 API 调用）
 */
export function createLimitsHook() {
  return {
    name: 'claude-ai-limits',
    
    beforeApiCall: () => {
      // 检查当前状态
      const current = _state.currentLimits
      
      if (current.status === 'rejected') {
        // 返回错误消息
        return {
          shouldAbort: true,
          message: getRateLimitErrorMessage(current),
        }
      }
      
      return { shouldAbort: false }
    },
    
    afterApiCall: (response: { headers: Headers }) => {
      // 处理响应头
      const limits = processRateLimitHeaders(response.headers)
      
      // 如果有警告，发送飞书通知
      if (limits.status === 'allowed_warning') {
        const warning = getRateLimitWarning(limits)
        // TODO: 发送飞书卡片
        return { warning }
      }
      
      return {}
    },
  }
}

/**
 * 导出统计信息
 */
export function getSystemStats(): {
  state: LimitsState
  limits: ClaudeAILimits
  rawUtilization: RawUtilization
  displayNames: Record<RateLimitType, string>
} {
  return {
    state: getState(),
    limits: { ..._state.currentLimits },
    rawUtilization: getRawUtilization(),
    displayNames: RATE_LIMIT_DISPLAY_NAMES,
  }
}

/**
 * 重置所有状态
 */
export function resetAll(): void {
  resetState()
}