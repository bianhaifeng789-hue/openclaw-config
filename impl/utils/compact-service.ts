// @ts-nocheck

/**
 * Compact Service Pattern - 紧凑服务
 * 
 * Source: Claude Code services/compact/compact.ts + services/compact/autoCompact.ts
 * Pattern: compact summary + auto compact + token threshold + summarization
 */

interface CompactConfig {
  tokenThreshold: number // Trigger compact when above this
  maxSummaryTokens: number
  preserveRecentMessages: number
}

interface CompactResult {
  originalTokens: number
  compactedTokens: number
  reductionRatio: number
  preservedMessages: number
  summaryGenerated: boolean
  timestamp: number
}

class CompactService {
  private compactHistory: CompactResult[] = []
  private totalCompacted = 0
  private isCompacting = false

  private config: CompactConfig = {
    tokenThreshold: 150000, // 150k tokens
    maxSummaryTokens: 50000,
    preserveRecentMessages: 10
  }

  /**
   * Check if should compact
   */
  shouldCompact(currentTokens: number): boolean {
    return currentTokens >= this.config.tokenThreshold && !this.isCompacting
  }

  /**
   * Run compact
   */
  async compact(messages: Array<{ role: string; content: string; tokens: number }>): Promise<CompactResult> {
    if (this.isCompacting) {
      throw new Error('Compact already in progress')
    }

    this.isCompacting = true
    const startTime = Date.now()

    try {
      // Calculate original tokens
      const originalTokens = messages.reduce((sum, m) => sum + m.tokens, 0)

      // Preserve recent messages
      const preservedMessages = messages.slice(-this.config.preserveRecentMessages)

      // Summarize older messages
      const olderMessages = messages.slice(0, -this.config.preserveRecentMessages)
      const summary = this.generateSummary(olderMessages)

      // Calculate compacted tokens
      const preservedTokens = preservedMessages.reduce((sum, m) => sum + m.tokens, 0)
      const summaryTokens = Math.min(this.config.maxSummaryTokens, Math.floor(summary.length / 4))
      const compactedTokens = preservedTokens + summaryTokens

      const reductionRatio = (originalTokens - compactedTokens) / originalTokens

      const result: CompactResult = {
        originalTokens,
        compactedTokens,
        reductionRatio,
        preservedMessages: preservedMessages.length,
        summaryGenerated: summary.length > 0,
        timestamp: startTime
      }

      this.compactHistory.push(result)
      this.totalCompacted++

      return result
    } finally {
      this.isCompacting = false
    }
  }

  /**
   * Generate summary from messages
   */
  private generateSummary(messages: Array<{ role: string; content: string }>): string {
    // Would use LLM for summarization
    // For demo, return simple concatenation
    const keyPoints = messages.slice(0, 5).map(m => m.content.slice(0, 100))
    return `Summary: ${keyPoints.join('; ')}`
  }

  /**
   * Get compact history
   */
  getHistory(): CompactResult[] {
    return [...this.compactHistory]
  }

  /**
   * Get stats
   */
  getStats(): {
    totalCompacted: number
    averageReduction: number
    lastCompactTime: number | null
    config: CompactConfig
  } {
    const averageReduction = this.compactHistory.length > 0
      ? this.compactHistory.reduce((sum, r) => sum + r.reductionRatio, 0) / this.compactHistory.length
      : 0

    const lastCompactTime = this.compactHistory.length > 0
      ? this.compactHistory[this.compactHistory.length - 1].timestamp
      : null

    return {
      totalCompacted: this.totalCompacted,
      averageReduction,
      lastCompactTime,
      config: { ...this.config }
    }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<CompactConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.compactHistory = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.compactHistory = []
    this.totalCompacted = 0
    this.isCompacting = false
    this.config = {
      tokenThreshold: 150000,
      maxSummaryTokens: 50000,
      preserveRecentMessages: 10
    }
  }
}

// Global singleton
export const compactService = new CompactService()

export default compactService