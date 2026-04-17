// @ts-nocheck

/**
 * Memoize Utils Pattern - Memoize工具
 * 
 * Source: Claude Code utils/memoize.ts
 * Pattern: memoize utils + memoization + caching + function cache
 */

interface MemoizeCacheEntry {
  key: string
  result: any
  cachedAt: number
  accessCount: number
}

class MemoizeUtilsService {
  private caches = new Map<string, Map<string, MemoizeCacheEntry>>()
  private globalCache = new Map<string, MemoizeCacheEntry>()

  /**
   * Memoize function
   */
  memoize<T extends (...args: any[]) => any>(fn: T, keyFn?: (...args: any[]) => string): T {
    const cache = new Map<string, MemoizeCacheEntry>()
    const cacheId = `memoize-${Date.now()}`

    this.caches.set(cacheId, cache)

    const memoized = (...args: any[]): any => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args)

      const cached = cache.get(key) ?? this.globalCache.get(key)

      if (cached) {
        cached.accessCount++
        return cached.result
      }

      const result = fn(...args)

      const entry: MemoizeCacheEntry = {
        key,
        result,
        cachedAt: Date.now(),
        accessCount: 1
      }

      cache.set(key, entry)

      return result
    }

    return memoized as T
  }

  /**
   * Memoize with TTL
   */
  memoizeWithTTL<T extends (...args: any[]) => any>(fn: T, ttlMs: number, keyFn?: (...args: any[]) => string): T {
    const cache = new Map<string, MemoizeCacheEntry>()

    const memoized = (...args: any[]): any => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args)

      const cached = cache.get(key)

      if (cached && Date.now() - cached.cachedAt < ttlMs) {
        cached.accessCount++
        return cached.result
      }

      const result = fn(...args)

      cache.set(key, {
        key,
        result,
        cachedAt: Date.now(),
        accessCount: 1
      })

      return result
    }

    return memoized as T
  }

  /**
   * Clear cache
   */
  clear(cacheId?: string): void {
    if (cacheId) {
      this.caches.delete(cacheId)
    } else {
      this.caches.clear()
      this.globalCache.clear()
    }
  }

  /**
   * Get cache size
   */
  getCacheSize(cacheId?: string): number {
    if (cacheId) {
      return this.caches.get(cacheId)?.size ?? 0
    }

    let total = this.globalCache.size

    for (const cache of this.caches.values()) {
      total += cache.size
    }

    return total
  }

  /**
   * Get stats
   */
  getStats(): {
    cachesCount: number
    totalEntries: number
    totalAccessCount: number
    averageAccessCount: number
  } {
    let totalEntries = this.globalCache.size
    let totalAccess = 0

    for (const cache of this.caches.values()) {
      totalEntries += cache.size
      for (const entry of cache.values()) {
        totalAccess += entry.accessCount
      }
    }

    for (const entry of this.globalCache.values()) {
      totalAccess += entry.accessCount
    }

    const avgAccess = totalEntries > 0 ? totalAccess / totalEntries : 0

    return {
      cachesCount: this.caches.size + 1,
      totalEntries: totalEntries,
      totalAccessCount: totalAccess,
      averageAccessCount: avgAccess
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.caches.clear()
    this.globalCache.clear()
  }
}

// Global singleton
export const memoizeUtilsService = new MemoizeUtilsService()

export default memoizeUtilsService