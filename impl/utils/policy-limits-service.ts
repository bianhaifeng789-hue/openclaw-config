// @ts-nocheck

/**
 * Policy Limits Service Pattern - 策略限制服务
 * 
 * Source: Claude Code services/policyLimits/index.ts
 * Pattern: policy limits + usage limits + quota + enforcement
 */

interface PolicyLimit {
  key: string
  limit: number
  used: number
  period: 'daily' | 'weekly' | 'monthly' | 'session'
  enforcement: 'strict' | 'warning' | 'soft'
  resetTime: number
}

interface LimitCheckResult {
  withinLimit: boolean
  remaining: number
  warning?: string
  resetTime: number
}

class PolicyLimitsService {
  private limits = new Map<string, PolicyLimit>()
  private usageHistory = new Map<string, number[]>()

  /**
   * Set policy limit
   */
  setLimit(key: string, limit: number, period: PolicyLimit['period'], enforcement: PolicyLimit['enforcement'] = 'strict'): void {
    const resetTime = this.calculateResetTime(period)

    this.limits.set(key, {
      key,
      limit,
      used: 0,
      period,
      enforcement,
      resetTime
    })
  }

  /**
   * Calculate reset time
   */
  private calculateResetTime(period: PolicyLimit['period']): number {
    const now = Date.now()

    switch (period) {
      case 'daily':
        return now + 24 * 60 * 60 * 1000
      case 'weekly':
        return now + 7 * 24 * 60 * 60 * 1000
      case 'monthly':
        return now + 30 * 24 * 60 * 60 * 1000
      case 'session':
        return now + 8 * 60 * 60 * 1000 // 8 hours
      default:
        return now + 24 * 60 * 60 * 1000
    }
  }

  /**
   * Check if within limit
   */
  check(key: string, increment = 0): LimitCheckResult {
    const limit = this.limits.get(key)

    if (!limit) {
      return {
        withinLimit: true,
        remaining: Infinity,
        resetTime: Date.now() + 24 * 60 * 60 * 1000
      }
    }

    // Check if reset needed
    if (Date.now() >= limit.resetTime) {
      this.resetLimit(key)
    }

    const projected = limit.used + increment
    const withinLimit = projected <= limit.limit
    const remaining = Math.max(0, limit.limit - projected)

    let warning: string | undefined

    if (limit.enforcement === 'warning' && remaining < limit.limit * 0.1) {
      warning = `Approaching limit: ${remaining} remaining`
    }

    if (!withinLimit && limit.enforcement === 'strict') {
      warning = `Limit exceeded: ${limit.limit} limit`
    }

    return {
      withinLimit: limit.enforcement === 'soft' || withinLimit,
      remaining,
      warning,
      resetTime: limit.resetTime
    }
  }

  /**
   * Increment usage
   */
  increment(key: string, amount = 1): LimitCheckResult {
    const limit = this.limits.get(key)

    if (!limit) {
      return this.check(key, amount)
    }

    // Check if reset needed
    if (Date.now() >= limit.resetTime) {
      this.resetLimit(key)
    }

    const result = this.check(key, amount)

    if (result.withinLimit) {
      limit.used += amount

      // Track history
      const history = this.usageHistory.get(key) ?? []
      history.push(limit.used)
      this.usageHistory.set(key, history.slice(-100)) // Keep last 100
    }

    return result
  }

  /**
   * Reset limit
   */
  private resetLimit(key: string): void {
    const limit = this.limits.get(key)
    if (!limit) return

    limit.used = 0
    limit.resetTime = this.calculateResetTime(limit.period)
  }

  /**
   * Get limit info
   */
  getLimit(key: string): PolicyLimit | undefined {
    return this.limits.get(key)
  }

  /**
   * Get usage history
   */
  getHistory(key: string): number[] {
    return this.usageHistory.get(key) ?? []
  }

  /**
   * Get all limits
   */
  getAllLimits(): PolicyLimit[] {
    return Array.from(this.limits.values())
  }

  /**
   * Get stats
   */
  getStats(): {
    totalLimits: number
    exceededLimits: number
    approachingLimits: number
  } {
    let exceeded = 0
    let approaching = 0

    for (const limit of this.limits.values()) {
      if (limit.used > limit.limit) exceeded++
      if (limit.used > limit.limit * 0.9) approaching++
    }

    return {
      totalLimits: this.limits.size,
      exceededLimits: exceeded,
      approachingLimits: approaching
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.limits.clear()
    this.usageHistory.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const policyLimitsService = new PolicyLimitsService()

// Set default limits
policyLimitsService.setLimit('tokens_per_day', 1000000, 'daily', 'warning')
policyLimitsService.setLimit('requests_per_hour', 100, 'daily', 'strict')
policyLimitsService.setLimit('concurrent_sessions', 5, 'session', 'strict')

export default policyLimitsService