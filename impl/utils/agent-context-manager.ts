// @ts-nocheck

/**
 * Agent Context Pattern - Agent上下文
 * 
 * Source: Claude Code utils/agentContext.ts + utils/workloadContext.ts
 * Pattern: agent context + workload + inheritance + propagation
 */

interface AgentContext {
  agentId: string
  parentId?: string
  workload: string
  role?: string
  capabilities?: string[]
  createdAt: number
  metadata?: Record<string, any>
}

interface ContextInheritance {
  from: string
  to: string
  inheritedAt: number
  fields: string[]
}

class AgentContextManager {
  private contexts = new Map<string, AgentContext>()
  private inheritances: ContextInheritance[] = []
  private contextCounter = 0

  /**
   * Create context
   */
  createContext(workload: string, parentId?: string, role?: string): AgentContext {
    const agentId = `agent-${++this.contextCounter}-${Date.now()}`

    const context: AgentContext = {
      agentId,
      parentId,
      workload,
      role,
      capabilities: [],
      createdAt: Date.now()
    }

    // Inherit from parent
    if (parentId) {
      this.inherit(parentId, agentId)
    }

    this.contexts.set(agentId, context)

    return context
  }

  /**
   * Inherit context
   */
  inherit(fromId: string, toId: string, fields?: string[]): void {
    const parent = this.contexts.get(fromId)
    const child = this.contexts.get(toId)

    if (!parent || !child) return

    const inheritFields = fields ?? ['capabilities', 'role', 'metadata']

    for (const field of inheritFields) {
      if (parent[field as keyof AgentContext]) {
        (child as any)[field] = parent[field as keyof AgentContext]
      }
    }

    child.parentId = fromId

    this.inheritances.push({
      from: fromId,
      to: toId,
      inheritedAt: Date.now(),
      fields: inheritFields
    })
  }

  /**
   * Get context
   */
  getContext(agentId: string): AgentContext | undefined {
    return this.contexts.get(agentId)
  }

  /**
   * Update context
   */
  updateContext(agentId: string, updates: Partial<AgentContext>): AgentContext | null {
    const context = this.contexts.get(agentId)
    if (!context) return null

    Object.assign(context, updates)

    return context
  }

  /**
   * Add capability
   */
  addCapability(agentId: string, capability: string): void {
    const context = this.contexts.get(agentId)
    if (!context) return

    if (!context.capabilities) {
      context.capabilities = []
    }

    if (!context.capabilities.includes(capability)) {
      context.capabilities.push(capability)
    }
  }

  /**
   * Check capability
   */
  hasCapability(agentId: string, capability: string): boolean {
    const context = this.contexts.get(agentId)
    return context?.capabilities?.includes(capability) ?? false
  }

  /**
   * Get children
   */
  getChildren(parentId: string): AgentContext[] {
    return Array.from(this.contexts.values())
      .filter(c => c.parentId === parentId)
  }

  /**
   * Get ancestry
   */
  getAncestry(agentId: string): AgentContext[] {
    const ancestry: AgentContext[] = []
    let current = this.contexts.get(agentId)

    while (current?.parentId) {
      const parent = this.contexts.get(current.parentId)
      if (parent) ancestry.push(parent)
      current = parent
    }

    return ancestry
  }

  /**
   * Get all contexts
   */
  getAllContexts(): AgentContext[] {
    return Array.from(this.contexts.values())
  }

  /**
   * Get stats
   */
  getStats(): {
    contextCount: number
    inheritanceCount: number
    rootCount: number
    leafCount: number
  } {
    const contexts = Array.from(this.contexts.values())
    const roots = contexts.filter(c => !c.parentId)
    const parents = new Set(contexts.filter(c => c.parentId).map(c => c.parentId!))
    const leaves = contexts.filter(c => !parents.has(c.agentId))

    return {
      contextCount: this.contexts.size,
      inheritanceCount: this.inheritances.length,
      rootCount: roots.length,
      leafCount: leaves.length
    }
  }

  /**
   * Delete context
   */
  deleteContext(agentId: string): boolean {
    return this.contexts.delete(agentId)
  }

  /**
   * Clear all
   */
  clear(): void {
    this.contexts.clear()
    this.inheritances = []
    this.contextCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const agentContextManager = new AgentContextManager()

export default agentContextManager