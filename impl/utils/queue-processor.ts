// @ts-nocheck

/**
 * Queue Processor Pattern - 队列处理器
 * 
 * Source: Claude Code utils/queueProcessor.ts
 * Pattern: enqueue + processQueue + backpressure + priority + drain
 */

interface QueueItem<T> {
  id: string
  data: T
  priority: number
  enqueuedAt: number
  attempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error?: Error
}

interface QueueConfig {
  maxConcurrent: number
  maxQueueSize: number
  retryLimit: number
  retryDelayMs: number
}

class QueueProcessor<T> {
  private queue: QueueItem<T>[] = []
  private processing = new Map<string, QueueItem<T>>()
  private completed: QueueItem<T>[] = []
  private failed: QueueItem<T>[] = []
  private itemCounter = 0
  private isProcessing = false

  private config: QueueConfig = {
    maxConcurrent: 5,
    maxQueueSize: 100,
    retryLimit: 3,
    retryDelayMs: 1000
  }

  private processor: (data: T) => Promise<void> = async () => {}

  /**
   * Set processor function
   */
  setProcessor(fn: (data: T) => Promise<void>): void {
    this.processor = fn
  }

  /**
   * Enqueue item
   */
  enqueue(data: T, priority = 0): string {
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Queue full')
    }

    const id = `item-${++this.itemCounter}`

    const item: QueueItem<T> = {
      id,
      data,
      priority,
      enqueuedAt: Date.now(),
      attempts: 0,
      status: 'pending'
    }

    this.queue.push(item)
    this.sortQueue()

    // Start processing if not already
    if (!this.isProcessing) {
      this.startProcessing()
    }

    return id
  }

  /**
   * Sort queue by priority (higher first)
   */
  private sortQueue(): void {
    this.queue.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Start processing queue
   */
  private async startProcessing(): void {
    this.isProcessing = true

    while (this.queue.length > 0 || this.processing.size > 0) {
      // Fill up to maxConcurrent
      while (this.processing.size < this.config.maxConcurrent && this.queue.length > 0) {
        const item = this.queue.shift()
        if (item) {
          this.processItem(item)
        }
      }

      // Wait for any processing to complete
      await this.sleep(100)
    }

    this.isProcessing = false
  }

  /**
   * Process single item
   */
  private async processItem(item: QueueItem<T>): void {
    item.status = 'processing'
    item.attempts++
    this.processing.set(item.id, item)

    try {
      await this.processor(item.data)
      item.status = 'completed'
      this.completed.push(item)
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      item.error = error

      if (item.attempts < this.config.retryLimit) {
        // Retry
        item.status = 'pending'
        await this.sleep(this.config.retryDelayMs * item.attempts)
        this.queue.push(item)
        this.sortQueue()
      } else {
        // Failed
        item.status = 'failed'
        this.failed.push(item)
      }
    }

    this.processing.delete(item.id)
  }

  /**
   * Get queue stats
   */
  getStats(): {
    queued: number
    processing: number
    completed: number
    failed: number
    totalProcessed: number
  } {
    return {
      queued: this.queue.length,
      processing: this.processing.size,
      completed: this.completed.length,
      failed: this.failed.length,
      totalProcessed: this.completed.length + this.failed.length
    }
  }

  /**
   * Get item by ID
   */
  getItem(id: string): QueueItem<T> | undefined {
    return this.queue.find(i => i.id === id) ?? this.processing.get(id) ?? 
           this.completed.find(i => i.id === id) ?? this.failed.find(i => i.id === id)
  }

  /**
   * Drain queue (wait for all to complete)
   */
  async drain(): Promise<void> {
    while (this.queue.length > 0 || this.processing.size > 0) {
      await this.sleep(100)
    }
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = []
    this.processing.clear()
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Set config
   */
  setConfig(config: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.queue = []
    this.processing.clear()
    this.completed = []
    this.failed = []
    this.itemCounter = 0
    this.isProcessing = false
  }
}

// Export factory
export function createQueueProcessor<T>(config?: Partial<QueueConfig>): QueueProcessor<T> {
  const queue = new QueueProcessor<T>()
  if (config) queue.setConfig(config)
  return queue
}

export default QueueProcessor