// @ts-nocheck

/**
 * Queue Pattern - 队列
 * 
 * Source: Claude Code utils/queueProcessor.ts
 * Pattern: queue + queue processing + task queue + FIFO
 */

interface QueueItem<T> {
  id: string
  data: T
  priority: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  addedAt: number
  processedAt?: number
}

class QueueService<T = any> {
  private queue: QueueItem<T>[] = []
  private processing: QueueItem<T>[] = []
  private completed: QueueItem<T>[] = []
  private failed: QueueItem<T>[] = []
  private itemCounter = 0
  private maxConcurrent = 1

  /**
   * Add item
   */
  add(data: T, priority?: number): QueueItem<T> {
    const item: QueueItem<T> = {
      id: `queue-${++this.itemCounter}-${Date.now()}`,
      data,
      priority: priority ?? 0,
      status: 'pending',
      addedAt: Date.now()
    }

    this.queue.push(item)
    this.sortQueue()

    return item
  }

  /**
   * Sort queue by priority
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Process next
   */
  processNext(): QueueItem<T> | undefined {
    if (this.processing.length >= this.maxConcurrent) return undefined

    const item = this.queue.shift()

    if (!item) return undefined

    item.status = 'processing'
    this.processing.push(item)

    return item
  }

  /**
   * Complete item
   */
  complete(id: string): boolean {
    const item = this.processing.find(i => i.id === id)

    if (!item) return false

    item.status = 'completed'
    item.processedAt = Date.now()

    this.processing = this.processing.filter(i => i.id !== id)
    this.completed.push(item)

    return true
  }

  /**
   * Fail item
   */
  fail(id: string): boolean {
    const item = this.processing.find(i => i.id === id)

    if (!item) return false

    item.status = 'failed'
    item.processedAt = Date.now()

    this.processing = this.processing.filter(i => i.id !== id)
    this.failed.push(item)

    return true
  }

  /**
   * Get pending
   */
  getPending(): QueueItem<T>[] {
    return [...this.queue]
  }

  /**
   * Get processing
   */
  getProcessing(): QueueItem<T>[] {
    return [...this.processing]
  }

  /**
   * Get completed
   */
  getCompleted(): QueueItem<T>[] {
    return [...this.completed]
  }

  /**
   * Get failed
   */
  getFailed(): QueueItem<T>[] {
    return [...this.failed]
  }

  /**
   * Set max concurrent
   */
  setMaxConcurrent(max: number): void {
    this.maxConcurrent = max
  }

  /**
   * Get stats
   */
  getStats(): {
    queueSize: number
    processingSize: number
    completedSize: number
    failedSize: number
    maxConcurrent: number
  } {
    return {
      queueSize: this.queue.length,
      processingSize: this.processing.length,
      completedSize: this.completed.length,
      failedSize: this.failed.length,
      maxConcurrent: this.maxConcurrent
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.queue = []
    this.processing = []
    this.completed = []
    this.failed = []
    this.itemCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.maxConcurrent = 1
  }
}

// Global singleton
export const queueService = new QueueService()

export default queueService