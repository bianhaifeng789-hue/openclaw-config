// @ts-nocheck

/**
 * Progress Tracker Pattern - 进度追踪
 * 
 * Source: Claude Code tools/shared/progressTracker.ts
 * Pattern: progress tracker + progress reporting + completion tracking + metrics
 */

interface ProgressTrackerState {
  id: string
  progress: number
  total: number
  message: string
  startedAt: number
  updatedAt: number
  completed: boolean
}

class ProgressTracker {
  private trackers = new Map<string, ProgressTrackerState>()
  private trackerCounter = 0
  private listeners = new Set<(state: ProgressTrackerState) => void>()

  /**
   * Create tracker
   */
  create(total: number, message?: string): ProgressTrackerState {
    const id = `progress-${++this.trackerCounter}-${Date.now()}`

    const state: ProgressTrackerState = {
      id,
      progress: 0,
      total,
      message: message ?? 'Processing',
      startedAt: Date.now(),
      updatedAt: Date.now(),
      completed: false
    }

    this.trackers.set(id, state)
    this.notifyListeners(state)

    return state
  }

  /**
   * Update progress
   */
  update(id: string, progress: number, message?: string): boolean {
    const state = this.trackers.get(id)
    if (!state || state.completed) return false

    state.progress = Math.min(state.total, Math.max(0, progress))
    state.message = message ?? state.message
    state.updatedAt = Date.now()
    this.notifyListeners(state)

    return true
  }

  /**
   * Increment progress
   */
  increment(id: string, amount?: number): boolean {
    const state = this.trackers.get(id)
    if (!state || state.completed) return false

    state.progress = Math.min(state.total, state.progress + (amount ?? 1))
    state.updatedAt = Date.now()
    this.notifyListeners(state)

    return true
  }

  /**
   * Complete tracker
   */
  complete(id: string): boolean {
    const state = this.trackers.get(id)
    if (!state) return false

    state.progress = state.total
    state.completed = true
    state.updatedAt = Date.now()
    state.message = 'Completed'
    this.notifyListeners(state)

    return true
  }

  /**
   * Get tracker
   */
  getTracker(id: string): ProgressTrackerState | undefined {
    return this.trackers.get(id)
  }

  /**
   * Get percentage
   */
  getPercentage(id: string): number {
    const state = this.trackers.get(id)
    if (!state) return 0

    return (state.progress / state.total) * 100
  }

  /**
   * Get active trackers
   */
  getActive(): ProgressTrackerState[] {
    return Array.from(this.trackers.values())
      .filter(s => !s.completed)
  }

  /**
   * Subscribe
   */
  subscribe(listener: (state: ProgressTrackerState) => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners
   */
  private notifyListeners(state: ProgressTrackerState): void {
    for (const listener of this.listeners) {
      listener(state)
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    trackersCount: number
    activeCount: number
    completedCount: number
    averageProgress: number
  } {
    const trackers = Array.from(this.trackers.values())
    const active = trackers.filter(t => !t.completed)
    const avgProgress = trackers.length > 0
      ? trackers.reduce((sum, t) => sum + t.progress, 0) / trackers.length
      : 0

    return {
      trackersCount: trackers.length,
      activeCount: active.length,
      completedCount: trackers.filter(t => t.completed).length,
      averageProgress: avgProgress
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.trackers.clear()
    this.listeners.clear()
    this.trackerCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const progressTracker = new ProgressTracker()

export default progressTracker