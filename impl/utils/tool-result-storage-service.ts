// @ts-nocheck

/**
 * Tool Result Storage Pattern - 工具结果存储
 * 
 * Source: Claude Code utils/toolResultStorage.ts
 * Pattern: tool result storage + result caching + result persistence + storage
 */

interface StoredResult {
  id: string
  toolName: string
  result: any
  storedAt: number
  accessedAt: number
  accessCount: number
}

class ToolResultStorageService {
  private storage = new Map<string, StoredResult>()
  private resultCounter = 0
  private maxSize = 100

  /**
   * Store result
   */
  store(toolName: string, result: any): StoredResult {
    const id = `result-${++this.resultCounter}-${Date.now()}`

    const stored: StoredResult = {
      id,
      toolName,
      result,
      storedAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 0
    }

    // Evict oldest if over max size
    if (this.storage.size >= this.maxSize) {
      const oldest = Array.from(this.storage.values())
        .sort((a, b) => a.accessedAt - b.accessedAt)[0]

      if (oldest) this.storage.delete(oldest.id)
    }

    this.storage.set(id, stored)

    return stored
  }

  /**
   * Get result
   */
  get(id: string): StoredResult | undefined {
    const stored = this.storage.get(id)

    if (stored) {
      stored.accessedAt = Date.now()
      stored.accessCount++
    }

    return stored
  }

  /**
   * Get by tool
   */
  getByTool(toolName: string): StoredResult[] {
    return Array.from(this.storage.values())
      .filter(s => s.toolName === toolName)
  }

  /**
   * Get recent
   */
  getRecent(count: number = 10): StoredResult[] {
    return Array.from(this.storage.values())
      .sort((a, b) => b.storedAt - a.storedAt)
      .slice(0, count)
  }

  /**
   * Delete result
   */
  delete(id: string): boolean {
    return this.storage.delete(id)
  }

  /**
   * Clear by tool
   */
  clearByTool(toolName: string): number {
    const toDelete = this.getByTool(toolName)

    for (const stored of toDelete) {
      this.storage.delete(stored.id)
    }

    return toDelete.length
  }

  /**
   * Get stats
   */
  getStats(): {
    storageCount: number
    maxSize: number
    totalAccessCount: number
    byTool: Record<string, number>
  } {
    const byTool: Record<string, number> = {}
    const totalAccess = Array.from(this.storage.values())
      .reduce((sum, s) => sum + s.accessCount, 0)

    for (const stored of this.storage.values()) {
      byTool[stored.toolName] = (byTool[stored.toolName] ?? 0) + 1
    }

    return {
      storageCount: this.storage.size,
      maxSize: this.maxSize,
      totalAccessCount: totalAccess,
      byTool
    }
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
    this.storage.clear()
    this.resultCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.maxSize = 100
  }
}

// Global singleton
export const toolResultStorageService = new ToolResultStorageService()

export default toolResultStorageService