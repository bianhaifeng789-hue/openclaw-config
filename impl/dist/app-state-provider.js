// @ts-nocheck
class AppStateProvider {
    state;
    listeners = new Set();
    middleware = [];
    persistKey = null;
    constructor(config) {
        this.state = {
            sessionId: null,
            modelId: null,
            projectPath: null,
            status: 'idle',
            messages: [],
            tools: [],
            config: config?.initialState?.config ?? {}
        };
        this.middleware = config?.middleware ?? [];
        this.persistKey = config?.persistKey ?? null;
    }
    /**
     * Get state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Dispatch action
     */
    dispatch(action, payload) {
        let newState = { ...this.state, ...payload };
        // Apply middleware
        for (const mw of this.middleware) {
            newState = mw(newState, action);
        }
        this.state = newState;
        // Persist if configured
        if (this.persistKey) {
            this.persist();
        }
        // Notify listeners
        for (const listener of this.listeners) {
            listener(this.state);
        }
        return this.state;
    }
    /**
     * Subscribe
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Persist state
     */
    persist() {
        if (!this.persistKey)
            return;
        // Would write to storage
        // For demo, just track
        console.log(`[AppStateProvider] Persisting to ${this.persistKey}`);
    }
    /**
     * Restore state
     */
    restore() {
        if (!this.persistKey)
            return false;
        // Would read from storage
        // For demo, return false
        return false;
    }
    /**
     * Add middleware
     */
    addMiddleware(mw) {
        this.middleware.push(mw);
    }
    /**
     * Remove middleware
     */
    removeMiddleware(mw) {
        const index = this.middleware.indexOf(mw);
        if (index === -1)
            return false;
        this.middleware.splice(index, 1);
        return true;
    }
    /**
     * Reset
     */
    reset() {
        this.state = {
            sessionId: null,
            modelId: null,
            projectPath: null,
            status: 'idle',
            messages: [],
            tools: [],
            config: {}
        };
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            listenersCount: this.listeners.size,
            middlewareCount: this.middleware.length,
            stateSize: JSON.stringify(this.state).length
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.reset();
        this.listeners.clear();
        this.middleware = [];
        this.persistKey = null;
    }
}
// Global instance
export const appStateProvider = new AppStateProvider();
export default appStateProvider;
//# sourceMappingURL=app-state-provider.js.map