// @ts-nocheck

/**
 * Completion Cache Pattern - 补全缓存
 * 
 * Source: Claude Code utils/completionCache.ts
 * Pattern: completion cache + completion caching + autocomplete + suggestions cache
 */

interface CompletionCacheEntry {
  key: string
  completions: string[]
  cachedAt: number
  accessedAt: number
  accessCount: number
}

class CompletionCacheService {
  private cache = new Map<string, CompletionCacheEntry>()
  private cacheTTL = 300000 // 5 minutes
  private maxSize = 1000

  /**
   * Cache completions
   */
  cacheCompletions(key: string, completions: string[]): CompletionCacheEntry {
    const entry: CompletionCacheEntry = {
      key,
      completions,
      cachedAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0
    }

    // Evict oldest if over max size
    if (this.cache.size >= this.maxSize) {
      const oldest = Array.from(this.cache.values())
        .sort((a, b) => a.accessedAt - b.accessedAt)[0]

      if (oldest) this.cache.delete(oldest.key)
    }

    this.cache.set(key, entry)

    return entry
  }

  /**
   * Get completions
   */
  get(key: string): string[] | undefined {
    const entry = this.cache.get(key)

    if (!entry) return undefined

    // Check TTL
    if (Date.now() - entry.cachedAt > this.cacheTTL) {
      this.cache.delete(key)
      return undefined
    }

    entry.accessedAt = Date.now()
    entry.accessCount++

    return entry.completions
  }

  /**
   * Has completions
   */
  has(key: string): boolean {
    return this.get(key) !== undefined
  }

  /**
   * Invalidate key
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * Invalidate pattern
   */
  invalidatePattern(pattern: string): number {
    const keys = Array.from(this.cache.keys())
      .filter(k => k.includes(pattern))

    for (const key of keys) {
      this.cache.delete(key)
    }

    return keys.length
  }

  /**
   * Get stats
   */
  getStats(): {
    cacheSize: number
    maxSize: number
    cacheTTL: number
    totalAccessCount: number
    averageCompletionsCount: number
    expiredCount: number
  } {
    const entries = Array.from(this.cache.values())
    const now = Date.now()

    const totalAccess = entries.reduce((sum, e) => sum + e.accessCount, 0)
    const avgCompletions = entries.length > 0
      ? entries.reduce((sum, e) => sum + e.completions.length, 0) / entries.length
      : 0

    const expired = entries.filter(e => now - e.cachedAt > this.cacheTTL).length

    return {
      cacheSize: this.cache.size,
      maxSize: this.maxSize,
      cacheTTL: this.cacheTTL,
      totalAccessCount: totalAccess,
      averageCompletionsCount: avgCompletions,
      expiredCount: expired
    }
  }

  /**
   * Set TTL
   */
  setTTL(ms: number): void {
    this.cacheTTL = ms
  }

  /**
   * Set max size
   */
  setMaxSize(size: number): void {
    this.maxSize = size
  }

  /**
   * Clear all
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.cacheTTL = 300000
    this.maxSize = 1000
  }
}

// Global singleton
export const completionCacheService = new CompletionCacheService()

export default completionCacheService