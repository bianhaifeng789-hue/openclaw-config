/**
 * Phase 30: ActivityManager - 用户活跃时间追踪
 * 
 * 借鉴 Claude Code 的 activityManager.ts
 * 
 * 功能：追踪用户活跃/空闲时间，优化 heartbeat 检查时机
 */

import * as fs from 'fs/promises'
import * as path from 'path'

// ============================================================================
// Types
// ============================================================================

export interface ActivityEvent {
  timestamp: number
  type: 'active' | 'idle' | 'away' | 'return'
  sessionId?: string
  channelId?: string
}

export interface ActivityStats {
  totalActiveMinutes: number
  totalIdleMinutes: number
  totalAwayMinutes: number
  sessionCount: number
  lastActiveAt: number
  lastIdleAt: number
  currentStatus: 'active' | 'idle' | 'away'
}

export interface ActivityConfig {
  idleThresholdMinutes: number    // 空闲阈值（默认 5 分钟）
  awayThresholdMinutes: number    // 离开阈值（默认 30 分钟）
  enabled: boolean
}

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: ActivityConfig = {
  idleThresholdMinutes: 5,
  awayThresholdMinutes: 30,
  enabled: true,
}

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || path.join(process.env.HOME!, '.openclaw/workspace')
const MEMORY_DIR = path.join(WORKSPACE_ROOT, 'memory')
const STATE_FILE = path.join(MEMORY_DIR, 'activity-state.json')

// ============================================================================
// State Management
// ============================================================================

let stats: ActivityStats = {
  totalActiveMinutes: 0,
  totalIdleMinutes: 0,
  totalAwayMinutes: 0,
  sessionCount: 0,
  lastActiveAt: Date.now(),
  lastIdleAt: 0,
  currentStatus: 'active',
}

let events: ActivityEvent[] = []

async function loadState(): Promise<void> {
  try {
    const content = await fs.readFile(STATE_FILE, 'utf-8')
    const data = JSON.parse(content)
    stats = data.stats || stats
    events = data.events || []
  } catch {
    // 使用默认状态
  }
}

async function saveState(): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify({ stats, events }, null, 2), 'utf-8')
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * 记录活跃事件
 */
export function recordActivity(sessionId?: string, channelId?: string): void {
  const now = Date.now()
  
  // 如果之前是空闲/离开，记录回来事件
  if (stats.currentStatus !== 'active') {
    const idleDuration = (now - stats.lastIdleAt) / 60_000
    
    if (stats.currentStatus === 'idle') {
      stats.totalIdleMinutes += idleDuration
    } else if (stats.currentStatus === 'away') {
      stats.totalAwayMinutes += idleDuration
    }
    
    events.push({
      timestamp: now,
      type: 'return',
      sessionId,
      channelId,
    })
  }
  
  stats.lastActiveAt = now
  stats.currentStatus = 'active'
  stats.sessionCount++
  
  events.push({
    timestamp: now,
    type: 'active',
    sessionId,
    channelId,
  })
  
  // 限制事件数
  if (events.length > 100) {
    events = events.slice(-50)
  }
}

/**
 * 检查并更新状态
 */
export function updateStatus(): 'active' | 'idle' | 'away' {
  const now = Date.now()
  const minutesSinceActive = (now - stats.lastActiveAt) / 60_000
  
  if (minutesSinceActive >= DEFAULT_CONFIG.awayThresholdMinutes) {
    stats.currentStatus = 'away'
    stats.lastIdleAt = stats.lastActiveAt + DEFAULT_CONFIG.awayThresholdMinutes * 60_000
  } else if (minutesSinceActive >= DEFAULT_CONFIG.idleThresholdMinutes) {
    stats.currentStatus = 'idle'
    stats.lastIdleAt = stats.lastActiveAt + DEFAULT_CONFIG.idleThresholdMinutes * 60_000
  } else {
    stats.currentStatus = 'active'
  }
  
  return stats.currentStatus
}

/**
 * 获取当前状态
 */
export function getCurrentStatus(): 'active' | 'idle' | 'away' {
  return updateStatus()
}

/**
 * 获取活跃时间统计
 */
export function getActivityStats(): ActivityStats & { config: ActivityConfig } {
  updateStatus()  // 先更新状态
  return {
    ...stats,
    config: DEFAULT_CONFIG,
  }
}

/**
 * 获取最近活跃时段
 */
export function getRecentActivePeriods(hours: number = 24): ActivityEvent[] {
  const cutoff = Date.now() - hours * 60 * 60_000
  return events.filter(e => e.timestamp >= cutoff && e.type === 'active')
}

/**
 * 分析活跃模式
 */
export function analyzeActivityPattern(): {
  peakHours: number[]
  averageSessionLength: number
  totalSessions: number
} {
  const now = Date.now()
  const todayEvents = events.filter(e => e.timestamp >= now - 24 * 60 * 60_000)
  
  // 计算高峰时段
  const hourCounts: Record<number, number> = {}
  for (const event of todayEvents) {
    if (event.type === 'active') {
      const hour = new Date(event.timestamp).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    }
  }
  
  const peakHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([h]) => parseInt(h))
  
  // 计算平均会话长度
  const activeEvents = todayEvents.filter(e => e.type === 'active')
  const averageSessionLength = activeEvents.length > 0
    ? stats.totalActiveMinutes / Math.max(1, stats.sessionCount)
    : 0
  
  return {
    peakHours,
    averageSessionLength,
    totalSessions: stats.sessionCount,
  }
}

// ============================================================================
// HEARTBEAT Integration
// ============================================================================

/**
 * Heartbeat 检查点
 */
export async function checkActivityForHeartbeat(): Promise<{
  status: 'active' | 'idle' | 'away'
  minutesSinceActive: number
  shouldCheck: boolean
}> {
  const status = getCurrentStatus()
  const minutesSinceActive = (Date.now() - stats.lastActiveAt) / 60_000
  
  // 活跃时应该检查，空闲/离开时降低频率
  const shouldCheck = status === 'active' || minutesSinceActive < 60
  
  return { status, minutesSinceActive, shouldCheck }
}

// ============================================================================
// Feishu Card
// ============================================================================

/**
 * 构建飞书活跃统计卡片
 */
export function createActivityStatsCard(): {
  title: string
  content: string
} {
  const pattern = analyzeActivityPattern()
  
  return {
    title: '📊 活跃时间统计',
    content: `今日状态: ${stats.currentStatus}
活跃时长: ${Math.floor(stats.totalActiveMinutes)} 分钟
空闲时长: ${Math.floor(stats.totalIdleMinutes)} 分钟
离开时长: ${Math.floor(stats.totalAwayMinutes)} 分钟
会话数: ${stats.sessionCount}

高峰时段: ${pattern.peakHours.map(h => `${h}:00`).join(', ')}
平均会话: ${Math.floor(pattern.averageSessionLength)} 分钟`,
  }
}

// ============================================================================
// Service Object
// ============================================================================

export const activityManagerService = {
  record: recordActivity,
  updateStatus,
  getStatus: getCurrentStatus,
  getStats: getActivityStats,
  getRecentPeriods: getRecentActivePeriods,
  analyzePattern: analyzeActivityPattern,
  checkForHeartbeat: checkActivityForHeartbeat,
  createCard: createActivityStatsCard,
  loadState,
  saveState,
}

export default activityManagerService