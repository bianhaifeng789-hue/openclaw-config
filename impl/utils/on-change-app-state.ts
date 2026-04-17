// @ts-nocheck

/**
 * OnChange AppState Pattern - 状态变化监听
 * 
 * Source: Claude Code state/onChangeAppState.ts
 * Pattern: onChange + state change detection + diff + notifications
 */

interface ChangeRecord {
  key: string
  oldValue: any
  newValue: any
  timestamp: number
}

class OnChangeAppState {
  private previousState: Record<string, any> = {}
  private changeHistory: ChangeRecord[] = []
  private listeners = new Map<string, Set<(oldValue: any, newValue: any) => void>>()

  /**
   * Register listener
   */
  on(key: string, listener: (oldValue: any, newValue: any) => void): () => void {
    const listeners = this.listeners.get(key) ?? new Set()
    listeners.add(listener)
    this.listeners.set(key, listeners)

    return () => {
      listeners.delete(listener)
    }
  }

  /**
   * Detect changes
   */
  detectChanges(newState: Record<string, any>): ChangeRecord[] {
    const changes: ChangeRecord[] = []

    for (const [key, newValue] of Object.entries(newState)) {
      const oldValue = this.previousState[key]

      if (oldValue !== newValue) {
        const record: ChangeRecord = {
          key,
          oldValue,
          newValue,
          timestamp: Date.now()
        }

        changes.push(record)
        this.changeHistory.push(record)

        // Notify listeners
        const listeners = this.listeners.get(key)
        if (listeners) {
          for (const listener of listeners) {
            listener(oldValue, newValue)
          }
        }
      }
    }

    this.previousState = { ...newState }

    return changes
  }

  /**
   * Get change history
   */
  getHistory(): ChangeRecord[] {
    return [...this.changeHistory]
  }

  /**
   * Get history by key
   */
  getHistoryByKey(key: string): ChangeRecord[] {
    return this.changeHistory.filter(c => c.key === key)
  }

  /**
   * Get last change
   */
  getLastChange(key?: string): ChangeRecord | null {
    if (key) {
      const filtered = this.changeHistory.filter(c => c.key === key)
      return filtered.length > 0 ? filtered[filtered.length - 1] : null
    }

    return this.changeHistory.length > 0 ? this.changeHistory[this.changeHistory.length - 1] : null
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.changeHistory = []
  }

  /**
   * Get previous state
   */
  getPreviousState(): Record<string, any> {
    return { ...this.previousState }
  }

  /**
   * Remove all listeners for key
   */
  removeAllListeners(key: string): boolean {
    return this.listeners.delete(key)
  }

  /**
   * Get stats
   */
  getStats(): {
    historyCount: number
    listenersCount: number
    keysWithListeners: number
  } {
    const keysWithListeners = this.listeners.size
    const totalListeners = Array.from(this.listeners.values())
      .reduce((sum, set) => sum + set.size, 0)

    return {
      historyCount: this.changeHistory.length,
      listenersCount: totalListeners,
      keysWithListeners
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.previousState = {}
    this.changeHistory = []
    this.listeners.clear()
  }
}

// Global singleton
export const onChangeAppState = new OnChangeAppState()

export default onChangeAppState