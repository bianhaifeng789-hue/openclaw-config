/**
 * Permission Decision Tracker - 权限决策追踪器
 * 
 * 借鉴 Claude Code 的 denialTracking.ts:
 * - permissions/denialTracking.ts 的拒绝追踪机制
 * - 学习用户偏好，避免重复询问
 * - 自动调整权限策略
 * 
 * OpenClaw 适配：
 * - 飞书场景下的权限审批
 * - 自动模式下的决策学习
 */

// ============================================================================
// Decision Types
// ============================================================================

/**
 * Permission Decision - 权限决策
 */
export type PermissionDecision =
  | 'allow'       // 允许
  | 'deny'        // 拒绝
  | 'allow_once'  // 允许一次
  | 'deny_once'   // 拒绝一次
  | 'allow_always'// 永久允许
  | 'timeout'     // 超时未响应

/**
 * Decision Record - 决策记录
 */
export interface DecisionRecord {
  /** 记录 ID */
  id: string
  /** 决策时间 */
  timestamp: number
  /** 请求的操作类型 */
  operationType: string
  /** 请求的命令/工具 */
  requestedItem: string
  /** 决策结果 */
  decision: PermissionDecision
  /** 决策上下文 */
  context?: {
    /** 会话 ID */
    sessionId?: string
    /** 查询来源 */
    querySource?: string
    /** 命令参数 */
    commandArgs?: string
    /** 风险评估 */
    riskScore?: number
  }
  /** 拒绝原因（如果拒绝） */
  denyReason?: string
  /** 从请求到决策的时间（ms） */
  responseTimeMs?: number
}

/**
 * Decision Summary - 决策摘要
 */
export interface DecisionSummary {
  /** 总决策数 */
  totalDecisions: number
  /** 允许次数 */
  allowCount: number
  /** 拒绝次数 */
  denyCount: number
  /** 拒绝率 */
  denyRate: number
  /** 平均响应时间 */
  avgResponseTimeMs: number
  /** 最近决策 */
  recentDecisions: DecisionRecord[]
  /** 常拒绝的操作 */
  frequentlyDenied: Array<{ operation: string; count: number }>
  /** 常允许的操作 */
  frequentlyAllowed: Array<{ operation: string; count: number }>
}

// ============================================================================
// Tracking State
// ============================================================================

// 决策记录（内存缓存）
const decisionRecords: DecisionRecord[] = []

// 操作统计
const operationStats: Map<string, { allow: number; deny: number }> = new Map()

// 拒绝计数器（用于自动模式决策）
let globalDenialCount = 0

// 上次拒绝时间
let lastDenialTimestamp = 0

// 状态文件路径
const STATE_PATH = 'memory/permission-decision-state.json'

// ============================================================================
// Decision Recording
// ============================================================================

/**
 * Record Decision
 * 
 * 记录权限决策
 * 
 * @param decision - 决策内容
 */
export function recordDecision(decision: DecisionRecord): void {
  decisionRecords.push(decision)
  
  // 更新操作统计
  const operation = decision.operationType
  const stats = operationStats.get(operation) ?? { allow: 0, deny: 0 }
  
  if (decision.decision.includes('allow')) {
    stats.allow++
  } else if (decision.decision.includes('deny')) {
    stats.deny++
    globalDenialCount++
    lastDenialTimestamp = decision.timestamp
  }
  
  operationStats.set(operation, stats)
  
  // 限制记录数量（保留最近 1000 条）
  if (decisionRecords.length > 1000) {
    decisionRecords.shift()
  }
}

/**
 * Create Decision Record
 * 
 * 创建决策记录
 */
