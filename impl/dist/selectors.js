// @ts-nocheck
class Selectors {
    cache = new Map();
    /**
     * Create memoized selector
     */
    create(key, selector, deps) {
        return (state) => {
            const depValues = deps ? deps(state) : [];
            const cached = this.cache.get(key);
            if (cached && this.depsEqual(cached.deps, depValues)) {
                return cached.value;
            }
            const value = selector(state);
            this.cache.set(key, { value, deps: depValues });
            return value;
        };
    }
    /**
     * Compare deps
     */
    depsEqual(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
    /**
     * Select session ID
     */
    selectSessionId(state) {
        return state.sessionId;
    }
    /**
     * Select model ID
     */
    selectModelId(state) {
        return state.modelId;
    }
    /**
     * Select project path
     */
    selectProjectPath(state) {
        return state.projectPath;
    }
    /**
     * Select status
     */
    selectStatus(state) {
        return state.status;
    }
    /**
     * Select messages
     */
    selectMessages(state) {
        return state.messages;
    }
    /**
     * Select message count
     */
    selectMessageCount(state) {
        return state.messages.length;
    }
    /**
     * Select last message
     */
    selectLastMessage(state) {
        return state.messages.length > 0 ? state.messages[state.messages.length - 1] : null;
    }
    /**
     * Select user messages
     */
    selectUserMessages(state) {
        return state.messages.filter(m => m.role === 'user');
    }
    /**
     * Select assistant messages
     */
    selectAssistantMessages(state) {
        return state.messages.filter(m => m.role === 'assistant');
    }
    /**
     * Select tools
     */
    selectTools(state) {
        return state.tools;
    }
    /**
     * Select active tools
     */
    selectActiveTools(state) {
        return state.tools.filter(t => t.status === 'active');
    }
    /**
     * Select config
     */
    selectConfig(state) {
        return state.config;
    }
    /**
     * Select config value
     */
    selectConfigValue(state, key) {
        return state.config[key];
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            cachedCount: this.cache.size,
            cacheKeys: Array.from(this.cache.keys())
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearCache();
    }
}
// Global singleton
export const selectors = new Selectors();
export default selectors;
//# sourceMappingURL=selectors.js.map