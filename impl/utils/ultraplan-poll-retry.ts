// @ts-nocheck

/**
 * Ultraplan Poll Network Retry Pattern - 网络轮询重试
 * 
 * Source: Claude Code utils/ultraplan/ccrSession.ts
 * Pattern: MAX_FAILURES 5 + isTransientNetworkError + failures reset on success + exponential backoff
 */

type NetworkErrorType = 'timeout' | 'connection_refused' | 'dns_failure' | 'ssl_error' | 'unknown'

interface PollConfig {
  maxFailures: number // Default: 5
  baseDelayMs: number // Default: 1000
  maxDelayMs: number // Default: 30000
  backoffMultiplier: number // Default: 2
}

interface PollState {
  consecutiveFailures: number
  totalFailures: number
  lastFailureTime: number
  lastError?: Error
  currentDelayMs: number
}

class UltraplanPollRetry {
  private state: PollState = {
    consecutiveFailures: 0,
    totalFailures: 0,
    lastFailureTime: 0,
    currentDelayMs: 1000
  }

  private config: PollConfig = {
    maxFailures: 5,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2
  }

  /**
   * Poll with retry logic
   */
  async poll<T>(fn: () => Promise<T>): Promise<T> {
    // Check if too many failures
    if (this.state.consecutiveFailures >= this.config.maxFailures) {
      throw new Error(`Poll aborted: ${this.state.consecutiveFailures} consecutive failures`)
    }

    try {
      const result = await fn()

      // Success: reset failures
      this.resetFailures()

      return result
    } catch (error) {
      this.recordFailure(error as Error)

      // Check if transient
      if (this.isTransientNetworkError(error as Error)) {
        // Wait with exponential backoff
        await this.waitWithBackoff()

        // Retry
        return this.poll(fn)
      }

      // Non-transient: throw
      throw error
    }
  }

  /**
   * Check if error is transient network error
   */
  private isTransientNetworkError(error: Error): boolean {
    const message = error.message.toLowerCase()

    // Transient errors
    const transientPatterns = [
      'timeout',
      'etimedout',
      'econnreset',
      'econnrefused',
      'enotfound', // DNS
      'socket hang up',
      'network',
      'temporary',
      'rate limit',
      '429',
      '503',
      '502'
    ]

    for (const pattern of transientPatterns) {
      if (message.includes(pattern)) {
        return true
      }
    }

    // Check error code
    const code = (error as any).code
    const transientCodes = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN']

    if (transientCodes.includes(code)) {
      return true
    }

    return false
  }

  /**
   * Record failure
   */
  private recordFailure(error: Error): void {
    this.state.consecutiveFailures++
    this.state.totalFailures++
    this.state.lastFailureTime = Date.now()
    this.state.lastError = error

    console.warn(`[PollRetry] Failure ${this.state.consecutiveFailures}: ${error.message}`)
  }

  /**
   * Reset failures on success
   */
  private resetFailures(): void {
    if (this.state.consecutiveFailures > 0) {
      console.log(`[PollRetry] Success after ${this.state.consecutiveFailures} failures`)
    }
    this.state.consecutiveFailures = 0
    this.state.currentDelayMs = this.config.baseDelayMs
    this.state.lastError = undefined
  }

  /**
   * Wait with exponential backoff
   */
  private async waitWithBackoff(): Promise<void> {
    // Calculate delay
    const delay = Math.min(
      this.state.currentDelayMs * this.config.backoffMultiplier,
      this.config.maxDelayMs
    )

    this.state.currentDelayMs = delay

    console.log(`[PollRetry] Waiting ${delay}ms before retry`)

    await this.sleep(delay)
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get current state
   */
  getState(): PollState {
    return { ...this.state }
  }

  /**
   * Get config
   */
  getConfig(): PollConfig {
    return { ...this.config }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<PollConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.state = {
      consecutiveFailures: 0,
      totalFailures: 0,
      lastFailureTime: 0,
      currentDelayMs: this.config.baseDelayMs
    }
  }
}

// Global singleton
export const ultraplanPollRetry = new UltraplanPollRetry()

export default ultraplanPollRetry