// @ts-nocheck

/**
 * Buffer Writer Pattern - 缓冲写入器
 * 
 * Source: Claude Code utils/bufferedWriter.ts
 * Pattern: deferred flush + buffer size threshold + error recovery + write-through
 */

interface WriterConfig {
  bufferSize: number // Max buffer size before flush
  flushIntervalMs: number // Auto-flush interval
  maxRetries: number // Write retry count
  retryDelayMs: number // Retry delay
}

class BufferedWriter {
  private buffer: string[] = []
  private bufferSize = 0
  private lastFlushTime = Date.now()
  private flushIntervalId: ReturnType<typeof setInterval> | null = null

  private config: WriterConfig = {
    bufferSize: 64 * 1024, // 64KB
    flushIntervalMs: 5000, // 5 seconds
    maxRetries: 3,
    retryDelayMs: 100
  }

  private writer: (data: string) => Promise<void> = async () => {
    // Default writer: console
    console.log('[BufferedWriter] Would write:', this.buffer.length, 'chunks')
  }

  /**
   * Set writer function
   */
  setWriter(fn: (data: string) => Promise<void>): void {
    this.writer = fn
  }

  /**
   * Write data to buffer
   */
  async write(data: string): Promise<void> {
    this.buffer.push(data)
    this.bufferSize += data.length

    // Check if buffer threshold exceeded
    if (this.bufferSize >= this.config.bufferSize) {
      await this.flush()
    }
  }

  /**
   * Flush buffer to writer
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const data = this.buffer.join('')
    this.buffer = []
    this.bufferSize = 0
    this.lastFlushTime = Date.now()

    // Write with retry
    await this.writeWithRetry(data)
  }

  /**
   * Write with retry on error
   */
  private async writeWithRetry(data: string): Promise<void> {
    let retries = 0

    while (retries < this.config.maxRetries) {
      try {
        await this.writer(data)
        return
      } catch (e) {
        retries++
        console.warn(`[BufferedWriter] Write failed (attempt ${retries}):`, e)

        if (retries < this.config.maxRetries) {
          await this.sleep(this.config.retryDelayMs * retries) // Exponential backoff
        }
      }
    }

    // Final failure: save to recovery file
    console.error('[BufferedWriter] All retries failed, saving to recovery')
    await this.saveToRecovery(data)
  }

  /**
   * Save to recovery file on failure
   */
  private async saveToRecovery(data: string): Promise<void> {
    // Would save to disk
    // For demo, just log
    console.error('[BufferedWriter] Recovery data length:', data.length)
  }

  /**
   * Start auto-flush interval
   */
  startAutoFlush(): void {
    if (this.flushIntervalId) return

    this.flushIntervalId = setInterval(async () => {
      if (Date.now() - this.lastFlushTime >= this.config.flushIntervalMs) {
        await this.flush()
      }
    }, this.config.flushIntervalMs)

    // Unref to not block exit
    if (typeof this.flushIntervalId.unref === 'function') {
      this.flushIntervalId.unref()
    }
  }

  /**
   * Stop auto-flush
   */
  stopAutoFlush(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId)
      this.flushIntervalId = null
    }
  }

  /**
   * Get buffer stats
   */
  getStats(): {
    bufferLength: number
    bufferSize: number
    lastFlushTime: number
    pendingChunks: number
  } {
    return {
      bufferLength: this.buffer.length,
      bufferSize: this.bufferSize,
      lastFlushTime: this.lastFlushTime,
      pendingChunks: this.buffer.length
    }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<WriterConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.stopAutoFlush()
    this.buffer = []
    this.bufferSize = 0
    this.lastFlushTime = Date.now()
  }
}

// Global singleton
export const bufferedWriter = new BufferedWriter()

export default bufferedWriter