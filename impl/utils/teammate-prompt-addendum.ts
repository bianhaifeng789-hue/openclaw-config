// @ts-nocheck

/**
 * Teammate Prompt Addendum Pattern - Teammate提示补充
 * 
 * Source: Claude Code utils/swarm/teammatePromptAddendum.ts
 * Pattern: prompt addendum + context injection + system prompt extension
 */

interface PromptAddendum {
  id: string
  type: 'context' | 'instruction' | 'constraint' | 'capability'
  content: string
  priority: number
  enabled: boolean
}

interface AddendumResult {
  sessionId: string
  addenda: PromptAddendum[]
  combinedContent: string
  totalLength: number
}

class TeammatePromptAddendum {
  private addenda = new Map<string, PromptAddendum>()
  private sessionAddenda = new Map<string, string[]>()

  /**
   * Register addendum
   */
  register(id: string, type: PromptAddendum['type'], content: string, priority?: number): PromptAddendum {
    const addendum: PromptAddendum = {
      id,
      type,
      content,
      priority: priority ?? 0,
      enabled: true
    }

    this.addenda.set(id, addendum)

    return addendum
  }

  /**
   * Add to session
   */
  addToSession(sessionId: string, addendumId: string): boolean {
    const addendum = this.addenda.get(addendumId)
    if (!addendum) return false

    const list = this.sessionAddenda.get(sessionId) ?? []
    if (!list.includes(addendumId)) {
      list.push(addendumId)
    }
    this.sessionAddenda.set(sessionId, list)

    return true
  }

  /**
   * Remove from session
   */
  removeFromSession(sessionId: string, addendumId: string): boolean {
    const list = this.sessionAddenda.get(sessionId)
    if (!list) return false

    const index = list.indexOf(addendumId)
    if (index === -1) return false

    list.splice(index, 1)

    return true
  }

  /**
   * Build addenda for session
   */
  build(sessionId: string): AddendumResult {
    const list = this.sessionAddenda.get(sessionId) ?? []

    const addenda = list
      .map(id => this.addenda.get(id))
      .filter(a => a !== undefined && a.enabled) as PromptAddendum[]

    // Sort by priority
    addenda.sort((a, b) => b.priority - a.priority)

    const combinedContent = addenda.map(a => a.content).join('\n\n')

    return {
      sessionId,
      addenda,
      combinedContent,
      totalLength: combinedContent.length
    }
  }

  /**
   * Get addendum
   */
  getAddendum(id: string): PromptAddendum | undefined {
    return this.addenda.get(id)
  }

  /**
   * Enable addendum
   */
  enable(id: string): boolean {
    const addendum = this.addenda.get(id)
    if (!addendum) return false

    addendum.enabled = true

    return true
  }

  /**
   * Disable addendum
   */
  disable(id: string): boolean {
    const addendum = this.addenda.get(id)
    if (!addendum) return false

    addendum.enabled = false

    return true
  }

  /**
   * Update content
   */
  updateContent(id: string, content: string): boolean {
    const addendum = this.addenda.get(id)
    if (!addendum) return false

    addendum.content = content

    return true
  }

  /**
   * Get by type
   */
  getByType(type: PromptAddendum['type']): PromptAddendum[] {
    return Array.from(this.addenda.values())
      .filter(a => a.type === type)
  }

  /**
   * Get session addenda
   */
  getSessionAddenda(sessionId: string): PromptAddendum[] {
    const list = this.sessionAddenda.get(sessionId) ?? []
    return list.map(id => this.addenda.get(id)).filter(a => a !== undefined) as PromptAddendum[]
  }

  /**
   * Get stats
   */
  getStats(): {
    addendaCount: number
    enabledCount: number
    sessionCount: number
    byType: Record<PromptAddendum['type'], number>
  } {
    const addenda = Array.from(this.addenda.values())

    const byType: Record<PromptAddendum['type'], number> = {
      context: 0, instruction: 0, constraint: 0, capability: 0
    }

    for (const a of addenda) byType[a.type]++

    return {
      addendaCount: addenda.length,
      enabledCount: addenda.filter(a => a.enabled).length,
      sessionCount: this.sessionAddenda.size,
      byType
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.addenda.clear()
    this.sessionAddenda.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const teammatePromptAddendum = new TeammatePromptAddendum()

export default teammatePromptAddendum