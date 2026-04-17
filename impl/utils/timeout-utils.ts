// @ts-nocheck

/**
 * Timeout Utils Pattern - 超时工具
 * 
 * Source: Claude Code utils/timeouts.ts + utils/envTimeoutConstantsPattern.ts
 * Pattern: env timeout constants + timeout wrapper + deadline + race timeout
 */

interface TimeoutOptions {
  ms: number
  signal?: AbortSignal
  onTimeout?: () => void
}

class TimeoutUtils {
  private config = {
    defaultTimeout: 30000, // 30 seconds
    maxTimeout: 300000, // 5 minutes
    minTimeout: 100 // 100ms
  }

  /**
   * Get timeout from environment
   */
  getEnvTimeout(name: string, defaultValue: number): number {
    const envValue = process.env[name]

    if (!envValue) return defaultValue

    // Parse environment value
    const parsed = this.parseTimeout(envValue)
    return this.validateTimeout(parsed, defaultValue)
  }

  /**
   * Parse timeout string (e.g., "30s", "5m", "1h")
   */
  parseTimeout(value: string): number {
    const match = value.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/)
    if (!match) return parseInt(value) ?? 0

    const num = parseFloat(match[1]!)
    const unit = match[2] ?? 'ms'

    switch (unit) {
      case 'ms': return num
      case 's': return num * 1000
      case 'm': return num * 60 * 1000
      case 'h': return num * 60 * 60 * 1000
      default: return num
    }
  }

  /**
   * Validate timeout within limits
   */
  private validateTimeout(value: number, defaultValue: number): number {
    if (value < this.config.minTimeout) return defaultValue
    if (value > this.config.maxTimeout) return this.config.maxTimeout
    return value
  }

  /**
   * Wrap function with timeout
   */
  async withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        options.onTimeout?.()
        reject(new Error(`Timeout after ${options.ms}ms`))
      }, options.ms)

      // Unref timer
      if (typeof timer.unref === 'function') {
        timer.unref()
      }

      fn()
        .then(result => {
          clearTimeout(timer)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }

  /**
   * Create deadline timeout
   */
  createDeadline(deadlineMs: number): {
    remaining: () => number
    isExpired: () => boolean
    check: () => void
  } {
    const deadline = Date.now() + deadlineMs

    return {
      remaining: () => Math.max(0, deadline - Date.now()),
      isExpired: () => Date.now() >= deadline,
      check: () => {
        if (Date.now() >= deadline) {
          throw new Error('Deadline expired')
        }
      }
    }
  }

  /**
   * Race with timeout
   */
  async raceWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
      if (typeof timer.unref === 'function') timer.unref()
    })

    return Promise.race([promise, timeoutPromise])
  }

  /**
   * Delay with timeout
   */
  async delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms)

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timer)
          reject(new Error('Delay aborted'))
        }, { once: true })
      }

      if (typeof timer.unref === 'function') {
        timer.unref()
      }
    })
  }

  /**
   * Retry with timeout
   */
  async retryWithTimeout<T>(
    fn: () => Promise<T>,
    options: { maxRetries: number; timeoutMs: number; retryDelayMs: number }
  ): Promise<T> {
    let retries = 0

    while (retries < options.maxRetries) {
      try {
        return await this.withTimeout(fn, { ms: options.timeoutMs })
      } catch (e) {
        retries++
        if (retries >= options.maxRetries) throw e
        await this.delay(options.retryDelayMs * retries)
      }
    }

    throw new Error('Max retries exceeded')
  }

  /**
   * Set config
   */
  setConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.config = {
      defaultTimeout: 30000,
      maxTimeout: 300000,
      minTimeout: 100
    }
  }
}

// Global singleton
export const timeoutUtils = new TimeoutUtils()

export default timeoutUtils