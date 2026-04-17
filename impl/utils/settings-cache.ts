// @ts-nocheck

/**
 * Three-Tier Settings Cache Pattern - 三层配置缓存
 * 
 * Source: Claude Code utils/settings/settingsCache.ts
 * Pattern: session cache + perSource cache + parseFile cache + undefined/null distinction
 */

type SettingsValue = Record<string, unknown>

interface CacheEntry<T> {
  value: T
  timestamp: number
  source: string
}

class ThreeTierSettingsCache {
  // Layer 1: Session-level cache (entire settings object)
  private sessionCache: CacheEntry<SettingsValue> | null = null

  // Layer 2: Per-source cache (settings per source file)
  private perSourceCache = new Map<string, CacheEntry<SettingsValue>>()

  // Layer 3: Parse file cache (raw parsed content)
  private parseFileCache = new Map<string, CacheEntry<string | SettingsValue>>()

  // Cache TTL in milliseconds
  private ttl: number = 5 * 60 * 1000 // 5 minutes default

  // Max cache entries per layer
  private maxEntries: number = 100

  /**
   * Get from session cache (top layer)
   * Returns undefined if not cached or expired
   */
  getSession(): SettingsValue | undefined {
    if (!this.sessionCache) return undefined
    if (Date.now() - this.sessionCache.timestamp > this.ttl) {
      this.sessionCache = null
      return undefined
    }
    return this.sessionCache.value
  }

  /**
   * Set session cache
   */
  setSession(value: SettingsValue, source: string): void {
    this.sessionCache = {
      value,
      timestamp: Date.now(),
      source
    }
  }

  /**
   * Get from per-source cache
   */
  getPerSource(sourcePath: string): SettingsValue | undefined {
    const entry = this.perSourceCache.get(sourcePath)
    if (!entry) return undefined
    if (Date.now() - entry.timestamp > this.ttl) {
      this.perSourceCache.delete(sourcePath)
      return undefined
    }
    return entry.value
  }

  /**
   * Set per-source cache
   */
  setPerSource(sourcePath: string, value: SettingsValue): void {
    this.evictIfNeeded(this.perSourceCache)
    this.perSourceCache.set(sourcePath, {
      value,
      timestamp: Date.now(),
      source: sourcePath
    })
  }

  /**
   * Get from parse file cache
   * Returns cached raw content or parsed value
   */
  getParseFile(filePath: string): string | SettingsValue | undefined {
    const entry = this.parseFileCache.get(filePath)
    if (!entry) return undefined
    if (Date.now() - entry.timestamp > this.ttl) {
      this.parseFileCache.delete(filePath)
      return undefined
    }
    return entry.value
  }

  /**
   * Set parse file cache
   */
  setParseFile(filePath: string, value: string | SettingsValue): void {
    this.evictIfNeeded(this.parseFileCache)
    this.parseFileCache.set(filePath, {
      value,
      timestamp: Date.now(),
      source: filePath
    })
  }

  /**
   * Invalidate all caches
   */
  invalidateAll(): void {
    this.sessionCache = null
    this.perSourceCache.clear()
    this.parseFileCache.clear()
  }

  /**
   * Invalidate specific source
   */
  invalidateSource(sourcePath: string): void {
    // Invalidate session if it came from this source
    if (this.sessionCache?.source === sourcePath) {
      this.sessionCache = null
    }
    this.perSourceCache.delete(sourcePath)
    this.parseFileCache.delete(sourcePath)
  }

  /**
   * Evict oldest entries if cache exceeds max size
   */
  private evictIfNeeded(cache: Map<string, CacheEntry<any>>): void {
    if (cache.size < this.maxEntries) return

    // Find oldest entry
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      cache.delete(oldestKey)
    }
  }

  /**
   * Set TTL for all caches
   */
  setTTL(ms: number): void {
    this.ttl = ms
  }

  /**
   * Set max entries per cache layer
   */
  setMaxEntries(count: number): void {
    this.maxEntries = count
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    sessionCached: boolean
    perSourceCount: number
    parseFileCount: number
    ttl: number
  } {
    return {
      sessionCached: this.sessionCache !== null,
      perSourceCount: this.perSourceCache.size,
      parseFileCount: this.parseFileCache.size,
      ttl: this.ttl
    }
  }

  /**
   * Reset all caches (for testing)
   */
  _reset(): void {
    this.invalidateAll()
    this.ttl = 5 * 60 * 1000
    this.maxEntries = 100
  }
}

// Global singleton
export const settingsCache = new ThreeTierSettingsCache()

export default settingsCache