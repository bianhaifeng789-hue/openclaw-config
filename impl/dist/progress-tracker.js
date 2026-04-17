// @ts-nocheck
class ProgressTracker {
    trackers = new Map();
    trackerCounter = 0;
    listeners = new Set();
    /**
     * Create tracker
     */
    create(total, message) {
        const id = `progress-${++this.trackerCounter}-${Date.now()}`;
        const state = {
            id,
            progress: 0,
            total,
            message: message ?? 'Processing',
            startedAt: Date.now(),
            updatedAt: Date.now(),
            completed: false
        };
        this.trackers.set(id, state);
        this.notifyListeners(state);
        return state;
    }
    /**
     * Update progress
     */
    update(id, progress, message) {
        const state = this.trackers.get(id);
        if (!state || state.completed)
            return false;
        state.progress = Math.min(state.total, Math.max(0, progress));
        state.message = message ?? state.message;
        state.updatedAt = Date.now();
        this.notifyListeners(state);
        return true;
    }
    /**
     * Increment progress
     */
    increment(id, amount) {
        const state = this.trackers.get(id);
        if (!state || state.completed)
            return false;
        state.progress = Math.min(state.total, state.progress + (amount ?? 1));
        state.updatedAt = Date.now();
        this.notifyListeners(state);
        return true;
    }
    /**
     * Complete tracker
     */
    complete(id) {
        const state = this.trackers.get(id);
        if (!state)
            return false;
        state.progress = state.total;
        state.completed = true;
        state.updatedAt = Date.now();
        state.message = 'Completed';
        this.notifyListeners(state);
        return true;
    }
    /**
     * Get tracker
     */
    getTracker(id) {
        return this.trackers.get(id);
    }
    /**
     * Get percentage
     */
    getPercentage(id) {
        const state = this.trackers.get(id);
        if (!state)
            return 0;
        return (state.progress / state.total) * 100;
    }
    /**
     * Get active trackers
     */
    getActive() {
        return Array.from(this.trackers.values())
            .filter(s => !s.completed);
    }
    /**
     * Subscribe
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Notify listeners
     */
    notifyListeners(state) {
        for (const listener of this.listeners) {
            listener(state);
        }
    }
    /**
     * Get stats
     */
    getStats() {
        const trackers = Array.from(this.trackers.values());
        const active = trackers.filter(t => !t.completed);
        const avgProgress = trackers.length > 0
            ? trackers.reduce((sum, t) => sum + t.progress, 0) / trackers.length
            : 0;
        return {
            trackersCount: trackers.length,
            activeCount: active.length,
            completedCount: trackers.filter(t => t.completed).length,
            averageProgress: avgProgress
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.trackers.clear();
        this.listeners.clear();
        this.trackerCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const progressTracker = new ProgressTracker();
export default progressTracker;
//# sourceMappingURL=progress-tracker.js.map