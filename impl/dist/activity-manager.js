// @ts-nocheck
class ActivityManager {
    activities = new Map();
    currentActivity = null;
    lastActivityTime = Date.now();
    idleThresholdMs = 30000; // 30 seconds
    activityCounter = 0;
    /**
     * Start activity
     */
    start(type, description, metadata) {
        // End current activity if exists
        if (this.currentActivity) {
            this.end(this.currentActivity);
        }
        const id = `activity-${++this.activityCounter}-${Date.now()}`;
        const activity = {
            id,
            type,
            description,
            startedAt: Date.now(),
            endedAt: null,
            metadata: metadata ?? {}
        };
        this.activities.set(id, activity);
        this.currentActivity = id;
        this.lastActivityTime = Date.now();
        return activity;
    }
    /**
     * End activity
     */
    end(id) {
        const activity = this.activities.get(id);
        if (!activity)
            return false;
        activity.endedAt = Date.now();
        if (this.currentActivity === id) {
            this.currentActivity = null;
        }
        return true;
    }
    /**
     * Get activity
     */
    get(id) {
        return this.activities.get(id);
    }
    /**
     * Get current activity
     */
    getCurrent() {
        if (!this.currentActivity)
            return null;
        return this.activities.get(this.currentActivity) ?? null;
    }
    /**
     * Record heartbeat
     */
    heartbeat() {
        this.lastActivityTime = Date.now();
    }
    /**
     * Check idle
     */
    isIdle() {
        return Date.now() - this.lastActivityTime > this.idleThresholdMs;
    }
    /**
     * Get idle duration
     */
    getIdleDuration() {
        return Math.max(0, Date.now() - this.lastActivityTime);
    }
    /**
     * Set idle threshold
     */
    setIdleThreshold(ms) {
        this.idleThresholdMs = ms;
    }
    /**
     * Get activities by type
     */
    getByType(type) {
        return Array.from(this.activities.values())
            .filter(a => a.type === type);
    }
    /**
     * Get activities in range
     */
    getInRange(start, end) {
        return Array.from(this.activities.values())
            .filter(a => a.startedAt >= start && a.startedAt <= end);
    }
    /**
     * Get recent activities
     */
    getRecent(count = 10) {
        return Array.from(this.activities.values())
            .sort((a, b) => b.startedAt - a.startedAt)
            .slice(0, count);
    }
    /**
     * Get stats
     */
    getStats() {
        const activities = Array.from(this.activities.values());
        return {
            activitiesCount: activities.length,
            activeCount: activities.filter(a => a.endedAt === null).length,
            completedCount: activities.filter(a => a.endedAt !== null).length,
            isIdle: this.isIdle(),
            idleDurationMs: this.getIdleDuration()
        };
    }
    /**
     * Clear old activities
     */
    clearOld(thresholdMs = 3600000) {
        const threshold = Date.now() - thresholdMs;
        let cleared = 0;
        for (const [id, activity] of this.activities) {
            if (activity.endedAt !== null && activity.endedAt < threshold) {
                this.activities.delete(id);
                cleared++;
            }
        }
        return cleared;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.activities.clear();
        this.currentActivity = null;
        this.lastActivityTime = Date.now();
        this.idleThresholdMs = 30000;
        this.activityCounter = 0;
    }
}
// Global singleton
export const activityManager = new ActivityManager();
export default activityManager;
//# sourceMappingURL=activity-manager.js.map