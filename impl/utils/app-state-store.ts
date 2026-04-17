// @ts-nocheck

/**
 * AppState Store Pattern - 应用状态存储
 * 
 * Source: Claude Code state/AppStateStore.ts + state/store.ts
 * Pattern: app state store + redux-like + selectors + subscriptions
 */

interface AppState {
  sessionId: string | null
  modelId: string | null
  projectPath: string | null
  status: 'idle' | 'running' | 'paused' | 'error'
  messages: Array<{ id: string; role: string; content: string }>
  tools: Array<{ id: string; name: string; status: string }>
  config: Record<string, any>
}

interface StateSubscription {
  id: string
  selector: (state: AppState) => any
  callback: (value: any) => void
}

class AppStateStore {
  private state: AppState = {
    sessionId: null,
    modelId: null,
    projectPath: null,
    status: 'idle',
    messages: [],
    tools: [],
    config: {}
  }

  private subscriptions = new Map<string, StateSubscription>()
  private subscriptionCounter = 0

  /**
   * Get state
   */
  getState(): AppState {
    return { ...this.state }
  }

  /**
   * Update state
   */
  update(updates: Partial<AppState>): void {
    const prevState = { ...this.state }
    this.state = { ...this.state, ...updates }

    // Notify subscribers
    for (const sub of this.subscriptions.values()) {
      const prevValue = sub.selector(prevState)
      const newValue = sub.selector(this.state)

      if (prevValue !== newValue) {
        sub.callback(newValue)
      }
    }
  }

  /**
   * Subscribe
   */
  subscribe(selector: (state: AppState) => any, callback: (value: any) => void): string {
    const id = `sub-${++this.subscriptionCounter}`

    this.subscriptions.set(id, {
      id,
      selector,
      callback
    })

    return id
  }

  /**
   * Unsubscribe
   */
  unsubscribe(id: string): boolean {
    return this.subscriptions.delete(id)
  }

  /**
   * Select value
   */
  select<T>(selector: (state: AppState) => T): T {
    return selector(this.state)
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.state.sessionId
  }

  /**
   * Get model ID
   */
  getModelId(): string | null {
    return this.state.modelId
  }

  /**
   * Get status
   */
  getStatus(): AppState['status'] {
    return this.state.status
  }

  /**
   * Add message
   */
  addMessage(role: string, content: string): string {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    this.state.messages.push({ id, role, content })

    this.update({ messages: this.state.messages })

    return id
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.update({ messages: [] })
  }

  /**
   * Add tool
   */
  addTool(name: string, status: string): string {
    const id = `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    this.state.tools.push({ id, name, status })

    this.update({ tools: this.state.tools })

    return id
  }

  /**
   * Update tool status
   */
  updateToolStatus(toolId: string, status: string): boolean {
    const tool = this.state.tools.find(t => t.id === toolId)
    if (!tool) return false

    tool.status = status

    this.update({ tools: this.state.tools })

    return true
  }

  /**
   * Set config
   */
  setConfig(key: string, value: any): void {
    this.state.config[key] = value

    this.update({ config: this.state.config })
  }

  /**
   * Get config
   */
  getConfig(key: string): any {
    return this.state.config[key]
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {
      sessionId: null,
      modelId: null,
      projectPath: null,
      status: 'idle',
      messages: [],
      tools: [],
      config: {}
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    subscriptionsCount: number
    messagesCount: number
    toolsCount: number
    configKeys: number
  } {
    return {
      subscriptionsCount: this.subscriptions.size,
      messagesCount: this.state.messages.length,
      toolsCount: this.state.tools.length,
      configKeys: Object.keys(this.state.config).length
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.reset()
    this.subscriptions.clear()
    this.subscriptionCounter = 0
  }
}

// Global singleton
export const appStateStore = new AppStateStore()

export default appStateStore