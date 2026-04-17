// @ts-nocheck

/**
 * Cost Tracker Pattern - 成本追踪器
 * 
 * Source: Claude Code utils/cost-tracker.ts + costHook.ts
 * Pattern: cost tracking + per-session + per-model + aggregation + budget
 */

interface CostEntry {
  sessionId: string
  modelId: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  timestamp: number
}

interface CostSummary {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  sessionCount: number
  modelCounts: Record<string, number>
}

class CostTracker {
  private entries: CostEntry[] = []
  private sessionCosts = new Map<string, number>()
  private modelCosts = new Map<string, number>()
  private dailyBudget = 100 // USD
  private maxEntries = 1000

  // Model pricing (USD per 1M tokens)
  private pricing = new Map<string, { input: number; output: number }>([
    ['claude-3-opus', { input: 15, output: 75 }],
    ['claude-3-sonnet', { input: 3, output: 15 }],
    ['claude-3-haiku', { input: 0.25, output: 1.25 }],
    ['gpt-4', { input: 30, output: 60 }],
    ['gpt-4-turbo', { input: 10, output: 30 }],
    ['gpt-3.5-turbo', { input: 0.5, output: 1.5 }]
  ])

  /**
   * Record cost
   */
  record(sessionId: string, modelId: string, inputTokens: number, outputTokens: number): CostEntry {
    const cost = this.calculateCost(modelId, inputTokens, outputTokens)

    const entry: CostEntry = {
      sessionId,
      modelId,
      inputTokens,
      outputTokens,
      costUsd: cost,
      timestamp: Date.now()
    }

    this.entries.push(entry)
    this.ensureCapacity()

    // Update session cost
    const sessionCost = this.sessionCosts.get(sessionId) ?? 0
    this.sessionCosts.set(sessionId, sessionCost + cost)

    // Update model cost
    const modelCost = this.modelCosts.get(modelId) ?? 0
    this.modelCosts.set(modelId, modelCost + cost)

    return entry
  }

  /**
   * Calculate cost
   */
  private calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.pricing.get(modelId) ?? { input: 1, output: 2 }

    const inputCost = (inputTokens / 1000000) * pricing.input
    const outputCost = (outputTokens / 1000000) * pricing.output

    return inputCost + outputCost
  }

  /**
   * Get session cost
   */
  getSessionCost(sessionId: string): number {
    return this.sessionCosts.get(sessionId) ?? 0
  }

  /**
   * Get model cost
   */
  getModelCost(modelId: string): number {
    return this.modelCosts.get(modelId) ?? 0
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.costUsd, 0)
  }

  /**
   * Get summary
   */
  getSummary(): CostSummary {
    const totalCost = this.getTotalCost()
    const totalInputTokens = this.entries.reduce((sum, e) => sum + e.inputTokens, 0)
    const totalOutputTokens = this.entries.reduce((sum, e) => sum + e.outputTokens, 0)
    const sessionCount = new Set(this.entries.map(e => e.sessionId)).size

    const modelCounts: Record<string, number> = {}
    for (const [model, cost] of this.modelCosts) {
      modelCounts[model] = cost
    }

    return {
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      sessionCount,
      modelCounts
    }
  }

  /**
   * Check budget
   */
  isWithinBudget(): boolean {
    return this.getTotalCost() <= this.dailyBudget
  }

  /**
   * Get remaining budget
   */
  getRemainingBudget(): number {
    return Math.max(0, this.dailyBudget - this.getTotalCost())
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(): void {
    while (this.entries.length > this.maxEntries) {
      const removed = this.entries.shift()
      if (removed) {
        // Update session/model costs
        const sessionCost = this.sessionCosts.get(removed.sessionId) ?? 0
        this.sessionCosts.set(removed.sessionId, sessionCost - removed.costUsd)

        const modelCost = this.modelCosts.get(removed.modelId) ?? 0
        this.modelCosts.set(removed.modelId, modelCost - removed.costUsd)
      }
    }
  }

  /**
   * Get entries for time range
   */
  getEntriesForRange(start: number, end: number): CostEntry[] {
    return this.entries.filter(e => e.timestamp >= start && e.timestamp <= end)
  }

  /**
   * Set pricing
   */
  setPricing(modelId: string, input: number, output: number): void {
    this.pricing.set(modelId, { input, output })
  }

  /**
   * Set daily budget
   */
  setDailyBudget(budget: number): void {
    this.dailyBudget = budget
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries = []
    this.sessionCosts.clear()
    this.modelCosts.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.dailyBudget = 100
  }
}

// Global singleton
export const costTracker = new CostTracker()

export default costTracker