/**
 * Phase 29: AwaySummary - 用户离开摘要
 * 
 * 借鉴 Claude Code 的 awaySummary.ts
 * 
 * 功能：用户离开后回来时，生成"while you were away"摘要
 * 飞书场景：用户离开飞书聊天一段时间后，回来时发送摘要卡片
 */

import * as fs from 'fs/promises'
import * as path from 'path'

// ============================================================================
// Types
// ============================================================================

export interface AwaySummaryConfig {
  minAwayMinutes: number    // 最小离开时间（默认 30 分钟）
  maxEvents: number         // 最大事件数（默认 20）
  enabled: boolean          // 是否启用
}

export interface AwayEvent {
  timestamp: number
  type: 'message' | 'task_complete' | 'heartbeat' | 'error' | 'notification'
  summary: string
  details?: Record<string, any>
}

export interface AwaySummaryState {
  lastSeenAt: number        // 用户最后活跃时间
  lastSummaryAt: number     // 上次生成摘要时间
  events: AwayEvent[]       // 离开期间的事件
  totalAways: number        // 累计离开次数
  totalEventsRecorded: number
}

export interface AwaySummaryResult {
  awayDurationMinutes: number
  eventsCount: number
  keyEvents: AwayEvent[]
  summaryText: string
}

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: AwaySummaryConfig = {
  minAwayMinutes: 30,
  maxEvents: 20,
  enabled: true,
}

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.env.HOME!, '.openclaw/workspace')
const MEMORY_DIR = path.join(WORKSPACE_ROOT, 'memory')
const STATE_FILE = path.join(MEMORY_DIR, 'away-summary-state.json')

// ============================================================================
// State Management
// ============================================================================

let state: AwaySummaryState = {
  lastSeenAt: Date.now(),
  lastSummaryAt: 0,
  events: [],
  totalAways: 0,
  totalEventsRecorded: 0,
}

async function loadState(): Promise<void> {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8')
    state = JSON.parse(content)
  } catch {
    // 使用默认状态
  }
}

async function saveState(): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8')
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * 记录用户活跃（心跳）
 */
export function recordUserActivity(): void {
  state.lastSeenAt = Date.now()
}

/**
 * 记录事件（离开期间）
 */
export function recordAwayEvent(event: AwayEvent): void {
  state.events.push(event)
  state.totalEventsRecorded++
  
  // 限制最大事件数
  if (state.events.length > DEFAULT_CONFIG.maxEvents * 2) {
    state.events = state.events.slice(-DEFAULT_CONFIG.maxEvents)
  }
}

/**
 * 检查用户是否离开
 */
export function isUserAway(): boolean {
  const minutesSinceSeen = (Date.now() - state.lastSeenAt) / 60_000
  return minutesSinceSeen >= DEFAULT_CONFIG.minAwayMinutes
}

/**
 * 计算离开时长
 */
export function getAwayDurationMinutes(): number {
  return Math.floor((Date.now() - state.lastSeenAt) / 60_000)
}

/**
 * 生成离开摘要
 */
export async function generateAwaySummary(): Promise<AwaySummaryResult | null> {
  const awayMinutes = getAwayDurationMinutes()
  
  if (awayMinutes < DEFAULT_CONFIG.minAwayMinutes) {
    return null
  }
  
  // 获取离开期间的事件
  const awayStartTime = state.lastSeenAt
  const awayEvents = state.events.filter(e => e.timestamp >= awayStartTime)
  
  // 提取关键事件
  const keyEvents = awayEvents.slice(-DEFAULT_CONFIG.maxEvents)
  
  // 生成摘要文本
  const summaryText = buildSummaryText(awayMinutes, keyEvents)
  
  // 更新状态
  state.lastSummaryAt = Date.now()
  state.totalAways++
  state.events = []  // 清空事件
  await saveState()
  
  return {
    awayDurationMinutes: awayMinutes,
    eventsCount: awayEvents.length,
    keyEvents,
    summaryText,
  }
}

/**
 * 构建摘要文本
 */
function buildSummaryText(awayMinutes: number, events: AwayEvent[]): string {
  const lines = [
    `⏰ 您离开了 ${awayMinutes} 分钟`,
    '',
  ]
  
  if (events.length === 0) {
    lines.push('离开期间无重要事件')
  } else {
    lines.push(`离开期间发生 ${events.length} 个事件：`)
    
    // 按类型分组
    const byType: Record<string, AwayEvent[]> = {}
    for (const event of events) {
      if (!byType[event.type]) byType[event.type] = []
      byType[event.type].push(event)
    }
    
    for (const [type, typeEvents] of Object.entries(byType)) {
      const icon = getTypeIcon(type)
      lines.push(`${icon} ${type}: ${typeEvents.length} 个`)
      for (const e of typeEvents.slice(0, 3)) {
        lines.push(`  - ${e.summary}`)
      }
    }
  }
  
  return lines.join('\n')
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'message': return '💬'
    case 'task_complete': return '✅'
    case 'heartbeat': return '💓'
    case 'error': return '❌'
    case 'notification': return '🔔'
    default: return '📋'
  }
}

// ============================================================================
// HEARTBEAT Integration
// ============================================================================

/**
 * Heartbeat 检查点
 */
export async function checkAwaySummaryForHeartbeat(): Promise<{
  isAway: boolean
  awayMinutes: number
  shouldNotify: boolean
}> {
  const isAway = isUserAway()
  const awayMinutes = getAwayDurationMinutes()
  const shouldNotify = isAway && awayMinutes >= DEFAULT_CONFIG.minAwayMinutes
  
  return { isAway, awayMinutes, shouldNotify }
}

// ============================================================================
// Stats
// ============================================================================

export function getAwaySummaryStats(): AwaySummaryState & { config: AwaySummaryConfig } {
  return {
    ...state,
    config: DEFAULT_CONFIG,
  }
}

// ============================================================================
// Feishu Card
// ============================================================================

/**
 * 构建飞书离开摘要卡片
 */
export function createAwaySummaryCard(result: AwaySummaryResult): {
  title: string
  content: string
} {
  return {
    title: '⏰ While You Were Away',
    content: result.summaryText,
  }
}

// ============================================================================
// Service Object
// ============================================================================

export const awaySummaryService = {
  recordActivity: recordUserActivity,
  recordEvent: recordAwayEvent,
  isAway: isUserAway,
  getAwayDuration: getAwayDurationMinutes,
  generateSummary: generateAwaySummary,
  checkForHeartbeat: checkAwaySummaryForHeartbeat,
  getStats: getAwaySummaryStats,
  createCard: createAwaySummaryCard,
  loadState,
  saveState,
}

export default awaySummaryService