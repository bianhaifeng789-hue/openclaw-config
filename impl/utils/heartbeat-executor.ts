/**
 * HEARTBEAT 任务执行器
 * 
 * 实现 HEARTBEAT.md 中定义的所有任务的具体逻辑
 * 供 heartbeat 调用时执行
 */

import * as fs from 'fs/promises'
import * as path from 'path'

// Import enabled-but-not-integrated services
import { awaySummaryService } from './away-summary-service.js'
import { shouldNotify, getSystemStats } from './buddy-companion-service.js'
import { sideQueryService } from './side-query-service.js'
import { argumentSubstitutionService } from './argument-substitution-service.js'
import { teammateMailboxService } from './teammate-mailbox-service.js'

// Import new services (2026-04-13)
import { diagnosticTrackingService } from './diagnostic-tracking-service.js'
import { internalLoggingService } from './internal-logging-service.js'
import { rateLimitMessagesService } from './rate-limit-messages-service.js'
import { mcpServerApprovalService } from './mcp-server-approval.js'
import { extractMemoriesService } from './extract-memories-service.js'
import { toolUseSummaryService } from './tool-use-summary-service.js'

// ============================================================================
// Types
// ============================================================================

export interface HeartbeatTask {
  name: string
  interval: number  // minutes
  priority: 'high' | 'medium' | 'low'
  lastCheck?: number  // timestamp
  shouldRun: boolean
  reason: string
}

export interface HeartbeatCheckResult {
  tasksChecked: number
  tasksRun: number
  notificationsSent: number
  results: TaskResult[]
  overallStatus: 'ok' | 'action_taken' | 'error'
}

export interface TaskResult {
  name: string
  executed: boolean
  success?: boolean
  output?: string
  error?: string
  reason?: string  // 任务不执行的原因
}

// ============================================================================
// Constants
// ============================================================================

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '~/.openclaw/workspace'
const MEMORY_DIR = path.join(WORKSPACE_ROOT, 'memory')

const TASK_CONFIGS: HeartbeatTask[] = [
  { name: 'task-visualizer', interval: 30, priority: 'high', shouldRun: false, reason: '' },
  { name: 'memory-compact', interval: 1440, priority: 'low', shouldRun: false, reason: '' },  // 24h
  { name: 'memory-maintenance', interval: 120, priority: 'medium', shouldRun: false, reason: '' },  // 2h
  { name: 'insights-analysis', interval: 360, priority: 'medium', shouldRun: false, reason: '' },  // 6h
  { name: 'auto-dream', interval: 1440, priority: 'high', shouldRun: false, reason: '' },  // 24h
  { name: 'magic-docs-scan', interval: 360, priority: 'medium', shouldRun: false, reason: '' },  // 6h
  { name: 'phase1-8-stats-check', interval: 60, priority: 'medium', shouldRun: false, reason: '' },  // 1h
  { name: 'buddy-interaction-check', interval: 30, priority: 'low', shouldRun: false, reason: '' },  // 30m
  { name: 'limits-early-warning', interval: 30, priority: 'high', shouldRun: false, reason: '' },  // 30m
  { name: 'memdir-stats-check', interval: 60, priority: 'high', shouldRun: false, reason: '' },  // 1h
  // 新接入的 5 个服务
  { name: 'buddy-companion', interval: 60, priority: 'medium', shouldRun: false, reason: '' },  // 1h
  { name: 'away-summary', interval: 30, priority: 'high', shouldRun: false, reason: '' },  // 30m
  { name: 'side-query-stats', interval: 120, priority: 'low', shouldRun: false, reason: '' },  // 2h
  { name: 'argument-stats', interval: 360, priority: 'low', shouldRun: false, reason: '' },  // 6h
  { name: 'mailbox-check', interval: 60, priority: 'medium', shouldRun: false, reason: '' },  // 1h

  // 新增服务 (2026-04-13)
  { name: 'diagnostic-tracking', interval: 60, priority: 'medium', shouldRun: false, reason: '' },  // 1h
  { name: 'internal-logging', interval: 360, priority: 'low', shouldRun: false, reason: '' },  // 6h
  { name: 'rate-limit-check', interval: 30, priority: 'high', shouldRun: false, reason: '' },  // 30m
  { name: 'mcp-approval-poll', interval: 60, priority: 'medium', shouldRun: false, reason: '' },  // 1h
  { name: 'extract-memories', interval: 120, priority: 'medium', shouldRun: false, reason: '' },  // 2h
  { name: 'tool-use-summary', interval: 60, priority: 'medium', shouldRun: false, reason: '' },  // 1h
]

