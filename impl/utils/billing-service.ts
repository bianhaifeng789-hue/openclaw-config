// @ts-nocheck

/**
 * Billing Service Pattern - 计费服务
 * 
 * Source: Claude Code utils/billing.ts
 * Pattern: billing + usage tracking + cost calculation + quota
 */

interface BillingUsage {
  userId: string
  modelId: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  timestamp: number
}

interface BillingQuota {
  userId: string
  monthlyLimitUsd: number
  usedUsd: number
  periodStart: number
  periodEnd: number
}

interface BillingConfig {
  modelPrices: Record<string, { inputUsd: number; outputUsd: number }> // per 1M tokens
}

class BillingService {
  private usageRecords: BillingUsage[] = []
  private quotas = new Map<string, BillingQuota>()
  private config: BillingConfig = {
    modelPrices: {
      'claude-opus': { inputUsd: 15, outputUsd: 75 },
      'claude-sonnet': { inputUsd: 3, outputUsd: 15 },
      'claude-haiku': { inputUsd: 0.25, outputUsd: 1.25 },
      'default': { inputUsd: 1, outputUsd: 5 }
    }
  }

  /**
   * Record usage
   */
  recordUsage(userId: string, modelId: string, inputTokens: number, outputTokens: number): BillingUsage {
    const price = this.config.modelPrices[modelId] ?? this.config.modelPrices['default']

    const costUsd = (inputTokens / 1_000_000 * price.inputUsd) +
                    (outputTokens / 1_000_000 * price.outputUsd)

    const usage: BillingUsage = {
      userId,
      modelId,
      inputTokens,
      outputTokens,
      costUsd,
      timestamp: Date.now()
    }

    this.usageRecords.push(usage)

    // Update quota
    this.updateQuota(userId, costUsd)

    return usage
  }

  /**
   * Calculate cost
   */
  calculateCost(modelId: string, inputTokens: number, outputTokens: number): number {
    const price = this.config.modelPrices[modelId] ?? this.config.modelPrices['default']

    return (inputTokens / 1_000_000 * price.inputUsd) +
           (outputTokens / 1_000_000 * price.outputUsd)
  }

  /**
   * Set quota
   */
  setQuota(userId: string, monthlyLimitUsd: number): BillingQuota {
    const now = Date.now()
    const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime()

    const quota: BillingQuota = {
      userId,
      monthlyLimitUsd,
      usedUsd: 0,
      periodStart,
      periodEnd
    }

    this.quotas.set(userId, quota)

    return quota
  }

  /**
   * Update quota
   */
  private updateQuota(userId: string, costUsd: number): void {
    const quota = this.quotas.get(userId)
    if (!quota) return

    quota.usedUsd += costUsd
  }

  /**
   * Check quota
   */
  checkQuota(userId: string): { withinQuota: boolean; remainingUsd: number; percentageUsed: number } {
    const quota = this.quotas.get(userId)
    if (!quota) {
      return { withinQuota: true, remainingUsd: Infinity, percentageUsed: 0 }
    }

    const remaining = quota.monthlyLimitUsd - quota.usedUsd
    const percentage = quota.usedUsd / quota.monthlyLimitUsd * 100

    return {
      withinQuota: remaining >= 0,
      remainingUsd: remaining,
      percentageUsed: percentage
    }
  }

  /**
   * Get user usage
   */
  getUserUsage(userId: string): BillingUsage[] {
    return this.usageRecords.filter(u => u.userId === userId)
  }

  /**
   * Get total cost
   */
  getTotalCost(userId?: string): number {
    const records = userId ? this.getUserUsage(userId) : this.usageRecords

    return records.reduce((sum, u) => sum + u.costUsd, 0)
  }

  /**
   * Get stats
   */
  getStats(): {
    totalRecords: number
    totalCostUsd: number
    totalInputTokens: number
    totalOutputTokens: number
    usersWithQuota: number
  } {
    const totalCost = this.usageRecords.reduce((sum, u) => sum + u.costUsd, 0)
    const totalInput = this.usageRecords.reduce((sum, u) => sum + u.inputTokens, 0)
    const totalOutput = this.usageRecords.reduce((sum, u) => sum + u.outputTokens, 0)

    return {
      totalRecords: this.usageRecords.length,
      totalCostUsd: totalCost,
      totalInputTokens: totalInput,
      totalOutputTokens: totalOutput,
      usersWithQuota: this.quotas.size
    }
  }

  /**
   * Set model price
   */
  setModelPrice(modelId: string, inputUsd: number, outputUsd: number): void {
    this.config.modelPrices[modelId] = { inputUsd, outputUsd }
  }

  /**
   * Clear usage records
   */
  clearUsage(): void {
    this.usageRecords = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearUsage()
    this.quotas.clear()
    this.config = {
      modelPrices: {
        'claude-opus': { inputUsd: 15, outputUsd: 75 },
        'claude-sonnet': { inputUsd: 3, outputUsd: 15 },
        'claude-haiku': { inputUsd: 0.25, outputUsd: 1.25 },
        'default': { inputUsd: 1, outputUsd: 5 }
      }
    }
  }
}

// Global singleton
export const billingService = new BillingService()

export default billingService