// @ts-nocheck
class ChangeDetectorDeletionGrace {
    changes = new Map();
    deletionGrace = new Map(); // Pending deletions
    config = {
        deletionGracePeriodMs: 5 * 60 * 1000, // 5 minutes
        maxChanges: 1000
    };
    /**
     * Detect change between old and new values
     */
    detectChange(key, oldValue, newValue) {
        // No change
        if (oldValue === newValue)
            return null;
        let changeType;
        if (oldValue === undefined || oldValue === null) {
            changeType = 'added';
        }
        else if (newValue === undefined || newValue === null) {
            changeType = 'deleted';
        }
        else {
            changeType = 'modified';
        }
        const entry = {
            key,
            oldValue,
            newValue,
            changeType,
            timestamp: Date.now()
        };
        // Handle deletion with grace period
        if (changeType === 'deleted') {
            entry.graceExpires = Date.now() + this.config.deletionGracePeriodMs;
            this.deletionGrace.set(key, entry);
            return entry;
        }
        // Cancel pending deletion if key re-added
        if (this.deletionGrace.has(key)) {
            this.deletionGrace.delete(key);
        }
        // Store change
        this.ensureCapacity();
        this.changes.set(key, entry);
        return entry;
    }
    /**
     * Check if deletion is in grace period
     */
    isInDeletionGrace(key) {
        const entry = this.deletionGrace.get(key);
        if (!entry)
            return false;
        return Date.now() < (entry.graceExpires ?? 0);
    }
    /**
     * Commit deletion (after grace period)
     */
    commitDeletions() {
        const committed = [];
        const now = Date.now();
        for (const [key, entry] of this.deletionGrace) {
            if (now >= (entry.graceExpires ?? 0)) {
                this.deletionGrace.delete(key);
                this.changes.set(key, entry);
                committed.push(key);
            }
        }
        return committed;
    }
    /**
     * Restore deletion (cancel during grace period)
     */
    restoreDeletion(key) {
        const entry = this.deletionGrace.get(key);
        if (!entry)
            return false;
        // Cancel deletion
        this.deletionGrace.delete(key);
        // Would restore actual value
        console.log(`[ChangeDetector] Restored deleted key: ${key}`);
        return true;
    }
    /**
     * Get pending deletions
     */
    getPendingDeletions() {
        return Array.from(this.deletionGrace.values());
    }
    /**
     * Get all changes
     */
    getAllChanges() {
        return Array.from(this.changes.values());
    }
    /**
     * Get change for key
     */
    getChange(key) {
        return this.changes.get(key) ?? this.deletionGrace.get(key);
    }
    /**
     * Clear changes
     */
    clearChanges() {
        this.changes.clear();
        this.deletionGrace.clear();
    }
    /**
     * Ensure capacity
     */
    ensureCapacity() {
        if (this.changes.size >= this.config.maxChanges) {
            // Evict oldest
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [key, entry] of this.changes) {
                if (entry.timestamp < oldestTime) {
                    oldestTime = entry.timestamp;
                    oldestKey = key;
                }
            }
            if (oldestKey) {
                this.changes.delete(oldestKey);
            }
        }
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            changeCount: this.changes.size,
            pendingDeletionCount: this.deletionGrace.size,
            gracePeriodMs: this.config.deletionGracePeriodMs
        };
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.changes.clear();
        this.deletionGrace.clear();
    }
}
// Global singleton
export const changeDetectorGrace = new ChangeDetectorDeletionGrace();
export default changeDetectorGrace;
//# sourceMappingURL=change-detector-grace.js.map