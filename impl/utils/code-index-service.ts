// @ts-nocheck

/**
 * Code Index Service Pattern - 代码索引服务
 * 
 * Source: Claude Code services/codeIndex/codeIndex.ts + services/codeIndexing.ts
 * Pattern: code index + embedding + search + update + indexing queue
 */

interface CodeIndexEntry {
  id: string
  filePath: string
  language: string
  contentHash: string
  embedding?: number[]
  lastIndexed: number
  tokens: number
}

interface SearchResult {
  filePath: string
  snippet: string
  score: number
  language: string
}

class CodeIndexService {
  private entries = new Map<string, CodeIndexEntry>()
  private pendingQueue: string[] = []
  private indexCounter = 0
  private isIndexing = false

  private config = {
    maxEntries: 10000,
    batchSize: 100,
    embeddingEnabled: true
  }

  /**
   * Add file to indexing queue
   */
  addToQueue(filePath: string): void {
    if (!this.pendingQueue.includes(filePath)) {
      this.pendingQueue.push(filePath)
    }
  }

  /**
   * Process indexing queue
   */
  async processQueue(processFn: (path: string) => Promise<CodeIndexEntry>): Promise<number> {
    if (this.isIndexing) return 0

    this.isIndexing = true
    let processed = 0

    try {
      while (this.pendingQueue.length > 0) {
        const batch = this.pendingQueue.splice(0, this.config.batchSize)

        for (const path of batch) {
          try {
            const entry = await processFn(path)
            this.entries.set(entry.id, entry)
            processed++
          } catch (e) {
            console.warn(`[CodeIndex] Failed to index ${path}:`, e)
          }
        }
      }
    } finally {
      this.isIndexing = false
    }

    return processed
  }

  /**
   * Search indexed code
   */
  search(query: string, options?: { language?: string; maxResults?: number }): SearchResult[] {
    const results: SearchResult[] = []
    const queryLower = query.toLowerCase()
    const maxResults = options?.maxResults ?? 10

    for (const entry of this.entries.values()) {
      if (options?.language && entry.language !== options.language) continue

      // Simple text matching (would use embedding similarity in real implementation)
      const score = this.calculateScore(entry, queryLower)

      if (score > 0) {
        results.push({
          filePath: entry.filePath,
          snippet: '', // Would extract relevant snippet
          score,
          language: entry.language
        })
      }
    }

    results.sort((a, b) => b.score - a.score)

    return results.slice(0, maxResults)
  }

  /**
   * Calculate relevance score
   */
  private calculateScore(entry: CodeIndexEntry, query: string): number {
    // Would use embedding similarity
    // For demo, use simple path matching
    const pathLower = entry.filePath.toLowerCase()

    let score = 0
    if (pathLower.includes(query)) score += 50
    if (pathLower.endsWith(query)) score += 30

    return score
  }

  /**
   * Get entry by ID
   */
  getById(id: string): CodeIndexEntry | undefined {
    return this.entries.get(id)
  }

  /**
   * Get entry by path
   */
  getByPath(filePath: string): CodeIndexEntry | undefined {
    for (const entry of this.entries.values()) {
      if (entry.filePath === filePath) return entry
    }
    return undefined
  }

  /**
   * Remove entry
   */
  remove(id: string): boolean {
    return this.entries.delete(id)
  }

  /**
   * Update entry
   */
  update(id: string, updates: Partial<CodeIndexEntry>): boolean {
    const entry = this.entries.get(id)
    if (!entry) return false

    Object.assign(entry, updates)
    return true
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.pendingQueue.length
  }

  /**
   * Get stats
   */
  getStats(): {
    totalEntries: number
    queuedFiles: number
    isIndexing: boolean
    languageCounts: Record<string, number>
  } {
    const languageCounts: Record<string, number> = {}

    for (const entry of this.entries.values()) {
      languageCounts[entry.language] = (languageCounts[entry.language] ?? 0) + 1
    }

    return {
      totalEntries: this.entries.size,
      queuedFiles: this.pendingQueue.length,
      isIndexing: this.isIndexing,
      languageCounts
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.entries.clear()
    this.pendingQueue = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.indexCounter = 0
    this.isIndexing = false
  }
}

// Global singleton
export const codeIndexService = new CodeIndexService()

export default codeIndexService