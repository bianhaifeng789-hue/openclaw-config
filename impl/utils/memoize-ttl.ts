// @ts-nocheck

/**
 * Memoize TTL Pattern - 带TTL的记忆化
 * 
 * Source: Claude Code utils/memoize-ttl.ts + utils/memoize.ts
 * Pattern: memoize TTL + custom resolver + WeakRef cache + TTL check + refresh on stale
 */

interface MemoizeEntry<T> {
  value: T
  computedAt: number
  ttlMs: number
  resolverKey?: string
}

type ResolverFn = (...args: any[]) => string

class MemoizeTTL {
  private cache = new Map<string, MemoizeEntry<any>>()
  private weakCache = new Map<string, WeakRef<any>>()

  private defaultTTL = 5 * 60 * 1000 // 5 minutes
  private maxCacheSize = 100

  /**
   * Memoize function with TTL
   */
  memoize<T extends (...args: any[]) => any>(
    fn: T,
    options?: {
      ttlMs?: number
      resolver?: ResolverFn
      maxSize?: number
    }
  ): T {
    const ttlMs = options?.ttlMs ?? this.defaultTTL
    const resolver = options?.resolver ?? ((...args) => JSON.stringify(args))
    const maxSize = options?.maxSize ?? this.maxCacheSize

    const memoized = async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const key = resolver(...args)

      // Check cache
      const cached = this.cache.get(key)
      if (cached) {
        // Check TTL
        if (Date.now() - cached.computedAt < cached.ttlMs) {
          return cached.value
        }
        // TTL expired: remove
        this.cache.delete(key)
        this.weakCache.delete(key)
      }

      // Compute fresh
      const value = await fn(...args)

      // Cache result
      this.ensureCapacity(maxSize)
      this.cache.set(key, {
        value,
        computedAt: Date.now(),
        ttlMs,
        resolverKey: key
      })

      // WeakRef for GC
      if (typeof value === 'object' && value !== null) {
        this.weakCache.set(key, new WeakRef(value))
      }

      return value
    }

    return memoized as T
  }

  /**
   * Memoize sync function with TTL
   */
  memoizeSync<T extends (...args: any[]) => any>(
    fn: T,
    options?: {
      ttlMs?: number
      resolver?: ResolverFn
    }
  ): T {
    const ttlMs = options?.ttlMs ?? this.defaultTTL
    const resolver = options?.resolver ?? ((...args) => JSON.stringify(args))

    const memoized = (...args: Parameters<T>): ReturnType<T> => {
      const key = resolver(...args)

      // Check cache
      const cached = this.cache.get(key)
      if (cached) {
        if (Date.now() - cached.computedAt < cached.ttlMs) {
          return cached.value
        }
        this.cache.delete(key)
      }

      // Compute
      const value = fn(...args)

      // Cache
      this.ensureCapacity(this.maxCacheSize)
      this.cache.set(key, {
        value,
        computedAt: Date.now(),
        ttlMs
      })

      return value
    }

    return memoized as T
  }

  /**
   * Ensure cache capacity
   */
  private ensureCapacity(maxSize: number): void {
    if (this.cache.size >= maxSize) {
      // Evict oldest
      let oldestKey: string | null = null
      let oldestTime = Infinity

      for (const [key, entry] of this.cache) {
        if (entry.computedAt < oldestTime) {
          oldestTime = entry.computedAt
          oldestKey = key
        }
      }

      if (oldestKey) {
        this.cache.delete(oldestKey)
        this.weakCache.delete(oldestKey)
      }
    }
  }

  /**
   * Invalidate cache by key
   */
  invalidate(key: string): boolean {
    const deleted = this.cache.delete(key)
    this.weakCache.delete(key)
    return deleted
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
        this.weakCache.delete(key)
        count++
      }
    }
    return count
  }

  /**
   * Refresh entry (force recomputation)
   */
  refresh<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.cache.delete(key)
    return fn()
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.weakCache.clear()
  }

  /**
   * Get stats
   */
  getStats(): {
    cacheSize: number
    weakCacheSize: number
    totalEntries: number
  } {
    return {
      cacheSize: this.cache.size,
      weakCacheSize: this.weakCache.size,
      totalEntries: this.cache.size
    }
  }

  /**
   * Set default TTL
   */
  setDefaultTTL(ms: number): void {
    this.defaultTTL = ms
  }

  /**
   * Set max cache size
   */
  setMaxSize(size: number): void {
    this.maxCacheSize = size
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.defaultTTL = 5 * 60 * 1000
    this.maxCacheSize = 100
  }
}

// Global singleton
export const memoizeTTL = new MemoizeTTL()

export default memoizeTTL