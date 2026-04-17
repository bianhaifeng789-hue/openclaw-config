// @ts-nocheck

/**
 * Context Utils Pattern - 上下文工具
 * 
 * Source: Claude Code utils/context.ts + utils/analyzeContext.ts + utils/contextSuggestions.ts
 * Pattern: context analysis + suggestions + relevance scoring + context management
 */

interface ContextItem {
  type: 'file' | 'skill' | 'memory' | 'url' | 'conversation'
  path: string
  relevance: number
  lastAccessed: number
  tokens: number
}

class ContextUtils {
  private contextItems = new Map<string, ContextItem>()
  private maxContextItems = 50
  private maxContextTokens = 100000

  /**
   * Add context item
   */
  addItem(item: ContextItem): void {
    // Check capacity
    this.ensureCapacity()

    this.contextItems.set(item.path, item)

    // Sort by relevance
    this.sortByRelevance()
  }

  /**
   * Remove context item
   */
  removeItem(path: string): boolean {
    return this.contextItems.delete(path)
  }

  /**
   * Get context item
   */
  getItem(path: string): ContextItem | undefined {
    return this.contextItems.get(path)
  }

  /**
   * Get all items sorted by relevance
   */
  getSortedItems(): ContextItem[] {
    return Array.from(this.contextItems.values())
      .sort((a, b) => b.relevance - a.relevance)
  }

  /**
   * Sort by relevance
   */
  private sortByRelevance(): void {
    // Re-sort happens in getSortedItems
  }

  /**
   * Ensure capacity (by token budget)
   */
  private ensureCapacity(): void {
    let totalTokens = this.getTotalTokens()

    while (totalTokens > this.maxContextTokens && this.contextItems.size > 0) {
      // Remove lowest relevance item
      const sorted = this.getSortedItems()
      const lowest = sorted[sorted.length - 1]

      if (lowest) {
        this.contextItems.delete(lowest.path)
        totalTokens -= lowest.tokens
      }
    }

    // Also check count limit
    while (this.contextItems.size > this.maxContextItems) {
      const sorted = this.getSortedItems()
      const lowest = sorted[sorted.length - 1]

      if (lowest) {
        this.contextItems.delete(lowest.path)
      }
    }
  }

  /**
   * Get total tokens
   */
  private getTotalTokens(): number {
    return Array.from(this.contextItems.values())
      .reduce((sum, item) => sum + item.tokens, 0)
  }

  /**
   * Update relevance score
   */
  updateRelevance(path: string, relevance: number): boolean {
    const item = this.contextItems.get(path)
    if (!item) return false

    item.relevance = relevance
    item.lastAccessed = Date.now()

    return true
  }

  /**
   * Analyze context relevance
   */
  analyzeRelevance(query: string): ContextItem[] {
    const items = this.getSortedItems()

    // Simple keyword matching for relevance boost
    const keywords = query.toLowerCase().split(/\s+/)

    for (const item of items) {
      const pathLower = item.path.toLowerCase()
      const matchCount = keywords.filter(k => pathLower.includes(k)).length

      // Boost relevance based on keyword matches
      item.relevance = Math.min(100, item.relevance + matchCount * 10)
    }

    return items
  }

  /**
   * Get context suggestions
   */
  getSuggestions(query: string): string[] {
    const relevant = this.analyzeRelevance(query)

    return relevant
      .slice(0, 5)
      .map(item => item.path)
  }

  /**
   * Get stats
   */
  getStats(): {
    itemCount: number
    totalTokens: number
    maxTokens: number
    maxItems: number
    averageRelevance: number
  } {
    const items = Array.from(this.contextItems.values())
    const totalTokens = this.getTotalTokens()
    const averageRelevance = items.length > 0
      ? items.reduce((sum, i) => sum + i.relevance, 0) / items.length
      : 0

    return {
      itemCount: items.length,
      totalTokens,
      maxTokens: this.maxContextTokens,
      maxItems: this.maxContextItems,
      averageRelevance
    }
  }

  /**
   * Clear all items
   */
  clear(): void {
    this.contextItems.clear()
  }

  /**
   * Set max context tokens
   */
  setMaxTokens(max: number): void {
    this.maxContextTokens = max
    this.ensureCapacity()
  }

  /**
   * Set max items
   */
  setMaxItems(max: number): void {
    this.maxContextItems = max
    this.ensureCapacity()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.contextItems.clear()
    this.maxContextItems = 50
    this.maxContextTokens = 100000
  }
}

// Global singleton
export const contextUtils = new ContextUtils()

export default contextUtils