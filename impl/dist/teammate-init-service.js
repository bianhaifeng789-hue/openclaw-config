// @ts-nocheck
class TeammateInitService {
    configs = new Map();
    results = new Map();
    hooks = new Map();
    /**
     * Register hook
     */
    registerHook(sessionId, type, handler) {
        const hooks = this.hooks.get(sessionId) ?? [];
        hooks.push({ type, handler });
        this.hooks.set(sessionId, hooks);
    }
    /**
     * Configure init
     */
    configure(sessionId, config) {
        this.configs.set(sessionId, config);
    }
    /**
     * Initialize teammate
     */
    async initialize(sessionId) {
        const config = this.configs.get(sessionId);
        const startTime = Date.now();
        const result = {
            sessionId,
            success: true,
            durationMs: 0,
            hooksExecuted: 0,
            skillsLoaded: config?.skills.length ?? 0,
            errors: []
        };
        // Execute hooks
        const hooks = this.hooks.get(sessionId) ?? [];
        for (const hook of hooks) {
            try {
                await hook.handler();
                result.hooksExecuted++;
            }
            catch (e) {
                result.errors.push(`Hook ${hook.type} failed: ${e}`);
                result.success = false;
            }
        }
        result.durationMs = Date.now() - startTime;
        this.results.set(sessionId, result);
        return result;
    }
    /**
     * Get config
     */
    getConfig(sessionId) {
        return this.configs.get(sessionId);
    }
    /**
     * Get result
     */
    getResult(sessionId) {
        return this.results.get(sessionId);
    }
    /**
     * Get hooks
     */
    getHooks(sessionId) {
        return (this.hooks.get(sessionId) ?? []).map(h => ({ type: h.type }));
    }
    /**
     * Clear hooks
     */
    clearHooks(sessionId) {
        this.hooks.delete(sessionId);
    }
    /**
     * Get stats
     */
    getStats() {
        const results = Array.from(this.results.values());
        const successCount = results.filter(r => r.success).length;
        const avgDuration = results.length > 0
            ? results.reduce((sum, r) => sum + r.durationMs, 0) / results.length
            : 0;
        return {
            configsCount: this.configs.size,
            resultsCount: results.length,
            successRate: results.length > 0 ? successCount / results.length : 0,
            averageDurationMs: avgDuration
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.configs.clear();
        this.results.clear();
        this.hooks.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const teammateInitService = new TeammateInitService();
export default teammateInitService;
//# sourceMappingURL=teammate-init-service.js.map