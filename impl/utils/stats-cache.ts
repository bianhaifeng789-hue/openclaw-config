// @ts-nocheck

/**
 * Stats Cache Pattern - 统计缓存
 * 
 * Source: Claude Code utils/statsCache.ts + utils/statsUtils.ts
 * Pattern: stats caching + heatmap + session stats + aggregation
 */

interface SessionStats {
  sessionId: string
  startTime: number
  endTime?: number
  tokensUsed: number
  toolCalls: number
  messages: number
  errors: number
}

interface AggregatedStats {
  totalSessions: number
  totalTokens: number
  totalToolCalls: number
  totalMessages: number
  totalErrors: number
  averageTokensPerSession: number
  averageToolCallsPerSession: number
  heatmap: number[]
}

class StatsCache {
  private sessionStats = new Map<string, SessionStats>()
  private aggregatedStats: AggregatedStats | null = null
  private heatmap = new Array<number>(24).fill(0) // Hourly heatmap
  private maxSessions = 100
  private lastAggregation = 0
  private aggregationIntervalMs = 60 * 1000 // 1 minute

  /**
   * Record session start
   */
  recordSessionStart(sessionId: string): SessionStats {
    const stats: SessionStats = {
      sessionId,
      startTime: Date.now(),
      tokensUsed: 0,
      toolCalls: 0,
      messages: 0,
      errors: 0
    }

    this.ensureCapacity()
    this.sessionStats.set(sessionId, stats)

    // Update heatmap
    const hour = new Date().getHours()
    this.heatmap[hour]++

    return stats
  }

  /**
   * Record session end
   */
  recordSessionEnd(sessionId: string): boolean {
    const stats = this.sessionStats.get(sessionId)
    if (!stats) return false

    stats.endTime = Date.now()

    return true
  }

  /**
   * Add tokens
   */
  addTokens(sessionId: string, tokens: number): boolean {
    const stats = this.sessionStats.get(sessionId)
    if (!stats) return false

    stats.tokensUsed += tokens

    return true
  }

  /**
   * Add tool call
   */
  addToolCall(sessionId: string): boolean {
    const stats = this.sessionStats.get(sessionId)
    if (!stats) return false

    stats.toolCalls++

    return true
  }

  /**
   * Add message
   */
  addMessage(sessionId: string): boolean {
    const stats = this.sessionStats.get(sessionId)
    if (!stats) return false

    stats.messages++

    return true
  }

  /**
   * Add error
   */
  addError(sessionId: string): boolean {
    const stats = this.sessionStats.get(sessionId)
    if (!stats) return false

    stats.errors++

    return true
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(): void {
    if (this.sessionStats.size >= this.maxSessions) {
      // Evict oldest completed sessions
      const completed = Array.from(this.sessionStats.entries())
        .filter(([, stats]) => stats.endTime)
        .sort((a, b) => a[1].startTime - b[1].startTime)

      if (completed.length > 0) {
        this.sessionStats.delete(completed[0][0])
      }
    }
  }

  /**
   * Aggregate stats
   */
  aggregate(): AggregatedStats {
    const sessions = Array.from(this.sessionStats.values())

    const totalTokens = sessions.reduce((sum, s) => sum + s.tokensUsed, 0)
    const totalToolCalls = sessions.reduce((sum, s) => sum + s.toolCalls, 0)
    const totalMessages = sessions.reduce((sum, s) => sum + s.messages, 0)
    const totalErrors = sessions.reduce((sum, s) => sum + s.errors, 0)

    this.aggregatedStats = {
      totalSessions: sessions.length,
      totalTokens,
      totalToolCalls,
      totalMessages,
      totalErrors,
      averageTokensPerSession: sessions.length > 0 ? totalTokens / sessions.length : 0,
      averageToolCallsPerSession: sessions.length > 0 ? totalToolCalls / sessions.length : 0,
      heatmap: [...this.heatmap]
    }

    this.lastAggregation = Date.now()

    return this.aggregatedStats
  }

  /**
   * Get session stats
   */
  getSessionStats(sessionId: string): SessionStats | undefined {
    return this.sessionStats.get(sessionId)
  }

  /**
   * Get aggregated stats (auto-aggregate if stale)
   */
  getAggregatedStats(): AggregatedStats {
    if (!this.aggregatedStats || Date.now() - this.lastAggregation > this.aggregationIntervalMs) {
      return this.aggregate()
    }

    return this.aggregatedStats
  }

  /**
   * Get heatmap
   */
  getHeatmap(): number[] {
    return [...this.heatmap]
  }

  /**
   * Get stats for time range
   */
  getStatsForRange(start: number, end: number): SessionStats[] {
    return Array.from(this.sessionStats.values())
      .filter(s => s.startTime >= start && s.startTime <= end)
  }

  /**
   * Clear stats
   */
  clear(): void {
    this.sessionStats.clear()
    this.aggregatedStats = null
    this.heatmap = new Array<number>(24).fill(0)
  }

  /**
   * Set max sessions
   */
  setMaxSessions(max: number): void {
    this.maxSessions = max
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.lastAggregation = 0
  }
}

// Global singleton
export const statsCache = new StatsCache()

export default statsCache