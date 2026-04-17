// @ts-nocheck

/**
 * Change Detector Deletion Grace Pattern - 变更检测删除宽限期
 * 
 * Source: Claude Code utils/settings/changeDetector.ts
 * Pattern: deletionGracePeriodMs + detectDeletion + false deletion + restore + 5-minute grace
 */

interface ChangeEntry {
  key: string
  oldValue: any
  newValue: any
  changeType: 'added' | 'modified' | 'deleted'
  timestamp: number
  graceExpires?: number // For deletions
}

class ChangeDetectorDeletionGrace {
  private changes = new Map<string, ChangeEntry>()
  private deletionGrace = new Map<string, ChangeEntry>() // Pending deletions

  private config = {
    deletionGracePeriodMs: 5 * 60 * 1000, // 5 minutes
    maxChanges: 1000
  }

  /**
   * Detect change between old and new values
   */
  detectChange(key: string, oldValue: any, newValue: any): ChangeEntry | null {
    // No change
    if (oldValue === newValue) return null

    let changeType: 'added' | 'modified' | 'deleted'

    if (oldValue === undefined || oldValue === null) {
      changeType = 'added'
    } else if (newValue === undefined || newValue === null) {
      changeType = 'deleted'
    } else {
      changeType = 'modified'
    }

    const entry: ChangeEntry = {
      key,
      oldValue,
      newValue,
      changeType,
      timestamp: Date.now()
    }

    // Handle deletion with grace period
    if (changeType === 'deleted') {
      entry.graceExpires = Date.now() + this.config.deletionGracePeriodMs
      this.deletionGrace.set(key, entry)
      return entry
    }

    // Cancel pending deletion if key re-added
    if (this.deletionGrace.has(key)) {
      this.deletionGrace.delete(key)
    }

    // Store change
    this.ensureCapacity()
    this.changes.set(key, entry)

    return entry
  }

  /**
   * Check if deletion is in grace period
   */
  isInDeletionGrace(key: string): boolean {
    const entry = this.deletionGrace.get(key)
    if (!entry) return false

    return Date.now() < (entry.graceExpires ?? 0)
  }

  /**
   * Commit deletion (after grace period)
   */
  commitDeletions(): string[] {
    const committed: string[] = []
    const now = Date.now()

    for (const [key, entry] of this.deletionGrace) {
      if (now >= (entry.graceExpires ?? 0)) {
        this.deletionGrace.delete(key)
        this.changes.set(key, entry)
        committed.push(key)
      }
    }

    return committed
  }

  /**
   * Restore deletion (cancel during grace period)
   */
  restoreDeletion(key: string): boolean {
    const entry = this.deletionGrace.get(key)
    if (!entry) return false

    // Cancel deletion
    this.deletionGrace.delete(key)

    // Would restore actual value
    console.log(`[ChangeDetector] Restored deleted key: ${key}`)

    return true
  }

  /**
   * Get pending deletions
   */
  getPendingDeletions(): ChangeEntry[] {
    return Array.from(this.deletionGrace.values())
  }

  /**
   * Get all changes
   */
  getAllChanges(): ChangeEntry[] {
    return Array.from(this.changes.values())
  }

  /**
   * Get change for key
   */
  getChange(key: string): ChangeEntry | undefined {
    return this.changes.get(key) ?? this.deletionGrace.get(key)
  }

  /**
   * Clear changes
   */
  clearChanges(): void {
    this.changes.clear()
    this.deletionGrace.clear()
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(): void {
    if (this.changes.size >= this.config.maxChanges) {
      // Evict oldest
      let oldestKey: string | null = null
      let oldestTime = Infinity

      for (const [key, entry] of this.changes) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp
          oldestKey = key
        }
      }

      if (oldestKey) {
        this.changes.delete(oldestKey)
      }
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    changeCount: number
    pendingDeletionCount: number
    gracePeriodMs: number
  } {
    return {
      changeCount: this.changes.size,
      pendingDeletionCount: this.deletionGrace.size,
      gracePeriodMs: this.config.deletionGracePeriodMs
    }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.changes.clear()
    this.deletionGrace.clear()
  }
}

// Global singleton
export const changeDetectorGrace = new ChangeDetectorDeletionGrace()

export default changeDetectorGrace