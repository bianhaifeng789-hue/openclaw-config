// @ts-nocheck
/**
 * Analytics Service - 分析服务
 * 
 * 借鉴 Claude Code 的 analytics 系统：
 * - analytics/events.ts 的事件定义
 * - analytics/growthbook.ts 的远程配置
 * - 事件日志和导出
 * 
 * OpenClaw 适配：
 * - 飞书场景下的分析
 * - 与 session tracing 整合
 */

import { sessionTracing, getTracingSummary } from './session-tracing'

// ============================================================================
// Event Types
// ============================================================================

/**
 * Analytics Event Type - 分析事件类型
 */
export type AnalyticsEventType =
  | 'session_start'
  | 'session_end'
  | 'message_sent'
  | 'message_received'
  | 'tool_used'
  | 'api_call'
  | 'cache_hit'
  | 'cache_miss'
  | 'compact_triggered'
  | 'memory_extracted'
  | 'permission_denied'
  | 'permission_allowed'
  | 'fork_agent_spawned'
  | 'fork_agent_completed'
  | 'heartbeat_check'
  | 'skill_loaded'
  | 'error_occurred'

/**
 * Analytics Event - 分析事件
 */
export interface AnalyticsEvent {
  /** 事件类型 */
  eventType: AnalyticsEventType
  /** 时间戳 */
  timestamp: number
  /** 会话 ID */
  sessionId?: string
  /** 用户 ID */
  userId?: string
  /** 事件数据 */
  data: Record<string, unknown>
  /** 元数据 */
  metadata?: Record<string, unknown>
}

// ============================================================================
// Event Logger
// ============================================================================

// 事件存储（内存缓存）
const analyticsEvents: AnalyticsEvent[] = []

// 事件计数器
const eventCounts: Map<AnalyticsEventType, number> = new Map()

/**
 * Log Analytics Event
 * 
 * 记录分析事件
 */
export function logAnalyticsEvent(
  eventType: AnalyticsEventType,
  data: Record<string, unknown>,
  sessionId?: string,
  userId?: string,
  metadata?: Record<string, unknown>
): void {
  const event: AnalyticsEvent = {
    eventType,
    timestamp: Date.now(),
    sessionId,
    userId,
    data,
    metadata
  }
  
  analyticsEvents.push(event)
  
  // 更新计数
  const count = eventCounts.get(eventType) ?? 0
  eventCounts.set(eventType, count + 1)
  
  // 限制数量
  if (analyticsEvents.length > 5000) {
    analyticsEvents.shift()
  }
}

/**
 * Get Event Counts
 * 
 * 获取事件计数
 */
export function getEventCounts(): Record<AnalyticsEventType, number> {
  const counts: Record<string, number> = {}
  
  for (const [type, count] of eventCounts.entries()) {
    counts[type] = count
  }
  
  return counts as Record<AnalyticsEventType, number>
}

/**
 * Get Recent Events
 * 
 * 获取最近事件
 */
export function getRecentEvents(limit: number = 100): AnalyticsEvent[] {
  return analyticsEvents.slice(-limit)
}

// ============================================================================
// Specialized Event Logging
// ============================================================================

/**
 * Log Session Start
 */
export function logSessionStart(
  sessionId: string,
  channel?: string,
  userId?: string
): void {
  logAnalyticsEvent('session_start', {
    channel,
    startTime: Date.now()
  }, sessionId, userId)
}

/**
 * Log Session End
 */
export function logSessionEnd(
  sessionId: string,
  durationMs: number,
  messageCount: number,
  toolCallCount: number,
  totalTokens: number
): void {
  logAnalyticsEvent('session_end', {
    durationMs,
    messageCount,
    toolCallCount,
    totalTokens
  }, sessionId)
}

/**
 * Log Tool Usage
 */
export function logToolUsage(
  toolName: string,
  success: boolean,
  durationMs: number,
  sessionId?: string
): void {
  logAnalyticsEvent('tool_used', {
    toolName,
    success,
    durationMs
  }, sessionId)
}

/**
 * Log API Call
 */
export function logApiCall(
  model: string,
  inputTokens: number,
  outputTokens: number,
  latencyMs: number,
  cacheHit: boolean,
  sessionId?: string
): void {
  logAnalyticsEvent('api_call', {
    model,
    inputTokens,
    outputTokens,
    latencyMs,
    cacheHit,
    totalTokens: inputTokens + outputTokens
  }, sessionId)
}

/**
 * Log Cache Event
 */
export function logCacheEvent(
  isHit: boolean,
  tokensSaved: number,
  sessionId?: string
): void {
  logAnalyticsEvent(
    isHit ? 'cache_hit' : 'cache_miss',
    { tokensSaved },
    sessionId
  )
}

/**
 * Log Permission Decision
 */
export function logPermissionDecision(
  operation: string,
  decision: 'allow' | 'deny',
  reason: string,
  sessionId?: string
): void {
  logAnalyticsEvent(
    decision === 'allow' ? 'permission_allowed' : 'permission_denied',
    { operation, reason },
    sessionId
  )
}

/**
 * Log Forked Agent
 */
export function logForkedAgent(
  label: string,
  success: boolean,
  durationMs: number,
  cacheHit: boolean,
  sessionId?: string
): void {
  logAnalyticsEvent(
    success ? 'fork_agent_completed' : 'error_occurred',
    { label, durationMs, cacheHit },
    sessionId
  )
}

/**
 * Log Error
 */
export function logError(
  errorType: string,
  errorMessage: string,
  context?: Record<string, unknown>,
  sessionId?: string
): void {
  logAnalyticsEvent('error_occurred', {
    errorType,
    errorMessage,
    ...context
  }, sessionId)
}

