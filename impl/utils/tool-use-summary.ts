// @ts-nocheck

/**
 * Tool Use Summary Pattern - 工具使用摘要
 * 
 * Source: Claude Code services/toolUseSummary/index.ts
 * Pattern: tool use summary + execution stats + tool metrics
 */

interface ToolUseRecord {
  toolId: string
  toolName: string
  sessionId: string
  success: boolean
  durationMs: number
  error?: string
  timestamp: number
}

interface ToolUseSummaryResult {
  toolId: string
  totalUses: number
  successCount: number
  failureCount: number
  averageDurationMs: number
  lastUsed: number
}

class ToolUseSummary {
  private records: ToolUseRecord[] = []
  private summaries = new Map<string, ToolUseSummaryResult>()
  private recordCounter = 0

  /**
   * Record tool use
   */
  record(toolId: string, toolName: string, sessionId: string, success: boolean, durationMs: number, error?: string): ToolUseRecord {
    const record: ToolUseRecord = {
      toolId,
      toolName,
      sessionId,
      success,
      durationMs,
      error,
      timestamp: Date.now()
    }

    this.records.push(record)
    this.updateSummary(toolId, success, durationMs)

    return record
  }

  /**
   * Update summary
   */
  private updateSummary(toolId: string, success: boolean, durationMs: number): void {
    const summary = this.summaries.get(toolId) ?? {
      toolId,
      totalUses: 0,
      successCount: 0,
      failureCount: 0,
      averageDurationMs: 0,
      lastUsed: Date.now()
    }

    summary.totalUses++
    if (success) summary.successCount++
    else summary.failureCount++

    // Update average duration
    summary.averageDurationMs =
      (summary.averageDurationMs * (summary.totalUses - 1) + durationMs) / summary.totalUses

    summary.lastUsed = Date.now()

    this.summaries.set(toolId, summary)
  }

  /**
   * Get summary
   */
  getSummary(toolId: string): ToolUseSummaryResult | undefined {
    return this.summaries.get(toolId)
  }

  /**
   * Get all summaries
   */
  getAllSummaries(): ToolUseSummaryResult[] {
    return Array.from(this.summaries.values())
  }

  /**
   * Get records
   */
  getRecords(limit?: number): ToolUseRecord[] {
    const records = [...this.records].reverse()
    return limit ? records.slice(0, limit) : records
  }

  /**
   * Get records by tool
   */
  getRecordsByTool(toolId: string): ToolUseRecord[] {
    return this.records.filter(r => r.toolId === toolId)
  }

  /**
   * Get records by session
   */
  getRecordsBySession(sessionId: string): ToolUseRecord[] {
    return this.records.filter(r => r.sessionId === sessionId)
  }

  /**
   * Get most used tools
   */
  getMostUsed(count: number = 5): ToolUseSummaryResult[] {
    return Array.from(this.summaries.values())
      .sort((a, b) => b.totalUses - a.totalUses)
      .slice(0, count)
  }

  /**
   * Get slowest tools
   */
  getSlowest(count: number = 5): ToolUseSummaryResult[] {
    return Array.from(this.summaries.values())
      .sort((a, b) => b.averageDurationMs - a.averageDurationMs)
      .slice(0, count)
  }

  /**
   * Get success rate
   */
  getSuccessRate(toolId?: string): number {
    if (toolId) {
      const summary = this.summaries.get(toolId)
      if (!summary) return 0

      return summary.totalUses > 0 ? summary.successCount / summary.totalUses : 0
    }

    const allRecords = this.records
    const success = allRecords.filter(r => r.success).length

    return allRecords.length > 0 ? success / allRecords.length : 0
  }

  /**
   * Get stats
   */
  getStats(): {
    recordsCount: number
    summariesCount: number
    totalSuccessCount: number
    totalFailureCount: number
    overallSuccessRate: number
    averageDurationMs: number
  } {
    const records = this.records
    const success = records.filter(r => r.success).length
    const avgDuration = records.length > 0
      ? records.reduce((sum, r) => sum + r.durationMs, 0) / records.length
      : 0

    return {
      recordsCount: records.length,
      summariesCount: this.summaries.size,
      totalSuccessCount: success,
      totalFailureCount: records.length - success,
      overallSuccessRate: this.getSuccessRate(),
      averageDurationMs: avgDuration
    }
  }

  /**
   * Clear old records
   */
  clearOld(thresholdMs: number = 3600000): number {
    const threshold = Date.now() - thresholdMs

    const oldCount = this.records.filter(r => r.timestamp < threshold).length

    this.records = this.records.filter(r => r.timestamp >= threshold)

    return oldCount
  }

  /**
   * Clear all
   */
  clear(): void {
    this.records = []
    this.summaries.clear()
    this.recordCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const toolUseSummary = new ToolUseSummary()

export default toolUseSummary