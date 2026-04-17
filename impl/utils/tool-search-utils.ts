// @ts-nocheck

/**
 * Tool Search Utils Pattern - 工具搜索工具
 * 
 * Source: Claude Code utils/toolSearch.ts + services/tools/index.ts
 * Pattern: tool search + fuzzy matching + relevance + tool registry
 */

interface ToolInfo {
  name: string
  description: string
  category: string
  aliases: string[]
  usageCount: number
  lastUsed: number
}

interface SearchResult {
  tool: ToolInfo
  score: number
  matchedOn: string[]
}

class ToolSearchUtils {
  private tools = new Map<string, ToolInfo>()
  private categories = new Set<string>()

  /**
   * Register tool
   */
  register(tool: ToolInfo): void {
    this.tools.set(tool.name, tool)
    this.categories.add(tool.category)
  }

  /**
   * Unregister tool
   */
  unregister(name: string): boolean {
    const tool = this.tools.get(name)
    if (!tool) return false

    this.tools.delete(name)

    // Update category set
    const remainingInCategory = Array.from(this.tools.values())
      .some(t => t.category === tool.category)

    if (!remainingInCategory) {
      this.categories.delete(tool.category)
    }

    return true
  }

  /**
   * Get tool by name
   */
  get(name: string): ToolInfo | undefined {
    return this.tools.get(name)
  }

  /**
   * Search tools by query
   */
  search(query: string, maxResults = 10): SearchResult[] {
    const queryLower = query.toLowerCase()
    const results: SearchResult[] = []

    for (const tool of this.tools.values()) {
      const score = this.calculateScore(tool, queryLower)

      if (score > 0) {
        const matchedOn = this.getMatchedOn(tool, queryLower)

        results.push({
          tool,
          score,
          matchedOn
        })
      }
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score)

    return results.slice(0, maxResults)
  }

  /**
   * Calculate relevance score
   */
  private calculateScore(tool: ToolInfo, query: string): number {
    let score = 0

    // Exact name match
    if (tool.name.toLowerCase() === query) {
      score += 100
    }

    // Name contains query
    if (tool.name.toLowerCase().includes(query)) {
      score += 50
    }

    // Alias match
    for (const alias of tool.aliases) {
      if (alias.toLowerCase() === query) {
        score += 80
      }
      if (alias.toLowerCase().includes(query)) {
        score += 30
      }
    }

    // Description contains query
    if (tool.description.toLowerCase().includes(query)) {
      score += 20
    }

    // Category match
    if (tool.category.toLowerCase().includes(query)) {
      score += 10
    }

    // Boost by usage
    score += Math.min(10, tool.usageCount * 0.5)

    return score
  }

  /**
   * Get matched attributes
   */
  private getMatchedOn(tool: ToolInfo, query: string): string[] {
    const matched: string[] = []

    if (tool.name.toLowerCase().includes(query)) matched.push('name')
    if (tool.aliases.some(a => a.toLowerCase().includes(query))) matched.push('alias')
    if (tool.description.toLowerCase().includes(query)) matched.push('description')
    if (tool.category.toLowerCase().includes(query)) matched.push('category')

    return matched
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): ToolInfo[] {
    return Array.from(this.tools.values())
      .filter(t => t.category === category)
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categories)
  }

  /**
   * Update usage count
   */
  updateUsage(name: string): void {
    const tool = this.tools.get(name)
    if (tool) {
      tool.usageCount++
      tool.lastUsed = Date.now()
    }
  }

  /**
   * Get most used tools
   */
  getMostUsed(count: number): ToolInfo[] {
    return Array.from(this.tools.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, count)
  }

  /**
   * Get recently used tools
   */
  getRecentlyUsed(count: number): ToolInfo[] {
    return Array.from(this.tools.values())
      .sort((a, b) => b.lastUsed - a.lastUsed)
      .slice(0, count)
  }

  /**
   * Get stats
   */
  getStats(): {
    totalTools: number
    totalCategories: number
    totalUsage: number
  } {
    const tools = Array.from(this.tools.values())
    const totalUsage = tools.reduce((sum, t) => sum + t.usageCount, 0)

    return {
      totalTools: tools.length,
      totalCategories: this.categories.size,
      totalUsage
    }
  }

  /**
   * Clear all tools
   */
  clear(): void {
    this.tools.clear()
    this.categories.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const toolSearchUtils = new ToolSearchUtils()

export default toolSearchUtils