// @ts-nocheck

/**
 * Task List Tool Pattern - 任务列表工具
 * 
 * Source: Claude Code tools/TaskListTool/TaskListTool.ts
 * Pattern: task listing + filtering + pagination + task queries
 */

interface TaskListOptions {
  status?: string
  priorityMin?: number
  priorityMax?: number
  limit?: number
  offset?: number
}

class TaskListTool {
  /**
   * List all tasks
   */
  list(): Task[] {
    return taskCreateTool.getAll()
  }

  /**
   * List with options
   */
  listWithOptions(options: TaskListOptions): Task[] {
    let tasks = this.list()

    // Filter by status
    if (options.status) {
      tasks = tasks.filter(t => t.status === options.status)
    }

    // Filter by priority
    if (options.priorityMin !== undefined) {
      tasks = tasks.filter(t => t.priority >= options.priorityMin!)
    }

    if (options.priorityMax !== undefined) {
      tasks = tasks.filter(t => t.priority <= options.priorityMax!)
    }

    // Apply pagination
    if (options.offset !== undefined) {
      tasks = tasks.slice(options.offset)
    }

    if (options.limit !== undefined) {
      tasks = tasks.slice(0, options.limit)
    }

    return tasks
  }

  /**
   * List pending
   */
  listPending(): Task[] {
    return taskCreateTool.getPending()
  }

  /**
   * List running
   */
  listRunning(): Task[] {
    return taskCreateTool.getRunning()
  }

  /**
   * List completed
   */
  listCompleted(): Task[] {
    return taskCreateTool.getCompleted()
  }

  /**
   * List failed
   */
  listFailed(): Task[] {
    return this.listWithOptions({ status: 'failed' })
  }

  /**
   * List by priority
   */
  listByPriority(priority: number): Task[] {
    return this.listWithOptions({ priorityMin: priority, priorityMax: priority })
  }

  /**
   * List high priority
   */
  listHighPriority(): Task[] {
    return this.listWithOptions({ priorityMin: 8 })
  }

  /**
   * List recent
   */
  listRecent(count: number = 10): Task[] {
    return this.list()
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, count)
  }

  /**
   * Count tasks
   */
  count(): number {
    return this.list().length
  }

  /**
   * Count by status
   */
  countByStatus(status: string): number {
    return this.listWithOptions({ status }).length
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number
    pending: number
    running: number
    completed: number
    failed: number
    cancelled: number
  } {
    const stats = taskCreateTool.getStats()

    return {
      total: stats.tasksCount,
      pending: stats.pendingCount,
      running: stats.runningCount,
      completed: stats.completedCount,
      failed: stats.failedCount,
      cancelled: stats.cancelledCount
    }
  }
}

// Global singleton
export const taskListTool = new TaskListTool()

// Import Task type
import { Task, taskCreateTool } from './task-create-tool'

export default taskListTool