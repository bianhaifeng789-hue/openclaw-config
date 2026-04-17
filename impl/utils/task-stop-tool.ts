// @ts-nocheck

/**
 * Task Stop Tool Pattern - 任务停止工具
 * 
 * Source: Claude Code tools/TaskStopTool/TaskStopTool.ts
 * Pattern: task stop + cancellation + termination + cleanup
 */

interface TaskStopResult {
  taskId: string
  stopped: boolean
  reason: string
  timestamp: number
}

class TaskStopTool {
  private stopHistory: TaskStopResult[] = []

  /**
   * Stop task
   */
  stop(taskId: string, reason?: string): TaskStopResult {
    const task = taskCreateTool.getTask(taskId)

    const result: TaskStopResult = {
      taskId,
      stopped: false,
      reason: reason ?? 'User requested stop',
      timestamp: Date.now()
    }

    if (!task) {
      result.reason = 'Task not found'
      this.stopHistory.push(result)
      return result
    }

    if (task.status === 'completed' || task.status === 'failed') {
      result.reason = 'Task already finished'
      this.stopHistory.push(result)
      return result
    }

    // Cancel task
    const cancelled = taskCreateTool.cancel(taskId)
    result.stopped = cancelled

    this.stopHistory.push(result)

    return result
  }

  /**
   * Stop all running
   */
  stopAllRunning(reason?: string): TaskStopResult[] {
    const running = taskCreateTool.getRunning()
    const results: TaskStopResult[] = []

    for (const task of running) {
      results.push(this.stop(task.id, reason ?? 'Bulk stop'))
    }

    return results
  }

  /**
   * Force stop
   */
  forceStop(taskId: string): TaskStopResult {
    // Would force terminate task process
    // For demo, just cancel
    return this.stop(taskId, 'Force stop')
  }

  /**
   * Get stop history
   */
  getStopHistory(): TaskStopResult[] {
    return [...this.stopHistory]
  }

  /**
   * Get stop history for task
   */
  getStopHistoryForTask(taskId: string): TaskStopResult[] {
    return this.stopHistory.filter(s => s.taskId === taskId)
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.stopHistory = []
  }

  /**
   * Get stats
   */
  getStats(): {
    stopsCount: number
    successfulStops: number
    failedStops: number
  } {
    const successful = this.stopHistory.filter(s => s.stopped)
    const failed = this.stopHistory.filter(s => !s.stopped)

    return {
      stopsCount: this.stopHistory.length,
      successfulStops: successful.length,
      failedStops: failed.length
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
export const taskStopTool = new TaskStopTool()

// Import taskCreateTool
import { taskCreateTool } from './task-create-tool'

export default taskStopTool