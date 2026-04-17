// @ts-nocheck

/**
 * Tool Pool Pattern - 工具池
 * 
 * Source: Claude Code utils/toolPool.ts
 * Pattern: tool pool + tool management + tool registry + pool management
 */

interface PoolTool {
  name: string
  category: string
  enabled: boolean
  priority: number
  loadedAt: number
}

class ToolPoolService {
  private pool = new Map<string, PoolTool>()
  private categories = new Map<string, string[]>()

  /**
   * Register tool
   */
  register(name: string, category: string, priority?: number): PoolTool {
    const tool: PoolTool = {
      name,
      category,
      enabled: true,
      priority: priority ?? 0,
      loadedAt: Date.now()
    }

    this.pool.set(name, tool)

    const categoryTools = this.categories.get(category) ?? []
    categoryTools.push(name)
    this.categories.set(category, categoryTools)

    return tool
  }

  /**
   * Get tool
   */
  getTool(name: string): PoolTool | undefined {
    return this.pool.get(name)
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): PoolTool[] {
    const toolNames = this.categories.get(category) ?? []
    return toolNames
      .map(name => this.pool.get(name))
      .filter(t => t !== undefined) as PoolTool[]
  }

  /**
   * Get enabled tools
   */
  getEnabled(): PoolTool[] {
    return Array.from(this.pool.values())
      .filter(t => t.enabled)
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * Get all tools
   */
  getAll(): PoolTool[] {
    return Array.from(this.pool.values())
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * Enable tool
   */
  enable(name: string): boolean {
    const tool = this.pool.get(name)
    if (!tool) return false

    tool.enabled = true

    return true
  }

  /**
   * Disable tool
   */
  disable(name: string): boolean {
    const tool = this.pool.get(name)
    if (!tool) return false

    tool.enabled = false

    return true
  }

  /**
   * Unregister tool
   */
  unregister(name: string): boolean {
    const tool = this.pool.get(name)
    if (!tool) return false

    this.pool.delete(name)

    const categoryTools = this.categories.get(tool.category)
    if (categoryTools) {
      const index = categoryTools.indexOf(name)
      if (index !== -1) categoryTools.splice(index, 1)
    }

    return true
  }

  /**
   * Get stats
   */
  getStats(): {
    poolCount: number
    enabledCount: number
    disabledCount: number
    categoriesCount: number
    byCategory: Record<string, number>
  } {
    const tools = Array.from(this.pool.values())
    const byCategory: Record<string, number> = {}

    for (const [category, names] of this.categories) {
      byCategory[category] = names.length
    }

    return {
      poolCount: tools.length,
      enabledCount: tools.filter(t => t.enabled).length,
      disabledCount: tools.filter(t => !t.enabled).length,
      categoriesCount: this.categories.size,
      byCategory
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.pool.clear()
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
export const toolPoolService = new ToolPoolService()

export default toolPoolService