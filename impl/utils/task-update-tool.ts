// @ts-nocheck

/**
 * Task Update Tool Pattern - 任务更新工具
 * 
 * Source: Claude Code tools/TaskUpdateTool/TaskUpdateTool.ts
 * Pattern: task update + modification + priority change + status update
 */

interface TaskUpdateResult {
  taskId: string
  updated: boolean
  changes: Record<string, { old: any; new: any }>
  timestamp: number
}

class TaskUpdateTool {
  private updateHistory: TaskUpdateResult[] = []

  /**
   * Update task
   */
  update(taskId: string, updates: Partial<Task>): TaskUpdateResult {
    const task = taskCreateTool.getTask(taskId)

    const result: TaskUpdateResult = {
      taskId,
      updated: false,
      changes: {},
      timestamp: Date.now()
    }

    if (!task) {
      this.updateHistory.push(result)
      return result
    }

    // Apply updates
    for (const [key, value] of Object.entries(updates)) {
      if (key in task && task[key as keyof Task] !== value) {
        result.changes[key] = {
          old: task[key as keyof Task],
          new: value
        }
        (task as any)[key] = value
      }
    }

    result.updated = Object.keys(result.changes).length > 0

    this.updateHistory.push(result)

    return result
  }

  /**
   * Update priority
   */
  updatePriority(taskId: string, priority: number): TaskUpdateResult {
    return this.update(taskId, { priority })
  }

  /**
   * Update name
   */
  updateName(taskId: string, name: string): TaskUpdateResult {
    return this.update(taskId, { name })
  }

  /**
   * Update description
   */
  updateDescription(taskId: string, description: string): TaskUpdateResult {
    return this.update(taskId, { description })
  }

  /**
   * Update status
   */
  updateStatus(taskId: string, status: Task['status']): TaskUpdateResult {
    return this.update(taskId, { status })
  }

  /**
   * Set result
   */
  setResult(taskId: string, result: any): TaskUpdateResult {
    return this.update(taskId, { result })
  }

  /**
   * Set error
   */
  setError(taskId: string, error: string): TaskUpdateResult {
    return this.update(taskId, { error })
  }

  /**
   * Get update history
   */
  getHistory(): TaskUpdateResult[] {
    return [...this.updateHistory]
  }

  /**
   * Get history for task
   */
  getHistoryForTask(taskId: string): TaskUpdateResult[] {
    return this.updateHistory.filter(u => u.taskId === taskId)
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.updateHistory = []
  }

  /**
   * Get stats
   */
  getStats(): {
    updatesCount: number
    successfulUpdates: number
    totalChanges: number
  } {
    const successful = this.updateHistory.filter(u => u.updated)
    const totalChanges = successful.reduce((sum, u) => sum + Object.keys(u.changes).length, 0)

    return {
      updatesCount: this.updateHistory.length,
      successfulUpdates: successful.length,
      totalChanges: totalChanges
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const taskUpdateTool = new TaskUpdateTool()

// Import Task type
import { Task, taskCreateTool } from './task-create-tool'

export default taskUpdateTool