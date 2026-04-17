// @ts-nocheck

/**
 * Selectors Pattern - 选择器
 * 
 * Source: Claude Code state/selectors.ts
 * Pattern: selectors + derived state + memoization + query functions
 */

interface AppStateLike {
  sessionId: string | null
  modelId: string | null
  projectPath: string | null
  status: string
  messages: Array<{ id: string; role: string; content: string }>
  tools: Array<{ id: string; name: string; status: string }>
  config: Record<string, any>
}

class Selectors {
  private cache = new Map<string, { value: any; deps: any[] }>()

  /**
   * Create memoized selector
   */
  create<T>(key: string, selector: (state: AppStateLike) => T, deps?: (state: AppStateLike) => any[]): (state: AppStateLike) => T {
    return (state: AppStateLike) => {
      const depValues = deps ? deps(state) : []

      const cached = this.cache.get(key)
      if (cached && this.depsEqual(cached.deps, depValues)) {
        return cached.value
      }

      const value = selector(state)

      this.cache.set(key, { value, deps: depValues })

      return value
    }
  }

  /**
   * Compare deps
   */
  private depsEqual(a: any[], b: any[]): boolean {
    if (a.length !== b.length) return false

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }

    return true
  }

  /**
   * Select session ID
   */
  selectSessionId(state: AppStateLike): string | null {
    return state.sessionId
  }

  /**
   * Select model ID
   */
  selectModelId(state: AppStateLike): string | null {
    return state.modelId
  }

  /**
   * Select project path
   */
  selectProjectPath(state: AppStateLike): string | null {
    return state.projectPath
  }

  /**
   * Select status
   */
  selectStatus(state: AppStateLike): string {
    return state.status
  }

  /**
   * Select messages
   */
  selectMessages(state: AppStateLike): Array<{ id: string; role: string; content: string }> {
    return state.messages
  }

  /**
   * Select message count
   */
  selectMessageCount(state: AppStateLike): number {
    return state.messages.length
  }

  /**
   * Select last message
   */
  selectLastMessage(state: AppStateLike): { id: string; role: string; content: string } | null {
    return state.messages.length > 0 ? state.messages[state.messages.length - 1] : null
  }

  /**
   * Select user messages
   */
  selectUserMessages(state: AppStateLike): Array<{ id: string; role: string; content: string }> {
    return state.messages.filter(m => m.role === 'user')
  }

  /**
   * Select assistant messages
   */
  selectAssistantMessages(state: AppStateLike): Array<{ id: string; role: string; content: string }> {
    return state.messages.filter(m => m.role === 'assistant')
  }

  /**
   * Select tools
   */
  selectTools(state: AppStateLike): Array<{ id: string; name: string; status: string }> {
    return state.tools
  }

  /**
   * Select active tools
   */
  selectActiveTools(state: AppStateLike): Array<{ id: string; name: string; status: string }> {
    return state.tools.filter(t => t.status === 'active')
  }

  /**
   * Select config
   */
  selectConfig(state: AppStateLike): Record<string, any> {
    return state.config
  }

  /**
   * Select config value
   */
  selectConfigValue(state: AppStateLike, key: string): any {
    return state.config[key]
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getCacheStats(): {
    cachedCount: number
    cacheKeys: string[]
  } {
    return {
      cachedCount: this.cache.size,
      cacheKeys: Array.from(this.cache.keys())
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearCache()
  }
}

// Global singleton
export const selectors = new Selectors()

export default selectors