// ============================================================================
// State Helpers
// ============================================================================

async function loadHeartbeatState(): Promise<Record<string, any>> {
  try {
    const content = await fs.readFile(path.join(MEMORY_DIR, 'heartbeat-state.json'), 'utf-8')
    return JSON.parse(content)
  } catch {
    return { lastChecks: {} }
  }
}

async function saveHeartbeatState(state: Record<string, any>): Promise<void> {
  await fs.writeFile(
    path.join(MEMORY_DIR, 'heartbeat-state.json'),
    JSON.stringify(state, null, 2),
    'utf-8'
  )
}

async function loadDreamState(): Promise<Record<string, any>> {
  try {
    const content = await fs.readFile(path.join(MEMORY_DIR, 'dream-state.json'), 'utf-8')
    return JSON.parse(content)
  } catch {
    return { lastConsolidatedAt: 0, sessionCount: 0 }
  }
}

async function loadCompactState(): Promise<Record<string, any>> {
  try {
    const content = await fs.readFile(path.join(MEMORY_DIR, 'session-memory-compact-state.json'), 'utf-8')
    return JSON.parse(content)
  } catch {
    return { lastCompactAt: 0, stats: {} }
  }
}

// ============================================================================
// Task Checkers
// ============================================================================

function shouldRunTask(task: HeartbeatTask, state: Record<string, any>): boolean {
  const lastCheck = state.lastChecks?.[task.name] || 0
  const now = Date.now()
  const elapsedMs = now - lastCheck
  const intervalMs = task.interval * 60 * 1000
  
  return elapsedMs >= intervalMs
}

