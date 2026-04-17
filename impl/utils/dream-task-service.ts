// @ts-nocheck

/**
 * Dream Task Pattern - Dream任务
 * 
 * Source: Claude Code tasks/DreamTask/DreamTask.ts + components/DreamDetailDialog.tsx
 * Pattern: dream task + background processing + deferred execution + dreaming
 */

interface DreamTask {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority: number
  scheduledAt?: number
  startedAt?: number
  completedAt?: number
  result?: any
  error?: string
}

class DreamTaskService {
  private dreams = new Map<string, DreamTask>()
  private dreamCounter = 0
  private queue: string[] = []

  /**
   * Create dream
   */
  create(name: string, priority?: number, scheduledAt?: number): DreamTask {
    const id = `dream-${++this.dreamCounter}-${Date.now()}`

    const dream: DreamTask = {
      id,
      name,
      status: 'pending',
      priority: priority ?? 0,
      scheduledAt,
      startedAt: undefined,
      completedAt: undefined
    }

    this.dreams.set(id, dream)
    this.queue.push(id)
    this.sortQueue()

    return dream
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => {
      const dreamA = this.dreams.get(a)!
      const dreamB = this.dreams.get(b)!
      return dreamB.priority - dreamA.priority
    })
  }

  /**
   * Start dream
   */
  start(id: string): boolean {
    const dream = this.dreams.get(id)
    if (!dream || dream.status !== 'pending') return false

    dream.status = 'running'
    dream.startedAt = Date.now()

    const index = this.queue.indexOf(id)
    if (index !== -1) this.queue.splice(index, 1)

    return true
  }

  /**
   * Complete dream
   */
  complete(id: string, result?: any): boolean {
    const dream = this.dreams.get(id)
    if (!dream || dream.status !== 'running') return false

    dream.status = 'completed'
    dream.completedAt = Date.now()
    dream.result = result

    return true
  }

  /**
   * Fail dream
   */
  fail(id: string, error?: string): boolean {
    const dream = this.dreams.get(id)
    if (!dream || dream.status !== 'running') return false

    dream.status = 'failed'
    dream.completedAt = Date.now()
    dream.error = error

    return true
  }

  /**
   * Get dream
   */
  getDream(id: string): DreamTask | undefined {
    return this.dreams.get(id)
  }

  /**
   * Get pending dreams
   */
  getPending(): DreamTask[] {
    return this.queue
      .map(id => this.dreams.get(id))
      .filter(d => d !== undefined) as DreamTask[]
  }

  /**
   * Get running dreams
   */
  getRunning(): DreamTask[] {
    return Array.from(this.dreams.values())
      .filter(d => d.status === 'running')
  }

  /**
   * Get completed dreams
   */
  getCompleted(): DreamTask[] {
    return Array.from(this.dreams.values())
      .filter(d => d.status === 'completed')
  }

  /**
   * Get stats
   */
  getStats(): {
    dreamsCount: number
    pendingCount: number
    runningCount: number
    completedCount: number
    failedCount: number
  } {
    const dreams = Array.from(this.dreams.values())

    return {
      dreamsCount: dreams.length,
      pendingCount: dreams.filter(d => d.status === 'pending').length,
      runningCount: dreams.filter(d => d.status === 'running').length,
      completedCount: dreams.filter(d => d.status === 'completed').length,
      failedCount: dreams.filter(d => d.status === 'failed').length
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.dreams.clear()
    this.queue = []
    this.dreamCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const dreamTaskService = new DreamTaskService()

export default dreamTaskService