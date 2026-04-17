// @ts-nocheck

/**
 * File Read Cache Pattern - 文件读取缓存
 * 
 * Source: Claude Code utils/fileReadCache.ts
 * Pattern: mtime invalidation + content cache + stat cache + read-through
 */

interface FileCacheEntry {
  content: string
  mtime: number
  size: number
  readAt: number
  hits: number
}

class FileReadCache {
  private contentCache = new Map<string, FileCacheEntry>()
  private statCache = new Map<string, { mtime: number; size: number }>()

  private config = {
    maxSize: 50, // Max files cached
    maxContentSize: 1024 * 1024, // 1MB max file size to cache
    ttlMs: 10 * 60 * 1000 // 10 minutes
  }

  private readFile: (path: string) => Promise<string> = async () => ''
  private statFile: (path: string) => Promise<{ mtime: number; size: number }> = async () => ({ mtime: 0, size: 0 })

  /**
   * Set file reader functions
   */
  setReaders(readFn: (path: string) => Promise<string>, statFn: (path: string) => Promise<{ mtime: number; size: number }>): void {
    this.readFile = readFn
    this.statFile = statFn
  }

  /**
   * Read file with cache
   */
  async read(path: string): Promise<string> {
    // Check if cached
    const cached = this.contentCache.get(path)

    if (cached) {
      // Check TTL
      if (Date.now() - cached.readAt > this.config.ttlMs) {
        this.contentCache.delete(path)
        this.statCache.delete(path)
      } else {
        // Check mtime
        const stat = await this.statFile(path)
        if (stat.mtime === cached.mtime) {
          // Cache valid
          cached.hits++
          return cached.content
        }
        // mtime changed: invalidate
        this.contentCache.delete(path)
      }
    }

    // Read fresh
    const content = await this.readFile(path)
    const stat = await this.statFile(path)

    // Cache if within size limit
    if (stat.size <= this.config.maxContentSize) {
      this.ensureCapacity()
      this.contentCache.set(path, {
        content,
        mtime: stat.mtime,
        size: stat.size,
        readAt: Date.now(),
        hits: 0
      })
      this.statCache.set(path, stat)
    }

    return content
  }

  /**
   * Invalidate file cache
   */
  invalidate(path: string): void {
    this.contentCache.delete(path)
    this.statCache.delete(path)
  }

  /**
   * Invalidate all caches
   */
  invalidateAll(): void {
    this.contentCache.clear()
    this.statCache.clear()
  }

  /**
   * Invalidate by pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0
    for (const path of this.contentCache.keys()) {
      if (path.includes(pattern)) {
        this.contentCache.delete(path)
        this.statCache.delete(path)
        count++
      }
    }
    return count
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(): void {
    if (this.contentCache.size >= this.config.maxSize) {
      // Evict lowest-hit entry
      let lowestKey: string | null = null
      let lowestHits = Infinity

      for (const [key, entry] of this.contentCache) {
        if (entry.hits < lowestHits) {
          lowestHits = entry.hits
          lowestKey = key
        }
      }

      if (lowestKey) {
        this.contentCache.delete(lowestKey)
        this.statCache.delete(lowestKey)
      }
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    contentCacheSize: number
    statCacheSize: number
    totalHits: number
    maxSize: number
  } {
    let totalHits = 0
    for (const entry of this.contentCache.values()) {
      totalHits += entry.hits
    }

    return {
      contentCacheSize: this.contentCache.size,
      statCacheSize: this.statCache.size,
      totalHits,
      maxSize: this.config.maxSize
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
    this.contentCache.clear()
    this.statCache.clear()
  }
}

// Global singleton
export const fileReadCache = new FileReadCache()

export default fileReadCache