// @ts-nocheck
class SpawnUtils {
    configs = new Map();
    results = new Map();
    activeSpawns = new Map();
    /**
     * Configure spawn
     */
    configure(agentId, config) {
        this.configs.set(agentId, config);
    }
    /**
     * Spawn agent
     */
    spawn(agentId) {
        const config = this.configs.get(agentId);
        const startTime = Date.now();
        // Would spawn actual process
        // For demo, simulate
        const pid = Math.floor(Math.random() * 10000) + 1000;
        const result = {
            agentId,
            pid,
            success: true,
            startTime,
            endTime: null,
            exitCode: null
        };
        this.results.set(agentId, result);
        this.activeSpawns.set(agentId, { pid, startTime });
        return result;
    }
    /**
     * Kill spawn
     */
    kill(agentId) {
        const spawn = this.activeSpawns.get(agentId);
        if (!spawn)
            return false;
        // Would kill actual process
        const result = this.results.get(agentId);
        if (result) {
            result.endTime = Date.now();
            result.exitCode = 0; // Normal termination
        }
        this.activeSpawns.delete(agentId);
        return true;
    }
    /**
     * Check if active
     */
    isActive(agentId) {
        return this.activeSpawns.has(agentId);
    }
    /**
     * Get spawn result
     */
    getResult(agentId) {
        return this.results.get(agentId);
    }
    /**
     * Get config
     */
    getConfig(agentId) {
        return this.configs.get(agentId);
    }
    /**
     * Get active spawns
     */
    getActive() {
        return Array.from(this.activeSpawns.entries())
            .map(([agentId, data]) => ({ agentId, ...data }));
    }
    /**
     * Get stats
     */
    getStats() {
        const results = Array.from(this.results.values());
        const active = this.activeSpawns.size;
        const successCount = results.filter(r => r.success).length;
        const completed = results.filter(r => r.endTime !== null);
        const avgLifetime = completed.length > 0
            ? completed.reduce((sum, r) => sum + (r.endTime - r.startTime), 0) / completed.length
            : 0;
        return {
            totalSpawns: results.length,
            activeSpawns: active,
            successRate: results.length > 0 ? successCount / results.length : 0,
            averageLifetimeMs: avgLifetime
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.configs.clear();
        this.results.clear();
        this.activeSpawns.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const spawnUtils = new SpawnUtils();
export default spawnUtils;
//# sourceMappingURL=spawn-utils.js.map