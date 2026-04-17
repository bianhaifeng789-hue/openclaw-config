// @ts-nocheck

/**
 * Tool Schema Cache Pattern - 工具Schema缓存
 * 
 * Source: Claude Code utils/toolSchemaCache.ts
 * Pattern: tool schema cache + schema caching + schema validation + metadata
 */

interface CachedSchema {
  toolName: string
  schema: any
  cachedAt: number
  accessedAt: number
  accessCount: number
}

class ToolSchemaCacheService {
  private cache = new Map<string, CachedSchema>()
  private cacheTTL = 3600000 // 1 hour

  /**
   * Cache schema
   */
  cache(toolName: string, schema: any): CachedSchema {
    const cached: CachedSchema = {
      toolName,
      schema,
      cachedAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0
    }

    this.cache.set(toolName, cached)

    return cached
  }

  /**
   * Get schema
   */
  get(toolName: string): CachedSchema | undefined {
    const cached = this.cache.get(toolName)

    if (!cached) return undefined

    // Check TTL
    if (Date.now() - cached.cachedAt > this.cacheTTL) {
      this.cache.delete(toolName)
      return undefined
    }

    cached.accessedAt = Date.now()
    cached.accessCount++

    return cached
  }

  /**
   * Get schema only
   */
  getSchema(toolName: string): any | undefined {
    return this.get(toolName)?.schema
  }

  /**
   * Has schema
   */
  has(toolName: string): boolean {
    return this.get(toolName) !== undefined
  }

  /**
   * Invalidate schema
   */
  invalidate(toolName: string): boolean {
    return this.cache.delete(toolName)
  }

  /**
   * Invalidate all
   */
  invalidateAll(): void {
    this.cache.clear()
  }

  /**
   * Get cached tools
   */
  getCachedTools(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * Get stats
   */
  getStats(): {
    cacheCount: number
    cacheTTL: number
    totalAccessCount: number
    averageAccessCount: number
    expiredCount: number
  } {
    const entries = Array.from(this.cache.values())
    const now = Date.now()

    const totalAccess = entries.reduce((sum, e) => sum + e.accessCount, 0)
    const avgAccess = entries.length > 0 ? totalAccess / entries.length : 0
    const expired = entries.filter(e => now - e.cachedAt > this.cacheTTL).length

    return {
      cacheCount: entries.length,
      cacheTTL: this.cacheTTL,
      totalAccessCount: totalAccess,
      averageAccessCount: avgAccess,
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
    this.cacheTTL = 3600000
  }
}

// Global singleton
export const toolSchemaCacheService = new ToolSchemaCacheService()

export default toolSchemaCacheService