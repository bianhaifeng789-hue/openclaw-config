// @ts-nocheck

/**
 * Auto Mode Circuit Breaker Pattern - 自动模式熔断器
 * 
 * Source: Claude Code utils/permissions/autoModeState.ts + permissionSetup.ts
 * Pattern: async gate check + enabled/disabled/opt-in + kick-out + undefined cold start
 */

type CircuitState = 'enabled' | 'disabled' | 'opt-in' | 'circuit-broken'

interface CircuitBreakerConfig {
  maxConsecutiveFailures: number
  maxTotalFailures: number
  resetAfterMs: number
  cooldownMs: number
}

class AutoModeCircuitBreaker {
  private state: CircuitState = 'disabled'
  private consecutiveFailures: number = 0
  private totalFailures: number = 0
  private lastFailureTime: number = 0
  private circuitBrokenTime: number = 0

  private config: CircuitBreakerConfig = {
    maxConsecutiveFailures: 3,
    maxTotalFailures: 20,
    resetAfterMs: 30 * 60 * 1000, // 30 minutes
    cooldownMs: 60 * 1000, // 1 minute
  }

  /**
   * Check if auto mode is enabled
   * Returns undefined if cold start (not yet determined)
   */
  isEnabled(): boolean | undefined {
    // Check if circuit broken
    if (this.state === 'circuit-broken') {
      // Check if cooldown elapsed
      if (Date.now() - this.circuitBrokenTime > this.config.cooldownMs) {
        this.state = 'opt-in' // Require opt-in after cooldown
        return false
      }
      return false
    }

    // Cold start - not yet determined
    if (this.state === 'disabled' && this.consecutiveFailures === 0) {
      return undefined
    }

    return this.state === 'enabled'
  }

  /**
   * Enable auto mode
   */
  enable(): void {
    if (this.state === 'circuit-broken') {
      // Can't enable during circuit break
      return
    }
    this.state = 'enabled'
    this.resetFailures()
  }

  /**
   * Disable auto mode
   */
  disable(): void {
    this.state = 'disabled'
  }

  /**
   * Set opt-in state (user needs to explicitly enable)
   */
  setOptIn(): void {
    this.state = 'opt-in'
  }

  /**
   * Record success (reset consecutive failures)
   */
  recordSuccess(): void {
    this.consecutiveFailures = 0
    // Keep total failures for analytics
  }

  /**
   * Record failure (increment counters, potentially break circuit)
   */
  recordFailure(): void {
    this.consecutiveFailures++
    this.totalFailures++
    this.lastFailureTime = Date.now()

    // Check limits
    if (this.consecutiveFailures >= this.config.maxConsecutiveFailures ||
        this.totalFailures >= this.config.maxTotalFailures) {
      this.breakCircuit()
    }
  }

  /**
   * Break circuit (kick out of auto mode)
   */
  breakCircuit(): void {
    this.state = 'circuit-broken'
    this.circuitBrokenTime = Date.now()
    console.warn('[AutoMode] Circuit broken due to excessive failures')
  }

  /**
   * Reset failures
   */
  resetFailures(): void {
    this.consecutiveFailures = 0
    // Don't reset total - keep for analytics
  }

  /**
   * Check if auto mode gate access is allowed
   * Async gate check for dynamic config
   */
  async checkGateAccess(): Promise<boolean> {
    const enabled = this.isEnabled()

    // Cold start - need to determine state
    if (enabled === undefined) {
      // Would check dynamic config here (GrowthBook, env, etc.)
      // For now, default to disabled requiring opt-in
      this.state = 'opt-in'
      return false
    }

    return enabled
  }

  /**
   * Get circuit state
   */
  getState(): CircuitState {
    return this.state
  }

  /**
   * Get failure stats
   */
  getStats(): {
    consecutiveFailures: number
    totalFailures: number
    lastFailureTime: number
    circuitBrokenTime: number | null
  } {
    return {
      consecutiveFailures: this.consecutiveFailures,
      totalFailures: this.totalFailures,
      lastFailureTime: this.lastFailureTime,
      circuitBrokenTime: this.state === 'circuit-broken' ? this.circuitBrokenTime : null
    }
  }

  /**
   * Update config
   */
  setConfig(config: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.state = 'disabled'
    this.consecutiveFailures = 0
    this.totalFailures = 0
    this.lastFailureTime = 0
    this.circuitBrokenTime = 0
  }
}

// Global singleton
export const autoModeCircuitBreaker = new AutoModeCircuitBreaker()

export default autoModeCircuitBreaker