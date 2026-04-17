// @ts-nocheck

/**
 * JSON Parse Cache Pattern - JSON解析缓存
 * 
 * Source: Claude Code utils/json.ts + utils/memoize.ts
 * Pattern: parseJsonCached + string key + result cache + LRU eviction + mtime invalidation
 */

interface CacheEntry<T> {
  value: T
  parsedAt: number
  hits: number
}

class JsonParseCache {
  private cache = new Map<string, CacheEntry<any>>()
  private accessOrder: string[] = [] // LRU tracking

  private config = {
    maxSize: 100,
    ttlMs: 5 * 60 * 1000, // 5 minutes
    useMtime: true // Would check file mtime if path
  }

  /**
   * Parse JSON with caching
   */
  parse<T>(jsonString: string): T {
    const key = this.getKey(jsonString)

    // Check cache
    const cached = this.cache.get(key)
    if (cached) {
      // Check TTL
      if (Date.now() - cached.parsedAt < this.config.ttlMs) {
        cached.hits++
        this.updateAccessOrder(key)
        return cached.value
      }
      // TTL expired: remove
      this.cache.delete(key)
    }

    // Parse fresh
    try {
      const value = JSON.parse(jsonString) as T

      // Cache result
      this.ensureCapacity()
      this.cache.set(key, {
        value,
        parsedAt: Date.now(),
        hits: 0
      })
      this.accessOrder.push(key)

      return value
    } catch (e) {
      console.warn('[JsonCache] Parse error:', e)
      throw e
    }
  }

  /**
   * Parse JSON file with mtime check
   */
  async parseFile<T>(filePath: string, readFn?: () => Promise<string>): Promise<T> {
    // Would integrate with file read + mtime check
    // For demo, use readFn or return cached
    const cached = this.cache.get(filePath)
    if (cached && !this.config.useMtime) {
      return cached.value
    }

    if (!readFn) {
      throw new Error('readFn required for file parsing')
    }

    const content = await readFn()
    return this.parse<T>(content)
  }

  /**
   * Get cache key from string
   */
  private getKey(jsonString: string): string {
    // Use hash of content as key (for large strings)
    if (jsonString.length > 1000) {
      return this.simpleHash(jsonString)
    }
    return jsonString
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return `hash-${hash}`
  }

  /**
   * Update LRU access order
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index >= 0) {
      this.accessOrder.splice(index, 1)
      this.accessOrder.push(key)
    }
  }

  /**
   * Ensure capacity (LRU eviction)
   */
  private ensureCapacity(): void {
    while (this.cache.size >= this.config.maxSize) {
      // Evict oldest (least recently used)
      const oldestKey = this.accessOrder.shift()
      if (oldestKey) {
        this.cache.delete(oldestKey)
      }
    }
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * Get stats
   */
  getStats(): {
    size: number
    maxSize: number
    totalHits: number
    accessOrderLength: number
  } {
    let totalHits = 0
    for (const entry of this.cache.values()) {
      totalHits += entry.hits
    }

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      totalHits,
      accessOrderLength: this.accessOrder.length
    }
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
    this.clear()
  }
}

// Global singleton
export const jsonParseCache = new JsonParseCache()

export default jsonParseCache