// ============================================================================
// Analytics Report
// ============================================================================

/**
 * Analytics Report - 分析报告
 */
export interface AnalyticsReport {
  generatedAt: number
  periodStart: number
  periodEnd: number
  summary: {
    totalSessions: number
    totalEvents: number
    totalMessages: number
    totalToolCalls: number
    totalApiCalls: number
    totalTokens: number
    avgSessionDurationMs: number
    cacheHitRate: number
    errorRate: number
  }
  eventCounts: Record<string, number>
  topTools: Array<{ tool: string; count: number }>
  topModels: Array<{ model: string; count: number }>
  errorBreakdown: Array<{ errorType: string; count: number }>
}

/**
 * Generate Analytics Report
 * 
 * 生成分析报告
 */
export function generateAnalyticsReport(
  periodStart: number,
  periodEnd: number
): AnalyticsReport {
  // 过滤时间范围内的事件
  const eventsInRange = analyticsEvents.filter(
    e => e.timestamp >= periodStart && e.timestamp <= periodEnd
  )
  
  // 计算摘要
  const sessionStarts = eventsInRange.filter(e => e.eventType === 'session_start')
  const sessionEnds = eventsInRange.filter(e => e.eventType === 'session_end')
  const apiCalls = eventsInRange.filter(e => e.eventType === 'api_call')
  const cacheHits = eventsInRange.filter(e => e.eventType === 'cache_hit')
  const cacheMisses = eventsInRange.filter(e => e.eventType === 'cache_miss')
  const errors = eventsInRange.filter(e => e.eventType === 'error_occurred')
  
  // 工具使用统计
  const toolUsageCounts: Map<string, number> = new Map()
  for (const event of eventsInRange.filter(e => e.eventType === 'tool_used')) {
    const toolName = event.data.toolName as string
    const count = toolUsageCounts.get(toolName) ?? 0
    toolUsageCounts.set(toolName, count + 1)
  }
  
  // 模型使用统计
  const modelUsageCounts: Map<string, number> = new Map()
  for (const event of apiCalls) {
    const model = event.data.model as string
    const count = modelUsageCounts.get(model) ?? 0
    modelUsageCounts.set(model, count + 1)
  }
  
  // 错误统计
  const errorCounts: Map<string, number> = new Map()
  for (const event of errors) {
    const errorType = event.data.errorType as string
    const count = errorCounts.get(errorType) ?? 0
    errorCounts.set(errorType, count + 1)
  }
  
  return {
    generatedAt: Date.now(),
    periodStart,
    periodEnd,
    summary: {
      totalSessions: sessionStarts.length,
      totalEvents: eventsInRange.length,
      totalMessages: eventsInRange.filter(e => e.eventType === 'message_sent').length,
      totalToolCalls: eventsInRange.filter(e => e.eventType === 'tool_used').length,
      totalApiCalls: apiCalls.length,
      totalTokens: apiCalls.reduce((sum, e) => sum + (e.data.totalTokens as number ?? 0), 0),
      avgSessionDurationMs: sessionEnds.length > 0
        ? sessionEnds.reduce((sum, e) => sum + (e.data.durationMs as number ?? 0), 0) / sessionEnds.length
        : 0,
      cacheHitRate: (cacheHits.length + cacheMisses.length) > 0
        ? cacheHits.length / (cacheHits.length + cacheMisses.length)
        : 0,
      errorRate: eventsInRange.length > 0
        ? errors.length / eventsInRange.length
        : 0
    },
    eventCounts: getEventCounts(),
    topTools: Array.from(toolUsageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tool, count]) => ({ tool, count })),
    topModels: Array.from(modelUsageCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([model, count]) => ({ model, count })),
    errorBreakdown: Array.from(errorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([errorType, count]) => ({ errorType, count }))
  }
}

// ============================================================================
// Integration with Session Tracing
// ============================================================================

/**
 * Create Tracing Analytics Bridge
 * 
 * 创建追踪与分析的桥接
 */
export function createTracingAnalyticsBridge(): {
  onSessionStart: (sessionId: string, channel?: string, userId?: string) => void
  onSessionEnd: (sessionId: string) => void
  onToolCall: (toolName: string, success: boolean, durationMs: number) => void
  onApiCall: (model: string, inputTokens: number, outputTokens: number, latencyMs: number, cacheHit: boolean) => void
} {
  return {
    onSessionStart: (sessionId, channel, userId) => {
      logSessionStart(sessionId, channel, userId)
    },
    onSessionEnd: (sessionId) => {
      const trace = sessionTracing.getSessionTrace(sessionId)
      if (trace) {
        logSessionEnd(
          sessionId,
          trace.totalDurationMs ?? 0,
          trace.events.filter(e => e.type === 'message_sent').length,
          trace.toolStats?.callCount ?? 0,
          trace.apiStats?.totalTokens ?? 0
        )
      }
    },
    onToolCall: (toolName, success, durationMs) => {
      logToolUsage(toolName, success, durationMs, currentChain?.sessionId)
    },
    onApiCall: (model, inputTokens, outputTokens, latencyMs, cacheHit) => {
      logApiCall(model, inputTokens, outputTokens, latencyMs, cacheHit, currentChain?.sessionId)
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export const analyticsService = {
  // Event Logging
  logAnalyticsEvent,
  logSessionStart,
  logSessionEnd,
  logToolUsage,
  logApiCall,
  logCacheEvent,
  logPermissionDecision,
  logForkedAgent,
  logError,
  
  // Querying
  getEventCounts,
  getRecentEvents,
  
  // Reports
  generateAnalyticsReport,
  
  // Integration
  createTracingAnalyticsBridge,
  
  // Types
}

export default analyticsService