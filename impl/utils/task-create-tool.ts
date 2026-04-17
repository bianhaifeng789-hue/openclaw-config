// @ts-nocheck

/**
 * Task Create Tool Pattern - 任务创建工具
 * 
 * Source: Claude Code tools/TaskCreateTool/TaskCreateTool.ts + tools/TaskCreateTool/prompt.ts
 * Pattern: task creation + background tasks + async execution + task lifecycle
 */

interface Task {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  priority: number
  createdAt: number
  startedAt: number | null
  completedAt: number | null
  result?: any
  error?: string
}

class TaskCreateTool {
  private tasks = new Map<string, Task>()
  private taskCounter = 0
  private pendingQueue: string[] = []
  private runningTasks: string[] = []

  /**
   * Create task
   */
  create(name: string, description: string, priority?: number): Task {
    const id = `task-${++this.taskCounter}-${Date.now()}`

    const task: Task = {
      id,
      name,
      description,
      status: 'pending',
      priority: priority ?? 0,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null
    }

    this.tasks.set(id, task)
    this.pendingQueue.push(id)
    this.pendingQueue.sort((a, b) => {
      const taskA = this.tasks.get(a)!
      const taskB = this.tasks.get(b)!
      return taskB.priority - taskA.priority
    })

    return task
  }

  /**
   * Start task
   */
  start(id: string): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'pending') return false

    task.status = 'running'
    task.startedAt = Date.now()

    const index = this.pendingQueue.indexOf(id)
    if (index !== -1) this.pendingQueue.splice(index, 1)

    this.runningTasks.push(id)

    return true
  }

  /**
   * Complete task
   */
  complete(id: string, result?: any): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'running') return false

    task.status = 'completed'
    task.completedAt = Date.now()
    task.result = result

    const index = this.runningTasks.indexOf(id)
    if (index !== -1) this.runningTasks.splice(index, 1)

    return true
  }

  /**
   * Fail task
   */
  fail(id: string, error: string): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status !== 'running') return false

    task.status = 'failed'
    task.completedAt = Date.now()
    task.error = error

    const index = this.runningTasks.indexOf(id)
    if (index !== -1) this.runningTasks.splice(index, 1)

    return true
  }

  /**
   * Cancel task
   */
  cancel(id: string): boolean {
    const task = this.tasks.get(id)
    if (!task || task.status === 'completed' || task.status === 'failed') return false

    task.status = 'cancelled'
    task.completedAt = Date.now()

    // Remove from queues
    const pendingIndex = this.pendingQueue.indexOf(id)
    if (pendingIndex !== -1) this.pendingQueue.splice(pendingIndex, 1)

    const runningIndex = this.runningTasks.indexOf(id)
    if (runningIndex !== -1) this.runningTasks.splice(runningIndex, 1)

    return true
  }

  /**
   * Get task
   */
  getTask(id: string): Task | undefined {
    return this.tasks.get(id)
  }

  /**
   * Get pending tasks
   */
  getPending(): Task[] {
    return this.pendingQueue
      .map(id => this.tasks.get(id))
      .filter(t => t !== undefined) as Task[]
  }

  /**
   * Get running tasks
   */
  getRunning(): Task[] {
    return this.runningTasks
      .map(id => this.tasks.get(id))
      .filter(t => t !== undefined) as Task[]
  }

  /**
   * Get completed tasks
   */
  getCompleted(): Task[] {
    return Array.from(this.tasks.values())
      .filter(t => t.status === 'completed')
  }

  /**
   * Get stats
   */
  getStats(): {
    tasksCount: number
    pendingCount: number
    runningCount: number
    completedCount: number
    failedCount: number
    cancelledCount: number
  } {
    const tasks = Array.from(this.tasks.values())

    return {
      tasksCount: tasks.length,
      pendingCount: tasks.filter(t => t.status === 'pending').length,
      runningCount: tasks.filter(t => t.status === 'running').length,
      completedCount: tasks.filter(t => t.status === 'completed').length,
      failedCount: tasks.filter(t => t.status === 'failed').length,
      cancelledCount: tasks.filter(t => t.status === 'cancelled').length
    }
  }

  /**
   * Clear completed
   */
  clearCompleted(): number {
    const completed = Array.from(this.tasks.values())
      .filter(t => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled')

    for (const task of completed) {
      this.tasks.delete(task.id)
    }

    return completed.length
  }

  /**
   * Clear all
   */
  clear(): void {
    this.tasks.clear()
    this.pendingQueue = []
    this.runningTasks = []
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
export const taskCreateTool = new TaskCreateTool()

export default taskCreateTool