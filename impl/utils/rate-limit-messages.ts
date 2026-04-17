// @ts-nocheck

/**
 * Rate Limit Messages Pattern - 速率限制消息
 * 
 * Source: Claude Code services/rateLimitMessages.ts + services/mockRateLimits.ts
 * Pattern: rate limit messages + user-friendly + retry suggestion + backoff
 */

type RateLimitType = 'requests' | 'tokens' | 'concurrent' | 'daily'

interface RateLimitMessage {
  type: RateLimitType
  limit: number
  current: number
  remaining: number
  waitTimeMs: number
  message: string
  suggestion: string
}

class RateLimitMessages {
  /**
   * Generate rate limit message
   */
  generate(type: RateLimitType, limit: number, current: number, waitTimeMs: number): RateLimitMessage {
    const remaining = Math.max(0, limit - current)

    return {
      type,
      limit,
      current,
      remaining,
      waitTimeMs,
      message: this.getMessage(type, limit, current, waitTimeMs),
      suggestion: this.getSuggestion(type, waitTimeMs)
    }
  }

  /**
   * Get user-friendly message
   */
  private getMessage(type: RateLimitType, limit: number, current: number, waitTimeMs: number): string {
    const waitTimeStr = this.formatWaitTime(waitTimeMs)

    switch (type) {
      case 'requests':
        return `API rate limit reached. You've made ${current}/${limit} requests. Please wait ${waitTimeStr}.`

      case 'tokens':
        return `Token limit reached. You've used ${current}/${limit} tokens. Please wait ${waitTimeStr}.`

      case 'concurrent':
        return `Too many concurrent requests. Maximum ${limit} simultaneous requests allowed. Please wait for a request to complete.`

      case 'daily':
        return `Daily limit reached. You've used your quota for today. Limit resets in ${waitTimeStr}.`

      default:
        return `Rate limit reached. Please wait ${waitTimeStr}.`
    }
  }

  /**
   * Get suggestion
   */
  private getSuggestion(type: RateLimitType, waitTimeMs: number): string {
    const waitTimeStr = this.formatWaitTime(waitTimeMs)

    switch (type) {
      case 'requests':
        return `Try again in ${waitTimeStr}, or reduce request frequency.`

      case 'tokens':
        return `Wait ${waitTimeStr} or reduce message length to use fewer tokens.`

      case 'concurrent':
        return `Wait for current requests to complete before starting new ones.`

      case 'daily':
        return `Your quota will reset automatically. Consider optimizing token usage for tomorrow.`

      default:
        return `Retry after ${waitTimeStr}.`
    }
  }

  /**
   * Format wait time
   */
  private formatWaitTime(ms: number): string {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60 * 1000) return `${Math.ceil(ms / 1000)} seconds`
    if (ms < 60 * 60 * 1000) return `${Math.ceil(ms / (60 * 1000))} minutes`
    return `${Math.ceil(ms / (60 * 60 * 1000))} hours`
  }

  /**
   * Format for display (compact)
   */
  formatCompact(message: RateLimitMessage): string {
    const waitStr = this.formatWaitTime(message.waitTimeMs)

    switch (message.type) {
      case 'requests':
        return `⏳ Rate limit: ${message.current}/${message.limit} requests. Wait ${waitStr}.`

      case 'tokens':
        return `⏳ Token limit: ${message.current}/${message.limit}. Wait ${waitStr}.`

      case 'concurrent':
        return `⏳ Concurrent limit: ${message.current}/${message.limit}.`

      case 'daily':
        return `⏳ Daily limit reached. Resets in ${waitStr}.`

      default:
        return `⏳ Rate limit. Wait ${waitStr}.`
    }
  }

  /**
   * Get retry header for HTTP
   */
  getRetryHeader(waitTimeMs: number): string {
    return `Retry-After: ${Math.ceil(waitTimeMs / 1000)}`
  }

  /**
   * Check if retryable
   */
  isRetryable(type: RateLimitType): boolean {
    return type !== 'daily' // Daily limits are not retryable within same day
  }

  /**
   * Get backoff strategy
   */
  getBackoffStrategy(attempt: number, maxAttempts: number): number {
    // Exponential backoff with jitter
    const baseMs = 1000
    const maxMs = 60 * 1000 // 1 minute max

    const exponential = Math.min(baseMs * Math.pow(2, attempt), maxMs)
    const jitter = Math.random() * 100

    return Math.floor(exponential + jitter)
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    // No state
  }
}

// Global singleton
export const rateLimitMessages = new RateLimitMessages()

export default rateLimitMessages