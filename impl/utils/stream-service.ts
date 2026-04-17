// @ts-nocheck

/**
 * Stream Pattern - 流
 * 
 * Source: Claude Code utils/stream.ts + utils/streamUtils.ts
 * Pattern: stream + streaming + data flow + continuous data
 */

interface StreamChunk {
  id: string
  data: string
  index: number
  timestamp: number
}

class StreamService {
  private chunks: StreamChunk[] = []
  private chunkCounter = 0
  private listeners = new Set<(chunk: StreamChunk) => void>()

  /**
   * Write chunk
   */
  write(data: string): StreamChunk {
    const chunk: StreamChunk = {
      id: `chunk-${++this.chunkCounter}-${Date.now()}`,
      data,
      index: this.chunks.length,
      timestamp: Date.now()
    }

    this.chunks.push(chunk)
    this.notifyListeners(chunk)

    return chunk
  }

  /**
   * Read chunks
   */
  read(start?: number, end?: number): StreamChunk[] {
    if (start === undefined && end === undefined) {
      return [...this.chunks]
    }

    return this.chunks.slice(start ?? 0, end)
  }

  /**
   * Read all as string
   */
  readAll(): string {
    return this.chunks.map(c => c.data).join('')
  }

  /**
   * Subscribe
   */
  subscribe(listener: (chunk: StreamChunk) => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners
   */
  private notifyListeners(chunk: StreamChunk): void {
    for (const listener of this.listeners) {
      listener(chunk)
    }
  }

  /**
   * Get chunk count
   */
  getChunkCount(): number {
    return this.chunks.length
  }

  /**
   * Get total size
   */
  getTotalSize(): number {
    return this.chunks.reduce((sum, c) => sum + c.data.length, 0)
  }

  /**
   * Get stats
   */
  getStats(): {
    chunksCount: number
    totalSize: number
    averageChunkSize: number
    listenersCount: number
  } {
    const avgChunkSize = this.chunks.length > 0
      ? this.chunks.reduce((sum, c) => sum + c.data.length, 0) / this.chunks.length
      : 0

    return {
      chunksCount: this.chunks.length,
      totalSize: this.getTotalSize(),
      averageChunkSize: avgChunkSize,
      listenersCount: this.listeners.size
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.chunks = []
    this.chunkCounter = 0
    this.listeners.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const streamService = new StreamService()

export default streamService