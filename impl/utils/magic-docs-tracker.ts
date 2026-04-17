// @ts-nocheck

/**
 * Magic Docs Tracker Pattern - Magic Docs追踪器
 * 
 * Source: Claude Code services/MagicDocs/magicDocs.ts + utils/magicDocsTracker.ts
 * Pattern: magic docs tracking + auto-embedding + doc versioning + change detection
 */

interface MagicDoc {
  id: string
  path: string
  contentHash: string
  lastModified: number
  lastEmbedded: number
  embeddingStatus: 'pending' | 'embedded' | 'failed' | 'stale'
  tokenCount: number
  metadata: Record<string, any>
}

class MagicDocsTracker {
  private docs = new Map<string, MagicDoc>()
  private pendingEmbeddings: string[] = []
  private embeddingIntervalMs = 60 * 1000 // 1 minute
  private staleThresholdMs = 5 * 60 * 1000 // 5 minutes
  private docCounter = 0

  /**
   * Track document
   */
  track(path: string, contentHash: string, tokenCount: number, metadata?: Record<string, any>): MagicDoc {
    const existing = this.docs.get(path)

    if (existing) {
      // Check if content changed
      if (existing.contentHash !== contentHash) {
        existing.contentHash = contentHash
        existing.lastModified = Date.now()
        existing.embeddingStatus = 'stale'
        existing.tokenCount = tokenCount

        this.pendingEmbeddings.push(path)
      }

      return existing
    }

    // Create new doc
    const doc: MagicDoc = {
      id: `doc-${++this.docCounter}-${Math.random().toString(36).slice(2, 8)}`,
      path,
      contentHash,
      lastModified: Date.now(),
      lastEmbedded: 0,
      embeddingStatus: 'pending',
      tokenCount,
      metadata: metadata ?? {}
    }

    this.docs.set(path, doc)
    this.pendingEmbeddings.push(path)

    return doc
  }

  /**
   * Mark as embedded
   */
  markEmbedded(path: string): boolean {
    const doc = this.docs.get(path)
    if (!doc) return false

    doc.lastEmbedded = Date.now()
    doc.embeddingStatus = 'embedded'

    // Remove from pending
    this.pendingEmbeddings = this.pendingEmbeddings.filter(p => p !== path)

    return true
  }

  /**
   * Mark as failed
   */
  markFailed(path: string): boolean {
    const doc = this.docs.get(path)
    if (!doc) return false

    doc.embeddingStatus = 'failed'

    return true
  }

  /**
   * Get pending embeddings
   */
  getPendingEmbeddings(): MagicDoc[] {
    return this.pendingEmbeddings
      .map(path => this.docs.get(path))
      .filter(Boolean) as MagicDoc[]
  }

  /**
   * Get stale docs
   */
  getStaleDocs(): MagicDoc[] {
    const now = Date.now()

    return Array.from(this.docs.values())
      .filter(doc => {
        if (doc.embeddingStatus === 'stale') return true

        if (doc.embeddingStatus === 'embedded') {
          // Check if stale threshold exceeded
          return now - doc.lastEmbedded > this.staleThresholdMs &&
                 now - doc.lastModified > this.staleThresholdMs
        }

        return false
      })
  }

  /**
   * Get doc by path
   */
  get(path: string): MagicDoc | undefined {
    return this.docs.get(path)
  }

  /**
   * Remove doc
   */
  remove(path: string): boolean {
    const doc = this.docs.get(path)
    if (!doc) return false

    this.docs.delete(path)
    this.pendingEmbeddings = this.pendingEmbeddings.filter(p => p !== path)

    return true
  }

  /**
   * Get all docs
   */
  getAll(): MagicDoc[] {
    return Array.from(this.docs.values())
  }

  /**
   * Get stats
   */
  getStats(): {
    totalDocs: number
    pendingCount: number
    embeddedCount: number
    failedCount: number
    staleCount: number
    totalTokens: number
  } {
    const docs = Array.from(this.docs.values())

    return {
      totalDocs: docs.length,
      pendingCount: docs.filter(d => d.embeddingStatus === 'pending').length,
      embeddedCount: docs.filter(d => d.embeddingStatus === 'embedded').length,
      failedCount: docs.filter(d => d.embeddingStatus === 'failed').length,
      staleCount: docs.filter(d => d.embeddingStatus === 'stale').length,
      totalTokens: docs.reduce((sum, d) => sum + d.tokenCount, 0)
    }
  }

  /**
   * Set stale threshold
   */
  setStaleThreshold(ms: number): void {
    this.staleThresholdMs = ms
  }

  /**
   * Set embedding interval
   */
  setEmbeddingInterval(ms: number): void {
    this.embeddingIntervalMs = ms
  }

  /**
   * Clear all docs
   */
  clear(): void {
    this.docs.clear()
    this.pendingEmbeddings = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.docCounter = 0
    this.embeddingIntervalMs = 60 * 1000
    this.staleThresholdMs = 5 * 60 * 1000
  }
}

// Global singleton
export const magicDocsTracker = new MagicDocsTracker()

export default magicDocsTracker