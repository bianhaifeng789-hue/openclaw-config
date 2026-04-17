// @ts-nocheck

/**
 * Tool Schema Cache Pattern - 工具Schema缓存
 * 
 * Source: Claude Code utils/toolSchemaCache.ts
 * Pattern: toolDefinition cache + JSONSchema conversion + zodToJsonSchema + schemaHash
 */

interface ToolSchemaEntry {
  toolName: string
  schema: any // JSONSchema
  schemaHash: string
  cachedAt: number
  hits: number
}

class ToolSchemaCache {
  private schemaCache = new Map<string, ToolSchemaEntry>()
  private hashCache = new Map<string, string>() // schema string → hash

  private config = {
    maxSize: 50,
    ttlMs: 30 * 60 * 1000 // 30 minutes
  }

  /**
   * Cache tool schema
   */
  cacheSchema(toolName: string, schema: any): void {
    const schemaHash = this.hashSchema(schema)

    this.ensureCapacity()
    this.schemaCache.set(toolName, {
      toolName,
      schema,
      schemaHash,
      cachedAt: Date.now(),
      hits: 0
    })
  }

  /**
   * Get cached schema
   */
  getSchema(toolName: string): any | undefined {
    const cached = this.schemaCache.get(toolName)
    if (!cached) return undefined

    // Check TTL
    if (Date.now() - cached.cachedAt > this.config.ttlMs) {
      this.schemaCache.delete(toolName)
      return undefined
    }

    cached.hits++
    return cached.schema
  }

  /**
   * Hash schema for comparison
   */
  hashSchema(schema: any): string {
    const schemaString = JSON.stringify(schema)

    // Check hash cache
    if (this.hashCache.has(schemaString)) {
      return this.hashCache.get(schemaString)!
    }

    // Compute hash
    const hash = this.simpleHash(schemaString)
    this.hashCache.set(schemaString, hash)
    return hash
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return `schema-${hash.toString(16)}`
  }

  /**
   * Compare schemas by hash
   */
  compareSchemas(schema1: any, schema2: any): boolean {
    return this.hashSchema(schema1) === this.hashSchema(schema2)
  }

  /**
   * Invalidate tool schema
   */
  invalidate(toolName: string): boolean {
    return this.schemaCache.delete(toolName)
  }

  /**
   * Invalidate all schemas
   */
  invalidateAll(): void {
    this.schemaCache.clear()
    this.hashCache.clear()
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(): void {
    if (this.schemaCache.size >= this.config.maxSize) {
      // Evict lowest-hit
      let lowestKey: string | null = null
      let lowestHits = Infinity

      for (const [key, entry] of this.schemaCache) {
        if (entry.hits < lowestHits) {
          lowestHits = entry.hits
          lowestKey = key
        }
      }

      if (lowestKey) {
        this.schemaCache.delete(lowestKey)
      }
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    schemaCacheSize: number
    hashCacheSize: number
    totalHits: number
    maxSize: number
  } {
    let totalHits = 0
    for (const entry of this.schemaCache.values()) {
      totalHits += entry.hits
    }

    return {
      schemaCacheSize: this.schemaCache.size,
      hashCacheSize: this.hashCache.size,
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
    this.schemaCache.clear()
    this.hashCache.clear()
  }
}

// Global singleton
export const toolSchemaCache = new ToolSchemaCache()

export default toolSchemaCache