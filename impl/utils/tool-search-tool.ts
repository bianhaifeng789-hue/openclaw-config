// @ts-nocheck

/**
 * Tool Search Tool Pattern - 工具搜索工具
 * 
 * Source: Claude Code tools/ToolSearchTool/ToolSearchTool.ts + tools/ToolSearchTool/prompt.ts
 * Pattern: tool search + tool discovery + tool lookup + tool registry
 */

interface ToolInfo {
  id: string
  name: string
  description: string
  category: string
  enabled: boolean
}

class ToolSearchTool {
  private tools = new Map<string, ToolInfo>()
  private searchHistory: Array<{ query: string; results: ToolInfo[] }> = []

  /**
   * Register tool
   */
  register(id: string, name: string, description: string, category: string): ToolInfo {
    const tool: ToolInfo = {
      id,
      name,
      description,
      category,
      enabled: true
    }

    this.tools.set(id, tool)

    return tool
  }

  /**
   * Search tools
   */
  search(query: string): ToolInfo[] {
    const lowerQuery = query.toLowerCase()

    const results = Array.from(this.tools.values())
      .filter(t =>
        t.enabled &&
        (t.name.toLowerCase().includes(lowerQuery) ||
         t.description.toLowerCase().includes(lowerQuery) ||
         t.category.toLowerCase().includes(lowerQuery))
      )

    this.searchHistory.push({ query, results })

    return results
  }

  /**
   * Get tool by ID
   */
  getById(id: string): ToolInfo | undefined {
    return this.tools.get(id)
  }

  /**
   * Get tool by name
   */
  getByName(name: string): ToolInfo | undefined {
    return Array.from(this.tools.values())
      .find(t => t.name === name)
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): ToolInfo[] {
    return Array.from(this.tools.values())
      .filter(t => t.category === category && t.enabled)
  }

  /**
   * Get all tools
   */
  getAll(): ToolInfo[] {
    return Array.from(this.tools.values())
      .filter(t => t.enabled)
  }

  /**
   * Enable tool
   */
  enable(id: string): boolean {
    const tool = this.tools.get(id)
    if (!tool) return false

    tool.enabled = true

    return true
  }

  /**
   * Disable tool
   */
  disable(id: string): boolean {
    const tool = this.tools.get(id)
    if (!tool) return false

    tool.enabled = false

    return true
  }

  /**
   * Get search history
   */
  getSearchHistory(): Array<{ query: string; results: ToolInfo[] }> {
    return [...this.searchHistory]
  }

  /**
   * Get stats
   */
  getStats(): {
    toolsCount: number
    enabledCount: number
    byCategory: Record<string, number>
    searchesCount: number
  } {
    const tools = Array.from(this.tools.values())

    const byCategory: Record<string, number> = {}
    for (const tool of tools) {
      if (tool.enabled) {
        byCategory[tool.category] = (byCategory[tool.category] ?? 0) + 1
      }
    }

    return {
      toolsCount: tools.length,
      enabledCount: tools.filter(t => t.enabled).length,
      byCategory,
      searchesCount: this.searchHistory.length
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.tools.clear()
    this.searchHistory = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const toolSearchTool = new ToolSearchTool()

export default toolSearchTool