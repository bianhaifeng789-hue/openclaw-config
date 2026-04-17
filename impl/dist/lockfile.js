// @ts-nocheck
class Lockfile {
    locks = new Map();
    staleTimeoutMs = 30 * 1000; // 30 seconds
    /**
     * Acquire lock
     */
    async acquire(lockPath) {
        // Check if already locked
        const existing = this.locks.get(lockPath);
        if (existing) {
            // Check if stale
            if (this.isStale(existing)) {
                await this.release(lockPath);
            }
            else {
                return false; // Lock held by another process
            }
        }
        // Create lock
        const lock = {
            path: lockPath,
            pid: process.pid,
            acquiredAt: Date.now(),
            staleTimeoutMs: this.staleTimeoutMs
        };
        this.locks.set(lockPath, lock);
        return true;
    }
    /**
     * Check if lock is stale
     */
    isStale(lock) {
        const elapsed = Date.now() - lock.acquiredAt;
        return elapsed > lock.staleTimeoutMs;
    }
    /**
     * Release lock
     */
    async release(lockPath) {
        const lock = this.locks.get(lockPath);
        if (!lock)
            return false;
        // Verify it's our lock
        if (lock.pid !== process.pid) {
            return false; // Can't release another process's lock
        }
        this.locks.delete(lockPath);
        return true;
    }
    /**
     * Check if lock is held
     */
    isLocked(lockPath) {
        const lock = this.locks.get(lockPath);
        if (!lock)
            return false;
        // Check if stale
        if (this.isStale(lock)) {
            return false;
        }
        return true;
    }
    /**
     * Get lock info
     */
    getLockInfo(lockPath) {
        return this.locks.get(lockPath);
    }
    /**
     * Wait for lock to be available
     */
    async waitForLock(lockPath, timeoutMs = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeoutMs) {
            if (!this.isLocked(lockPath)) {
                return this.acquire(lockPath);
            }
            await this.sleep(100);
        }
        return false; // Timeout
    }
    /**
     * Release all locks held by this process
     */
    releaseAll() {
        let released = 0;
        for (const [path, lock] of this.locks) {
            if (lock.pid === process.pid) {
                this.locks.delete(path);
                released++;
            }
        }
        return released;
    }
    /**
     * Force release stale locks
     */
    forceReleaseStale() {
        let released = 0;
        for (const [path, lock] of this.locks) {
            if (this.isStale(lock)) {
                this.locks.delete(path);
                released++;
            }
        }
        return released;
    }
    /**
     * Set stale timeout
     */
    setStaleTimeout(ms) {
        this.staleTimeoutMs = ms;
    }
    /**
     * Get active locks count
     */
    getActiveCount() {
        return this.locks.size;
    }
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.locks.clear();
    }
}
// Global singleton
export const lockfile = new Lockfile();
export default lockfile;
//# sourceMappingURL=lockfile.js.map