function checkAllTasks(state: Record<string, any>): HeartbeatTask[] {
  const now = Date.now()
  
  return TASK_CONFIGS.map(task => {
    const lastCheck = state.lastChecks?.[task.name] || 0
    const elapsedMin = Math.floor((now - lastCheck) / 60_000)
    const shouldRun = elapsedMin >= task.interval
    
    return {
      ...task,
      lastCheck,
      shouldRun,
      reason: shouldRun 
        ? `elapsed: ${elapsedMin}m >= interval: ${task.interval}m`
        : `elapsed: ${elapsedMin}m < interval: ${task.interval}m`
    }
  }).sort((a, b) => {
    // Priority sort: high > medium > low
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

// ============================================================================
// Task Executors
// ============================================================================

async function executeTaskVisualizer(state: Record<string, any>): Promise<TaskResult> {
  const taskTracker = state.taskTracker || { activeTasks: [] }
  
  if (taskTracker.activeTasks.length === 0) {
    return { name: 'task-visualizer', executed: true, success: true, output: 'no active tasks' }
  }
  
  // TODO: 发送飞书卡片
  return { name: 'task-visualizer', executed: true, success: true, output: `${taskTracker.activeTasks.length} tasks active` }
}

async function executeMemoryCompact(state: Record<string, any>): Promise<TaskResult> {
  const compactState = await loadCompactState()
  const lastCompactAt = compactState.lastCompactAt || 0
  const hoursSince = (Date.now() - lastCompactAt) / 3_600_000
  
  if (hoursSince < 24) {
    return { name: 'memory-compact', executed: false, reason: `${Math.floor(hoursSince)}h < 24h` }
  }
  
  // TODO: 实际执行压缩
  return { name: 'memory-compact', executed: true, success: true, output: 'would run compact' }
}

async function executeMemoryMaintenance(state: Record<string, any>): Promise<TaskResult> {
  const lastReview = state.lastMemoryReview
  const hoursSince = lastReview 
    ? (Date.now() - new Date(lastReview).getTime()) / 3_600_000
    : Infinity
  
  if (hoursSince < 2) {
    return { name: 'memory-maintenance', executed: false, reason: `${Math.floor(hoursSince)}h < 2h` }
  }
  
  // TODO: 实际读取 daily notes 并更新 MEMORY.md
  return { name: 'memory-maintenance', executed: true, success: true, output: 'would update MEMORY.md' }
}

async function executeAutoDream(state: Record<string, any>): Promise<TaskResult> {
  const dreamState = await loadDreamState()
  const lastConsolidatedAt = dreamState.lastConsolidatedAt || 0
  const sessionCount = dreamState.sessionCount || 0
  const hoursSince = (Date.now() - lastConsolidatedAt) / 3_600_000
  
  if (hoursSince < 24) {
    return { name: 'auto-dream', executed: false, reason: `time_gate: ${Math.floor(hoursSince)}h < 24h` }
  }
  
  if (sessionCount < 5) {
    return { name: 'auto-dream', executed: false, reason: `session_gate: ${sessionCount} < 5` }
  }
  
  // TODO: 实际运行记忆合并（forked agent）
  return { name: 'auto-dream', executed: true, success: true, output: 'would run consolidation' }
}

async function executeLimitsCheck(state: Record<string, any>): Promise<TaskResult> {
  // TODO: 检查 limits-state.json
  return { name: 'limits-early-warning', executed: true, success: true, output: 'no limits data' }
}

async function executeMemdirCheck(state: Record<string, any>): Promise<TaskResult> {
  // TODO: 检查 memdir-state.json
  return { name: 'memdir-stats-check', executed: true, success: true, output: 'no memdir data' }
}

// ============================================================================
// 新接入的 5 个服务执行函数
// ============================================================================

async function executeBuddyCompanion(state: Record<string, any>): Promise<TaskResult> {
  try {
    const buddyStats = getSystemStats()
    const notifyCheck = shouldNotify()
    return {
      name: 'buddy-companion',
      executed: true,
      success: true,
      output: `Buddy stats: ${JSON.stringify(buddyStats)}, notifyType: ${notifyCheck.type}`
    }
  } catch (e) {
    return { name: 'buddy-companion', executed: true, success: false, error: String(e) }
  }
}

async function executeAwaySummary(state: Record<string, any>): Promise<TaskResult> {
  try {
    awaySummaryService.recordActivity()
    const stats = awaySummaryService.getStats()
    const isAway = stats.lastSeenAt > 0 && (Date.now() - stats.lastSeenAt) > (stats.config?.minAwayMinutes || 30) * 60000
    return {
      name: 'away-summary',
      executed: true,
      success: true,
      output: `Away: ${isAway}, events: ${stats.totalEventsRecorded}`
    }
  } catch (e) {
    return { name: 'away-summary', executed: true, success: false, error: String(e) }
  }
}

async function executeSideQueryStats(state: Record<string, any>): Promise<TaskResult> {
  try {
    const stats = sideQueryService.getStats()
    return {
      name: 'side-query-stats',
      executed: true,
      success: true,
      output: `Queries: ${stats.totalQueries}, completed: ${stats.completedQueries}, failed: ${stats.failedQueries}`
    }
  } catch (e) {
    return { name: 'side-query-stats', executed: true, success: false, error: String(e) }
  }
}

async function executeArgumentStats(state: Record<string, any>): Promise<TaskResult> {
  try {
    const stats = argumentSubstitutionService.getStats()
    return {
      name: 'argument-stats',
      executed: true,
      success: true,
      output: `Substitutions: ${stats.totalSubstitutions}, bindings: ${stats.userBindings}`
    }
  } catch (e) {
    return { name: 'argument-stats', executed: true, success: false, error: String(e) }
  }
}

async function executeMailboxCheck(state: Record<string, any>): Promise<TaskResult> {
  try {
    const stats = teammateMailboxService.getStats()
    return {
      name: 'mailbox-check',
      executed: true,
      success: true,
      output: `Messages: ${stats.totalMessages}, pending: ${stats.pendingMessages}`
    }
  } catch (e) {
    return { name: 'mailbox-check', executed: true, success: false, error: String(e) }
  }
}

// ============================================================================
// 新增服务执行函数 (2026-04-13)
// ============================================================================

async function executeDiagnosticTracking(state: Record<string, any>): Promise<TaskResult> {
  try {
    const newDiagnostics = diagnosticTrackingService.getNewDiagnostics()
    const stats = diagnosticTrackingService.getStats()
    return {
      name: 'diagnostic-tracking',
      executed: true,
      success: true,
      output: `Files: ${stats.filesTracked}, errors: ${stats.errorsFound}, warnings: ${stats.warningsFound}`
    }
  } catch (e) {
    return { name: 'diagnostic-tracking', executed: true, success: false, error: String(e) }
  }
}

async function executeInternalLogging(state: Record<string, any>): Promise<TaskResult> {
  try {
    const stats = internalLoggingService.getStats()
    return {
      name: 'internal-logging',
      executed: true,
      success: true,
      output: `Logs: ${stats.totalLogs}, errors: ${stats.errorsLogged}, warnings: ${stats.warningsLogged}`
    }
  } catch (e) {
    return { name: 'internal-logging', executed: true, success: false, error: String(e) }
  }
}

async function executeRateLimitCheck(state: Record<string, any>): Promise<TaskResult> {
  try {
    const stats = rateLimitMessagesService.getStats()
    const shouldNotify = rateLimitMessagesService.shouldNotify()
    return {
      name: 'rate-limit-check',
      executed: true,
      success: true,
      output: `Checks: ${stats.checksPerformed}, warnings: ${stats.warningsSent}, errors: ${stats.errorsSent}, notify: ${shouldNotify}`
    }
  } catch (e) {
    return { name: 'rate-limit-check', executed: true, success: false, error: String(e) }
  }
}

async function executeMcpApprovalPoll(state: Record<string, any>): Promise<TaskResult> {
  try {
    const pendingApprovals = mcpServerApprovalService.getPendingApprovals()
    const stats = mcpServerApprovalService.getStats()
    return {
      name: 'mcp-approval-poll',
      executed: true,
      success: true,
      output: `Pending: ${pendingApprovals.length}, total: ${stats.totalApprovals}, approved: ${stats.approved}`
    }
  } catch (e) {
    return { name: 'mcp-approval-poll', executed: true, success: false, error: String(e) }
  }
}

async function executeExtractMemories(state: Record<string, any>): Promise<TaskResult> {
  try {
    const stats = extractMemoriesService.getStats()
    return {
      name: 'extract-memories',
      executed: true,
      success: true,
      output: `Extracted: ${stats.totalExtracted}, highImportance: ${stats.highImportance}, sessions: ${stats.sessionsProcessed}`
    }
  } catch (e) {
    return { name: 'extract-memories', executed: true, success: false, error: String(e) }
  }
}

async function executeToolUseSummary(state: Record<string, any>): Promise<TaskResult> {
  try {
    const stats = toolUseSummaryService.getStats()
    const successRate = stats.totalTools > 0 ? Math.floor((stats.successfulTools / stats.totalTools) * 100) : 100
    return {
      name: 'tool-use-summary',
      executed: true,
      success: true,
      output: `Tools: ${stats.totalTools}, successRate: ${successRate}%, summaries: ${stats.summariesGenerated}`
    }
  } catch (e) {
    return { name: 'tool-use-summary', executed: true, success: false, error: String(e) }
  }
}

// ============================================================================
// Main Executor
// ============================================================================

export async function runHeartbeatExecutor(): Promise<HeartbeatCheckResult> {
  const state = await loadHeartbeatState()
  const tasks = checkAllTasks(state)
  const now = Date.now()
  
  // 只执行前 2 个需要运行的任务
  const tasksToRun = tasks.filter(t => t.shouldRun).slice(0, 2)
  
  const results: TaskResult[] = []
  
  for (const task of tasksToRun) {
    let result: TaskResult
    
    switch (task.name) {
      case 'task-visualizer':
        result = await executeTaskVisualizer(state)
        break
      case 'memory-compact':
        result = await executeMemoryCompact(state)
        break
      case 'memory-maintenance':
        result = await executeMemoryMaintenance(state)
        break
      case 'auto-dream':
        result = await executeAutoDream(state)
        break
      case 'limits-early-warning':
        result = await executeLimitsCheck(state)
        break
      case 'memdir-stats-check':
        result = await executeMemdirCheck(state)
        break
      case 'buddy-companion':
        result = await executeBuddyCompanion(state)
        break
      case 'away-summary':
        result = await executeAwaySummary(state)
        break
      case 'side-query-stats':
        result = await executeSideQueryStats(state)
        break
      case 'argument-stats':
        result = await executeArgumentStats(state)
        break
      case 'mailbox-check':
        result = await executeMailboxCheck(state)
        break
      case 'diagnostic-tracking':
        result = await executeDiagnosticTracking(state)
        break
      case 'internal-logging':
        result = await executeInternalLogging(state)
        break
      case 'rate-limit-check':
        result = await executeRateLimitCheck(state)
        break
      case 'mcp-approval-poll':
        result = await executeMcpApprovalPoll(state)
        break
      case 'extract-memories':
        result = await executeExtractMemories(state)
        break
      case 'tool-use-summary':
        result = await executeToolUseSummary(state)
        break
      default:
        result = { name: task.name, executed: false, reason: 'not implemented' }
    }
    
    results.push(result)
    
    // 更新 lastCheck
    state.lastChecks[task.name] = now
  }
  
  // 更新状态
  state.lastHeartbeatCheck = new Date(now).toISOString()
  await saveHeartbeatState(state)
  
  const tasksRun = results.filter(r => r.executed).length
  const overallStatus = tasksRun > 0 ? 'action_taken' : 'ok'
  
  return {
    tasksChecked: tasks.length,
    tasksRun,
    notificationsSent: 0,
    results,
    overallStatus,
  }
}

// ============================================================================
// Quick Check (for heartbeat prompt)
// ============================================================================

export async function quickHeartbeatCheck(): Promise<string> {
  const state = await loadHeartbeatState()
  const tasks = checkAllTasks(state)
  const tasksDue = tasks.filter(t => t.shouldRun)
  
  if (tasksDue.length === 0) {
    return 'HEARTBEAT_OK'
  }
  
  const highPriority = tasksDue.filter(t => t.priority === 'high')
  if (highPriority.length > 0) {
    return `需处理: ${highPriority.map(t => t.name).join(', ')}`
  }
  
  return `待检查: ${tasksDue.slice(0, 2).map(t => t.name).join(', ')}`
}

// ============================================================================
// Stats
// ============================================================================

export function getExecutorStats(): {
  tasksDefined: number
  lastCheckTime: string | null
} {
  return {
    tasksDefined: TASK_CONFIGS.length,
    lastCheckTime: null,  // 从 state 加载
  }
}

export default {
  run: runHeartbeatExecutor,
  quickCheck: quickHeartbeatCheck,
  getStats: getExecutorStats,
}