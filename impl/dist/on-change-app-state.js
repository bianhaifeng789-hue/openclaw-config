// @ts-nocheck
class OnChangeAppState {
    previousState = {};
    changeHistory = [];
    listeners = new Map();
    /**
     * Register listener
     */
    on(key, listener) {
        const listeners = this.listeners.get(key) ?? new Set();
        listeners.add(listener);
        this.listeners.set(key, listeners);
        return () => {
            listeners.delete(listener);
        };
    }
    /**
     * Detect changes
     */
    detectChanges(newState) {
        const changes = [];
        for (const [key, newValue] of Object.entries(newState)) {
            const oldValue = this.previousState[key];
            if (oldValue !== newValue) {
                const record = {
                    key,
                    oldValue,
                    newValue,
                    timestamp: Date.now()
                };
                changes.push(record);
                this.changeHistory.push(record);
                // Notify listeners
                const listeners = this.listeners.get(key);
                if (listeners) {
                    for (const listener of listeners) {
                        listener(oldValue, newValue);
                    }
                }
            }
        }
        this.previousState = { ...newState };
        return changes;
    }
    /**
     * Get change history
     */
    getHistory() {
        return [...this.changeHistory];
    }
    /**
     * Get history by key
     */
    getHistoryByKey(key) {
        return this.changeHistory.filter(c => c.key === key);
    }
    /**
     * Get last change
     */
    getLastChange(key) {
        if (key) {
            const filtered = this.changeHistory.filter(c => c.key === key);
            return filtered.length > 0 ? filtered[filtered.length - 1] : null;
        }
        return this.changeHistory.length > 0 ? this.changeHistory[this.changeHistory.length - 1] : null;
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.changeHistory = [];
    }
    /**
     * Get previous state
     */
    getPreviousState() {
        return { ...this.previousState };
    }
    /**
     * Remove all listeners for key
     */
    removeAllListeners(key) {
        return this.listeners.delete(key);
    }
    /**
     * Get stats
     */
    getStats() {
        const keysWithListeners = this.listeners.size;
        const totalListeners = Array.from(this.listeners.values())
            .reduce((sum, set) => sum + set.size, 0);
        return {
            historyCount: this.changeHistory.length,
            listenersCount: totalListeners,
            keysWithListeners
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.previousState = {};
        this.changeHistory = [];
        this.listeners.clear();
    }
}
// Global singleton
export const onChangeAppState = new OnChangeAppState();
export default onChangeAppState;
//# sourceMappingURL=on-change-app-state.js.map