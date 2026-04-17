// @ts-nocheck

/**
 * AppState Provider Pattern - AppState提供者
 * 
 * Source: Claude Code state/AppState.tsx + state/AppState.ts
 * Pattern: state provider + context + React integration
 */

interface AppStateProviderConfig {
  initialState: Partial<AppState>
  middleware: Array<(state: AppState, action: string) => AppState>
  persistKey?: string
}

class AppStateProvider {
  private state: AppState
  private listeners = new Set<(state: AppState) => void>()
  private middleware: Array<(state: AppState, action: string) => AppState> = []
  private persistKey: string | null = null

  constructor(config?: AppStateProviderConfig) {
    this.state = {
      sessionId: null,
      modelId: null,
      projectPath: null,
      status: 'idle',
      messages: [],
      tools: [],
      config: config?.initialState?.config ?? {}
    }

    this.middleware = config?.middleware ?? []
    this.persistKey = config?.persistKey ?? null
  }

  /**
   * Get state
   */
  getState(): AppState {
    return { ...this.state }
  }

  /**
   * Dispatch action
   */
  dispatch(action: string, payload?: any): AppState {
    let newState = { ...this.state, ...payload }

    // Apply middleware
    for (const mw of this.middleware) {
      newState = mw(newState, action)
    }

    this.state = newState

    // Persist if configured
    if (this.persistKey) {
      this.persist()
    }

    // Notify listeners
    for (const listener of this.listeners) {
      listener(this.state)
    }

    return this.state
  }

  /**
   * Subscribe
   */
  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * Persist state
   */
  private persist(): void {
    if (!this.persistKey) return

    // Would write to storage
    // For demo, just track
    console.log(`[AppStateProvider] Persisting to ${this.persistKey}`)
  }

  /**
   * Restore state
   */
  restore(): boolean {
    if (!this.persistKey) return false

    // Would read from storage
    // For demo, return false
    return false
  }

  /**
   * Add middleware
   */
  addMiddleware(mw: (state: AppState, action: string) => AppState): void {
    this.middleware.push(mw)
  }

  /**
   * Remove middleware
   */
  removeMiddleware(mw: (state: AppState, action: string) => AppState): boolean {
    const index = this.middleware.indexOf(mw)
    if (index === -1) return false

    this.middleware.splice(index, 1)

    return true
  }

  /**
   * Reset
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

    for (const listener of this.listeners) {
      listener(this.state)
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    listenersCount: number
    middlewareCount: number
    stateSize: number
  } {
    return {
      listenersCount: this.listeners.size,
      middlewareCount: this.middleware.length,
      stateSize: JSON.stringify(this.state).length
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.reset()
    this.listeners.clear()
    this.middleware = []
    this.persistKey = null
  }
}

// Global instance
export const appStateProvider = new AppStateProvider()

export default appStateProvider

// Type import
import { AppState } from './app-state-store'