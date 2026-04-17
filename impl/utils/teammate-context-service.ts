// @ts-nocheck

/**
 * Teammate Context Pattern - Teammate上下文
 * 
 * Source: Claude Code utils/teammateContext.ts
 * Pattern: teammate context + shared state + inheritance + flags
 */

interface TeammateContext {
  sessionId: string
  projectId: string
  inheritedFlags: Record<string, boolean>
  sharedState: Record<string, any>
  parentContext?: string
  createdAt: number
  updatedAt: number
}

class TeammateContextService {
  private contexts = new Map<string, TeammateContext>()

  /**
   * Create context
   */
  create(sessionId: string, projectId: string, inheritedFlags: Record<string, boolean>): TeammateContext {
    const context: TeammateContext = {
      sessionId,
      projectId,
      inheritedFlags,
      sharedState: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.contexts.set(sessionId, context)

    return context
  }

  /**
   * Get context
   */
  getContext(sessionId: string): TeammateContext | undefined {
    return this.contexts.get(sessionId)
  }

  /**
   * Update shared state
   */
  updateState(sessionId: string, state: Record<string, any>): boolean {
    const context = this.contexts.get(sessionId)
    if (!context) return false

    context.sharedState = { ...context.sharedState, ...state }
    context.updatedAt = Date.now()

    return true
  }

  /**
   * Set parent context
   */
  setParent(sessionId: string, parentSessionId: string): boolean {
    const context = this.contexts.get(sessionId)
    if (!context) return false

    context.parentContext = parentSessionId

    return true
  }

  /**
   * Get inherited flags
   */
  getInheritedFlags(sessionId: string): Record<string, boolean> | null {
    const context = this.contexts.get(sessionId)
    return context?.inheritedFlags ?? null
  }

  /**
   * Check inherited flag
   */
  checkFlag(sessionId: string, flag: string): boolean {
    const context = this.contexts.get(sessionId)
    return context?.inheritedFlags[flag] ?? false
  }

  /**
   * Set inherited flag
   */
  setFlag(sessionId: string, flag: string, value: boolean): boolean {
    const context = this.contexts.get(sessionId)
    if (!context) return false

    context.inheritedFlags[flag] = value
    context.updatedAt = Date.now()

    return true
  }

  /**
   * Get contexts by project
   */
  getByProject(projectId: string): TeammateContext[] {
    return Array.from(this.contexts.values())
      .filter(c => c.projectId === projectId)
  }

  /**
   * Get child contexts
   */
  getChildren(parentSessionId: string): TeammateContext[] {
    return Array.from(this.contexts.values())
      .filter(c => c.parentContext === parentSessionId)
  }

  /**
   * Delete context
   */
  deleteContext(sessionId: string): boolean {
    return this.contexts.delete(sessionId)
  }

  /**
   * Get stats
   */
  getStats(): {
    contextsCount: number
    projectsCount: number
    withParentsCount: number
    averageFlags: number
  } {
    const contexts = Array.from(this.contexts.values())
    const projects = new Set(contexts.map(c => c.projectId))
    const withParents = contexts.filter(c => c.parentContext).length
    const avgFlags = contexts.length > 0
      ? contexts.reduce((sum, c) => sum + Object.keys(c.inheritedFlags).length, 0) / contexts.length
      : 0

    return {
      contextsCount: contexts.length,
      projectsCount: projects.size,
      withParentsCount: withParents,
      averageFlags: avgFlags
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.contexts.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const teammateContextService = new TeammateContextService()

export default teammateContextService