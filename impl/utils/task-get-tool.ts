// @ts-nocheck

/**
 * Task Get Tool Pattern - 任务获取工具
 * 
 * Source: Claude Code tools/TaskGetTool/TaskGetTool.ts
 * Pattern: task retrieval + task info + status check + result fetch
 */

class TaskGetTool {
  /**
   * Get task
   */
  get(taskId: string): Task | null {
    // Would fetch from task store
    // For now, use taskCreateTool
    return taskCreateTool.getTask(taskId) ?? null
  }

  /**
   * Get task status
   */
  getStatus(taskId: string): string | null {
    const task = this.get(taskId)
    return task?.status ?? null
  }

  /**
   * Get task result
   */
  getResult(taskId: string): any | null {
    const task = this.get(taskId)
    return task?.result ?? null
  }

  /**
   * Get task error
   */
  getError(taskId: string): string | null {
    const task = this.get(taskId)
    return task?.error ?? null
  }

  /**
   * Is task completed
   */
  isCompleted(taskId: string): boolean {
    const task = this.get(taskId)
    return task?.status === 'completed'
  }

  /**
   * Is task running
   */
  isRunning(taskId: string): boolean {
    const task = this.get(taskId)
    return task?.status === 'running'
  }

  /**
   * Is task failed
   */
  isFailed(taskId: string): boolean {
    const task = this.get(taskId)
    return task?.status === 'failed'
  }

  /**
   * Get duration
   */
  getDuration(taskId: string): number | null {
    const task = this.get(taskId)
    if (!task || !task.startedAt) return null

    const endTime = task.completedAt ?? Date.now()

    return endTime - task.startedAt
  }

  /**
   * Wait for completion
   */
  async waitForCompletion(taskId: string, timeoutMs?: number): Task | null {
    const timeout = timeoutMs ?? 60000
    const startTime = Date.now()

    while (Date.now() - startTime < timeout) {
      const task = this.get(taskId)

      if (!task) return null

      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        return task
      }

      await this.delay(100)
    }

    return null
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Global singleton
export const taskGetTool = new TaskGetTool()

// Import Task type
import { Task, taskCreateTool } from './task-create-tool'

export default taskGetTool