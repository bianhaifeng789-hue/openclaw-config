// @ts-nocheck

/**
 * Stream Utils Pattern - 流工具
 * 
 * Source: Claude Code utils/stream.ts + utils/streamUtils.ts
 * Pattern: chunkAsyncIterator + bufferStream + error recovery + backpressure
 */

interface StreamConfig {
  chunkSize: number
  maxBuffer: number
  timeoutMs: number
}

class StreamUtils {
  private config: StreamConfig = {
    chunkSize: 1024,
    maxBuffer: 1024 * 1024, // 1MB
    timeoutMs: 30000 // 30 seconds
  }

  /**
   * Chunk async iterator into fixed-size chunks
   */
  async *chunkIterator<T>(iter: AsyncIterable<T>, chunkSize: number): AsyncGenerator<T[]> {
    let chunk: T[] = []

    for await (const item of iter) {
      chunk.push(item)
      if (chunk.length >= chunkSize) {
        yield chunk
        chunk = []
      }
    }

    if (chunk.length > 0) {
      yield chunk
    }
  }

  /**
   * Buffer stream with backpressure
   */
  async bufferStream<T>(iter: AsyncIterable<T>, maxBuffer: number): Promise<T[]> {
    const buffer: T[] = []

    for await (const item of iter) {
      if (buffer.length >= maxBuffer) {
        // Backpressure: wait for consumer
        await this.wait(1)
      }
      buffer.push(item)
    }

    return buffer
  }

  /**
   * Error recovery stream
   */
  async *errorRecoveryStream<T>(
    iter: AsyncIterable<T>,
    onError: (error: Error) => T | null,
    maxRetries: number = 3
  ): AsyncGenerator<T> {
    let retries = 0

    try {
      for await (const item of iter) {
        retries = 0 // Reset on success
        yield item
      }
    } catch (e) {
      retries++
      if (retries < maxRetries) {
        const recoveryItem = onError(e instanceof Error ? e : new Error(String(e)))
        if (recoveryItem !== null) {
          yield recoveryItem
        }
        // Continue iteration
      } else {
        throw e
      }
    }
  }

  /**
   * Timeout stream
   */
  async *timeoutStream<T>(iter: AsyncIterable<T>, timeoutMs: number): AsyncGenerator<T> {
    const timeoutPromise = (ms: number) => new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Stream timeout')), ms)
    )

    for await (const item of iter) {
      try {
        await Promise.race([
          Promise.resolve(item),
          timeoutPromise(timeoutMs)
        ])
        yield item
      } catch (e) {
        if (e instanceof Error && e.message === 'Stream timeout') {
          throw e
        }
        throw e
      }
    }
  }

  /**
   * Merge multiple streams
   */
  async *mergeStreams<T>(streams: AsyncIterable<T>[]): AsyncGenerator<T> {
    const iterators = streams.map(s => s[Symbol.asyncIterator]())
    const pending = new Set(iterators)

    while (pending.size > 0) {
      for (const iter of pending) {
        try {
          const result = await iter.next()
          if (result.done) {
            pending.delete(iter)
          } else {
            yield result.value
          }
        } catch (e) {
          pending.delete(iter)
          console.warn('[StreamUtils] Iterator error:', e)
        }
      }
    }
  }

  /**
   * Collect stream to array
   */
  async collectStream<T>(iter: AsyncIterable<T>): Promise<T[]> {
    const result: T[] = []
    for await (const item of iter) {
      result.push(item)
    }
    return result
  }

  /**
   * Map stream
   */
  async *mapStream<T, U>(iter: AsyncIterable<T>, fn: (item: T) => U | Promise<U>): AsyncGenerator<U> {
    for await (const item of iter) {
      yield await fn(item)
    }
  }

  /**
   * Filter stream
   */
  async *filterStream<T>(iter: AsyncIterable<T>, fn: (item: T) => boolean | Promise<boolean>): AsyncGenerator<T> {
    for await (const item of iter) {
      if (await fn(item)) {
        yield item
      }
    }
  }

  /**
   * Take first N items
   */
  async *takeStream<T>(iter: AsyncIterable<T>, count: number): AsyncGenerator<T> {
    let taken = 0
    for await (const item of iter) {
      if (taken >= count) break
      yield item
      taken++
    }
  }

  /**
   * Wait helper
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Set config
   */
  setConfig(config: Partial<StreamConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get config
   */
  getConfig(): StreamConfig {
    return { ...this.config }
  }
}

// Global singleton
export const streamUtils = new StreamUtils()

export default streamUtils