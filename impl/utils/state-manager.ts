// @ts-nocheck

/**
 * State Manager Pattern - 状态管理
 * 
 * Source: Claude Code utils/stateManager.ts + state/StateManager.ts
 * Pattern: state manager + state machine + transitions + lifecycle
 */

interface StateTransition {
  from: string
  to: string
  action: string
  timestamp: number
}

interface ManagedState {
  id: string
  current: string
  history: StateTransition[]
  metadata: Record<string, any>
  createdAt: number
  updatedAt: number
}

class StateManager {
  private states = new Map<string, ManagedState>()
  private transitions = new Map<string, Array<{ from: string; to: string; action: string }>>()
  private stateCounter = 0

  /**
   * Define allowed transitions
   */
  defineTransitions(stateId: string, transitions: Array<{ from: string; to: string; action: string }>): void {
    this.transitions.set(stateId, transitions)
  }

  /**
   * Create state
   */
  create(initialState: string, metadata?: Record<string, any>): ManagedState {
    const id = `state-${++this.stateCounter}-${Date.now()}`

    const state: ManagedState = {
      id,
      current: initialState,
      history: [],
      metadata: metadata ?? {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.states.set(id, state)

    return state
  }

  /**
   * Transition state
   */
  transition(stateId: string, action: string): boolean {
    const state = this.states.get(stateId)
    if (!state) return false

    const allowed = this.transitions.get(stateId) ?? []
    const transition = allowed.find(t => t.from === state.current && t.action === action)

    if (!transition) return false

    const record: StateTransition = {
      from: state.current,
      to: transition.to,
      action,
      timestamp: Date.now()
    }

    state.history.push(record)
    state.current = transition.to
    state.updatedAt = Date.now()

    return true
  }

  /**
   * Force state
   */
  force(stateId: string, newState: string): boolean {
    const state = this.states.get(stateId)
    if (!state) return false

    state.current = newState
    state.updatedAt = Date.now()

    return true
  }

  /**
   * Get state
   */
  getState(stateId: string): ManagedState | undefined {
    return this.states.get(stateId)
  }

  /**
   * Get current
   */
  getCurrent(stateId: string): string | null {
    const state = this.states.get(stateId)
    return state?.current ?? null
  }

  /**
   * Get history
   */
  getHistory(stateId: string): StateTransition[] {
    const state = this.states.get(stateId)
    return state?.history ?? []
  }

  /**
   * Can transition
   */
  canTransition(stateId: string, action: string): boolean {
    const state = this.states.get(stateId)
    if (!state) return false

    const allowed = this.transitions.get(stateId) ?? []
    return allowed.some(t => t.from === state.current && t.action === action)
  }

  /**
   * Get allowed actions
   */
  getAllowedActions(stateId: string): string[] {
    const state = this.states.get(stateId)
    if (!state) return []

    const allowed = this.transitions.get(stateId) ?? []
    return allowed.filter(t => t.from === state.current).map(t => t.action)
  }

  /**
   * Delete state
   */
  deleteState(stateId: string): boolean {
    return this.states.delete(stateId)
  }

  /**
   * Get stats
   */
  getStats(): {
    statesCount: number
    transitionsCount: number
    averageHistoryLength: number
  } {
    const states = Array.from(this.states.values())

    const avgHistory = states.length > 0
      ? states.reduce((sum, s) => sum + s.history.length, 0) / states.length
      : 0

    return {
      statesCount: states.length,
      transitionsCount: this.transitions.size,
      averageHistoryLength: avgHistory
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.states.clear()
    this.transitions.clear()
    this.stateCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const stateManager = new StateManager()

export default stateManager