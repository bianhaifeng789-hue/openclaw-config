// @ts-nocheck

/**
 * Use Can Use Tool Pattern - 工具使用检查
 * 
 * Source: Claude Code hooks/useCanUseTool.ts + hooks/useCanUseTool.tsx
 * Pattern: tool permission check + capability validation + access control
 */

interface ToolPermission {
  toolId: string
  allowed: boolean
  conditions?: Array<{ type: string; value: any }>
  lastChecked: number
}

class UseCanUseTool {
  private permissions = new Map<string, ToolPermission>()
  private globalAllowed = true
  private restrictedTools = new Set<string>()
  private checkHistory: Array<{ toolId: string; allowed: boolean; timestamp: number }> = []

  /**
   * Check if can use tool
   */
  canUse(toolId: string): boolean {
    if (!this.globalAllowed) {
      this.recordCheck(toolId, false)
      return false
    }

    if (this.restrictedTools.has(toolId)) {
      this.recordCheck(toolId, false)
      return false
    }

    const permission = this.permissions.get(toolId)
    if (!permission) {
      this.recordCheck(toolId, true)
      return true
    }

    // Check conditions
    if (permission.conditions) {
      for (const condition of permission.conditions) {
        if (!this.checkCondition(condition)) {
          this.recordCheck(toolId, false)
          return false
        }
      }
    }

    permission.lastChecked = Date.now()
    this.recordCheck(toolId, permission.allowed)

    return permission.allowed
  }

  /**
   * Check condition
   */
  private checkCondition(condition: { type: string; value: any }): boolean {
    switch (condition.type) {
      case 'mode':
        // Would check current mode
        return true
      case 'session':
        // Would check session state
        return true
      default:
        return true
    }
  }

  /**
   * Record check
   */
  private recordCheck(toolId: string, allowed: boolean): void {
    this.checkHistory.push({
      toolId,
      allowed,
      timestamp: Date.now()
    })
  }

  /**
   * Set permission
   */
  setPermission(toolId: string, allowed: boolean, conditions?: Array<{ type: string; value: any }>): void {
    this.permissions.set(toolId, {
      toolId,
      allowed,
      conditions,
      lastChecked: Date.now()
    })
  }

  /**
   * Remove permission
   */
  removePermission(toolId: string): boolean {
    return this.permissions.delete(toolId)
  }

  /**
   * Restrict tool
   */
  restrict(toolId: string): void {
    this.restrictedTools.add(toolId)
  }

  /**
   * Unrestrict tool
   */
  unrestrict(toolId: string): void {
    this.restrictedTools.delete(toolId)
  }

  /**
   * Set global allowed
   */
  setGlobalAllowed(allowed: boolean): void {
    this.globalAllowed = allowed
  }

  /**
   * Get permission
   */
  getPermission(toolId: string): ToolPermission | undefined {
    return this.permissions.get(toolId)
  }

  /**
   * Get restricted tools
   */
  getRestrictedTools(): string[] {
    return Array.from(this.restrictedTools)
  }

  /**
   * Get check history
   */
  getHistory(): Array<{ toolId: string; allowed: boolean; timestamp: number }> {
    return [...this.checkHistory]
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.checkHistory = []
  }

  /**
   * Get stats
   */
  getStats(): {
    permissionsCount: number
    restrictedCount: number
    checksCount: number
    allowedRate: number
  } {
    const checks = this.checkHistory
    const allowed = checks.filter(c => c.allowed).length

    return {
      permissionsCount: this.permissions.size,
      restrictedCount: this.restrictedTools.size,
      checksCount: checks.length,
      allowedRate: checks.length > 0 ? allowed / checks.length : 0
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.permissions.clear()
    this.globalAllowed = true
    this.restrictedTools.clear()
    this.checkHistory = []
  }
}

// Global singleton
export const useCanUseTool = new UseCanUseTool()

export default useCanUseTool