export function createDecisionRecord(
  operationType: string,
  requestedItem: string,
  decision: PermissionDecision,
  context?: DecisionRecord['context'],
  denyReason?: string,
  responseTimeMs?: number
): DecisionRecord {
  return {
    id: `decision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    operationType,
    requestedItem,
    decision,
    context,
    denyReason,
    responseTimeMs
  }
}

// ============================================================================
// Query Decisions
// ============================================================================

/**
 * Get Decision Summary
 * 
 * 获取决策摘要
 */
export function getDecisionSummary(): DecisionSummary {
  const totalDecisions = decisionRecords.length
  const allowCount = decisionRecords.filter(d => d.decision.includes('allow')).length
  const denyCount = decisionRecords.filter(d => d.decision.includes('deny')).length
  const denyRate = totalDecisions > 0 ? denyCount / totalDecisions : 0
  
  const avgResponseTimeMs = decisionRecords
    .filter(d => d.responseTimeMs !== undefined)
    .reduce((sum, d) => sum + (d.responseTimeMs ?? 0), 0) /
    Math.max(1, decisionRecords.filter(d => d.responseTimeMs !== undefined).length)
  
  // 最近决策（最近 20 条）
  const recentDecisions = decisionRecords.slice(-20)
  
  // 常拒绝的操作
  const frequentlyDenied = Array.from(operationStats.entries())
    .filter(([_, stats]) => stats.deny > 0)
    .sort((a, b) => b[1].deny - a[1].deny)
    .slice(0, 10)
    .map(([operation, stats]) => ({ operation, count: stats.deny }))
  
  // 常允许的操作
  const frequentlyAllowed = Array.from(operationStats.entries())
    .filter(([_, stats]) => stats.allow > 0)
    .sort((a, b) => b[1].allow - a[1].allow)
    .slice(0, 10)
    .map(([operation, stats]) => ({ operation, count: stats.allow }))
  
  return {
    totalDecisions,
    allowCount,
    denyCount,
    denyRate,
    avgResponseTimeMs,
    recentDecisions,
    frequentlyDenied,
    frequentlyAllowed
  }
}

/**
 * Get Global Denial Count
 * 
 * 获取全局拒绝计数
 */
export function getGlobalDenialCount(): number {
  return globalDenialCount
}

/**
 * Get Last Denial Timestamp
 * 
 * 获取上次拒绝时间
 */
export function getLastDenialTimestamp(): number {
  return lastDenialTimestamp
}

/**
 * Has Recent Denials
 * 
 * 检查是否有最近的拒绝（用于判断是否应该谨慎）
 */
export function hasRecentDenials(
  thresholdMs: number = 60_000 // 默认 1 分钟
): boolean {
  if (lastDenialTimestamp === 0) {
    return false
  }
  return Date.now() - lastDenialTimestamp < thresholdMs
}

/**
 * Get Operation Stats
 * 
 * 获取特定操作的统计
 */
export function getOperationStats(operation: string): {
  allow: number
  deny: number
  total: number
  denyRate: number
} | null {
  const stats = operationStats.get(operation)
  if (!stats) {
    return null
  }
  
  const total = stats.allow + stats.deny
  return {
    ...stats,
    total,
    denyRate: total > 0 ? stats.deny / total : 0
  }
}

// ============================================================================
// Learning from Decisions
// ============================================================================

/**
 * Learned Preference - 学习到的偏好
 */
export interface LearnedPreference {
  /** 操作类型 */
  operationType: string
  /** 学习到的策略 */
  learnedPolicy: 'always_allow' | 'always_deny' | 'ask' | 'unknown'
  /** 置信度 */
  confidence: number
  /** 样本数 */
  sampleCount: number
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * Learn Preference from Decisions
 * 
 * 从决策中学习偏好
 * 
 * 规则：
 * - 如果连续 5 次都允许 → always_allow
 * - 如果连续 3 次都拒绝 → always_deny
 * - 否则 → ask
 */
export function learnPreference(operationType: string): LearnedPreference {
  const stats = getOperationStats(operationType)
  
  if (!stats || stats.total < 3) {
    return {
      operationType,
      learnedPolicy: 'unknown',
      confidence: 0,
      sampleCount: stats?.total ?? 0,
      lastUpdated: Date.now()
    }
  }
  
  // 检查最近决策序列
  const recentOps = decisionRecords
    .filter(d => d.operationType === operationType)
    .slice(-10)
  
  // 反转数组用于连续检查
  const recentOpsReversed = [...recentOps].reverse()
  
  // 连续允许检查: 手动实现 takeWhile
  const consecutiveAllows = recentOpsReversed.filter((d, i, arr) => {
    if (i === 0) return d.decision.includes('allow')
    return arr.slice(0, i).every(prev => prev.decision.includes('allow')) && d.decision.includes('allow')
  }).length
  
  // 连续拒绝检查
  const consecutiveDenies = recentOpsReversed.filter((d, i, arr) => {
    if (i === 0) return d.decision.includes('deny')
    return arr.slice(0, i).every(prev => prev.decision.includes('deny')) && d.decision.includes('deny')
  }).length
  
  let learnedPolicy: 'always_allow' | 'always_deny' | 'ask'
  let confidence: number
  
  if (consecutiveAllows >= 5) {
    learnedPolicy = 'always_allow'
    confidence = Math.min(0.9, 0.5 + consecutiveAllows * 0.1)
  } else if (consecutiveDenies >= 3) {
    learnedPolicy = 'always_deny'
    confidence = Math.min(0.9, 0.5 + consecutiveDenies * 0.15)
  } else {
    learnedPolicy = 'ask'
    confidence = 0.3
  }
  
  return {
    operationType,
    learnedPolicy,
    confidence,
    sampleCount: stats.total,
    lastUpdated: Date.now()
  }
}

/**
 * Should Auto Approve?
 * 
 * 判断是否应该自动批准
 * 
 * @param operationType - 操作类型
 * @returns 是否应该自动批准
 */
export function shouldAutoApprove(operationType: string): boolean {
  const preference = learnPreference(operationType)
  return preference.learnedPolicy === 'always_allow' && preference.confidence >= 0.7
}

/**
 * Should Auto Deny?
 * 
 * 判断是否应该自动拒绝
 * 
 * @param operationType - 操作类型
 * @returns 是否应该自动拒绝
 */
export function shouldAutoDeny(operationType: string): boolean {
  const preference = learnPreference(operationType)
  return preference.learnedPolicy === 'always_deny' && preference.confidence >= 0.6
}

// ============================================================================
// State Persistence
// ============================================================================

/**
 * Permission Decision State - 权限决策状态
 */
export interface PermissionDecisionState {
  globalDenialCount: number
  lastDenialTimestamp: number
  decisionCount: number
  operationStats: Record<string, { allow: number; deny: number }>
  lastUpdated: number
}

/**
 * Get State
 */
export function getState(): PermissionDecisionState {
  const statsRecord: Record<string, { allow: number; deny: number }> = {}
  
  for (const [operation, stats] of operationStats.entries()) {
    statsRecord[operation] = stats
  }
  
  return {
    globalDenialCount,
    lastDenialTimestamp,
    decisionCount: decisionRecords.length,
    operationStats: statsRecord,
    lastUpdated: Date.now()
  }
}

/**
 * Save State
 */
export function saveState(): void {
  const state = getState()
  // 实际实现需要 fs.writeFileSync(STATE_PATH, JSON.stringify(state))
}

/**
 * Load State
 */
export function loadState(state: PermissionDecisionState): void {
  globalDenialCount = state.globalDenialCount
  lastDenialTimestamp = state.lastDenialTimestamp
  
  for (const [operation, stats] of Object.entries(state.operationStats)) {
    operationStats.set(operation, stats)
  }
}

/**
 * Reset State（用于测试）
 */
export function resetState(): void {
  decisionRecords.length = 0
  operationStats.clear()
  globalDenialCount = 0
  lastDenialTimestamp = 0
}

// ============================================================================
// Integration with OpenClaw
// ============================================================================

/**
 * Create Permission Decision Hook
 * 
 * 创建权限决策追踪的 Post-Sampling Hook
 */
export function createPermissionDecisionHook(): (context: {
  toolUseContext?: { getAppState?: () => unknown }
}) => void {
  return (context) => {
    // 从 app state 中提取决策
    const appState = context.toolUseContext?.getAppState?.() as unknown as {
      toolPermissionContext?: {
        recentDecisions?: DecisionRecord[]
      }
    } | undefined
    
    if (appState?.toolPermissionContext?.recentDecisions) {
      for (const decision of appState.toolPermissionContext.recentDecisions) {
        recordDecision(decision)
      }
    }
    
    saveState()
  }
}

// ============================================================================
// Export
// ============================================================================

export const permissionDecisionTracker = {
// Recording
  recordDecision,
  createDecisionRecord,
  
  // Querying
  getDecisionSummary,
  getGlobalDenialCount,
  getLastDenialTimestamp,
  hasRecentDenials,
  getOperationStats,
  
  // Learning
  learnPreference,
  shouldAutoApprove,
  shouldAutoDeny,
  
  // State
  getState,
  saveState,
  loadState,
  resetState,
  
  // Integration
  createPermissionDecisionHook,
  
  // Types
}

// Types (moved to separate export)


export default permissionDecisionTracker