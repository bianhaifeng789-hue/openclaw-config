// @ts-nocheck

/**
 * Task Output Tool Pattern - 任务输出工具
 * 
 * Source: Claude Code tools/TaskOutputTool/TaskOutputTool.ts
 * Pattern: task output + streaming + result retrieval + output buffer
 */

interface TaskOutput {
  taskId: string
  output: string
  timestamp: number
  stream?: boolean
}

class TaskOutputTool {
  private outputs = new Map<string, TaskOutput[]>()
  private streamListeners = new Map<string, Set<(output: string) => void>>()

  /**
   * Get output
   */
  getOutput(taskId: string): string {
    const outputs = this.outputs.get(taskId) ?? []
    return outputs.map(o => o.output).join('')
  }

  /**
   * Get full output
   */
  getFullOutput(taskId: string): TaskOutput[] {
    return this.outputs.get(taskId) ?? []
  }

  /**
   * Append output
   */
  appendOutput(taskId: string, output: string): void {
    const outputs = this.outputs.get(taskId) ?? []

    const entry: TaskOutput = {
      taskId,
      output,
      timestamp: Date.now()
    }

    outputs.push(entry)
    this.outputs.set(taskId, outputs)

    // Notify stream listeners
    const listeners = this.streamListeners.get(taskId)
    if (listeners) {
      for (const listener of listeners) {
        listener(output)
      }
    }
  }

  /**
   * Clear output
   */
  clearOutput(taskId: string): void {
    this.outputs.delete(taskId)
  }

  /**
   * Stream output
   */
  stream(taskId: string, listener: (output: string) => void): () => void {
    const listeners = this.streamListeners.get(taskId) ?? new Set()
    listeners.add(listener)
    this.streamListeners.set(taskId, listeners)

    return () => {
      listeners.delete(listener)
    }
  }

  /**
   * Stop streaming
   */
  stopStream(taskId: string): boolean {
    return this.streamListeners.delete(taskId)
  }

  /**
   * Get recent output
   */
  getRecentOutput(taskId: string, count: number = 10): string {
    const outputs = this.outputs.get(taskId) ?? []
    const recent = outputs.slice(-count)

    return recent.map(o => o.output).join('')
  }

  /**
   * Get output length
   */
  getOutputLength(taskId: string): number {
    return this.getOutput(taskId).length
  }

  /**
   * Get output entries count
   */
  getEntriesCount(taskId: string): number {
    return (this.outputs.get(taskId) ?? []).length
  }

  /**
   * Search output
   */
  searchOutput(taskId: string, query: string): string[] {
    const output = this.getOutput(taskId)
    const lines = output.split('\n')

    return lines.filter(line => line.toLowerCase().includes(query.toLowerCase()))
  }

  /**
   * Get stats
   */
  getStats(): {
    tasksCount: number
    totalOutputs: number
    totalLength: number
    activeStreams: number
  } {
    const tasks = Array.from(this.outputs.keys())

    return {
      tasksCount: tasks.length,
      totalOutputs: tasks.reduce((sum, id) => sum + (this.outputs.get(id)?.length ?? 0), 0),
      totalLength: tasks.reduce((sum, id) => sum + this.getOutputLength(id), 0),
      activeStreams: this.streamListeners.size
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.outputs.clear()
    this.streamListeners.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const taskOutputTool = new TaskOutputTool()

export default taskOutputTool