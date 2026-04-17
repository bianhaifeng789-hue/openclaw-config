// @ts-nocheck

/**
 * Background Task Pattern - 后台任务
 * 
 * Source: Claude Code components/tasks/BackgroundTask.tsx
 * Pattern: background task + async execution + progress tracking + UI
 */

export interface BackgroundTask {
  id: string
  name: string
  progress: number
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startedAt: number
  completedAt?: number
  error?: string
}

class BackgroundTaskService {
  private tasks = new Map<string, BackgroundTask>()
  private taskCounter = 0
  private listeners = new Set<(task: BackgroundTask) => void>()

  /**
   * Create background task
   */
  create(name: string): BackgroundTask {
    const id = `bg-${++this.taskCounter}-${Date.now()}`

    const task: BackgroundTask = {
      id,
      name,
      progress: 0,
      status: 'running',
      startedAt: Date.now()
    }

    this.tasks.set(id, task)
    this.notifyListeners(task)

    return task
  }

  /**
   * Update progress
   */
  updateProgress(id: string, progress: number): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'running') return false

    task.progress = Math.min(100, Math.max(0, progress))
    this.notifyListeners(task)

    return true
  }

  /**
   * Complete task
   */
  complete(id: string): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'running') return false

    task.status = 'completed'
    task.progress = 100
    task.completedAt = Date.now()
    this.notifyListeners(task)

    return true
  }

  /**
   * Fail task
   */
  fail(id: string, error?: string): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'running') return false

    task.status = 'failed'
    task.error = error
    task.completedAt = Date.now()
    this.notifyListeners(task)

    return true
  }

  /**
   * Cancel task
   */
  cancel(id: string): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'running') return false

    task.status = 'cancelled'
    task.completedAt = Date.now()
    this.notifyListeners(task)

    return true
  }

  /**
   * Get task
   */
  getTask(id: string): BackgroundTask | undefined {
    return this.tasks.get(id)
  }

  /**
   * Get running tasks
   */
  getRunning(): BackgroundTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'running')
  }

  /**
   * Get completed tasks
   */
  getCompleted(): BackgroundTask[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'completed')
  }

  /**
   * Subscribe
   */
  subscribe(listener: (task: BackgroundTask) => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners
   */
  private notifyListeners(task: BackgroundTask): void {
    for (const listener of this.listeners) {
      listener(task)
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    tasksCount: number
    runningCount: number
    completedCount: number
    failedCount: number
    cancelledCount: number
    averageProgress: number
  } {
    const tasks = Array.from(this.tasks.values())
    const running = tasks.filter(t => t.status === 'running')
    const avgProgress = running.length > 0
      ? running.reduce((sum, t) => sum + t.progress, 0) / running.length
      : 0

    return {
      tasksCount: tasks.length,
      runningCount: running.length,
      completedCount: tasks.filter(t => t.status === 'completed').length,
      failedCount: tasks.filter(t => t.status === 'failed').length,
      cancelledCount: tasks.filter(t => t.status === 'cancelled').length,
      averageProgress: avgProgress
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.tasks.clear()
    this.listeners.clear()
    this.taskCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const backgroundTaskService = new BackgroundTaskService()

export default backgroundTaskService