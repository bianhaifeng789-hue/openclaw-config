// @ts-nocheck

/**
 * Lockfile Pattern - 文件锁
 * 
 * Source: Claude Code utils/lockfile.ts
 * Pattern: acquire lock + stale detection + pid file + release + cleanup
 */

interface LockInfo {
  path: string
  pid: number
  acquiredAt: number
  staleTimeoutMs: number
}

class Lockfile {
  private locks = new Map<string, LockInfo>()
  private staleTimeoutMs = 30 * 1000 // 30 seconds

  /**
   * Acquire lock
   */
  async acquire(lockPath: string): Promise<boolean> {
    // Check if already locked
    const existing = this.locks.get(lockPath)
    if (existing) {
      // Check if stale
      if (this.isStale(existing)) {
        await this.release(lockPath)
      } else {
        return false // Lock held by another process
      }
    }

    // Create lock
    const lock: LockInfo = {
      path: lockPath,
      pid: process.pid,
      acquiredAt: Date.now(),
      staleTimeoutMs: this.staleTimeoutMs
    }

    this.locks.set(lockPath, lock)

    return true
  }

  /**
   * Check if lock is stale
   */
  private isStale(lock: LockInfo): boolean {
    const elapsed = Date.now() - lock.acquiredAt
    return elapsed > lock.staleTimeoutMs
  }

  /**
   * Release lock
   */
  async release(lockPath: string): Promise<boolean> {
    const lock = this.locks.get(lockPath)
    if (!lock) return false

    // Verify it's our lock
    if (lock.pid !== process.pid) {
      return false // Can't release another process's lock
    }

    this.locks.delete(lockPath)
    return true
  }

  /**
   * Check if lock is held
   */
  isLocked(lockPath: string): boolean {
    const lock = this.locks.get(lockPath)
    if (!lock) return false

    // Check if stale
    if (this.isStale(lock)) {
      return false
    }

    return true
  }

  /**
   * Get lock info
   */
  getLockInfo(lockPath: string): LockInfo | undefined {
    return this.locks.get(lockPath)
  }

  /**
   * Wait for lock to be available
   */
  async waitForLock(lockPath: string, timeoutMs = 5000): Promise<boolean> {
    const start = Date.now()

    while (Date.now() - start < timeoutMs) {
      if (!this.isLocked(lockPath)) {
        return this.acquire(lockPath)
      }

      await this.sleep(100)
    }

    return false // Timeout
  }

  /**
   * Release all locks held by this process
   */
  releaseAll(): number {
    let released = 0

    for (const [path, lock] of this.locks) {
      if (lock.pid === process.pid) {
        this.locks.delete(path)
        released++
      }
    }

    return released
  }

  /**
   * Force release stale locks
   */
  forceReleaseStale(): number {
    let released = 0

    for (const [path, lock] of this.locks) {
      if (this.isStale(lock)) {
        this.locks.delete(path)
        released++
      }
    }

    return released
  }

  /**
   * Set stale timeout
   */
  setStaleTimeout(ms: number): void {
    this.staleTimeoutMs = ms
  }

  /**
   * Get active locks count
   */
  getActiveCount(): number {
    return this.locks.size
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
    this.locks.clear()
  }
}

// Global singleton
export const lockfile = new Lockfile()

export default lockfile