// @ts-nocheck
class TeammateModel {
    configs = new Map();
    assignments = new Map();
    /**
     * Register model config
     */
    register(id, modelId, provider, capabilities, maxTokens) {
        const config = {
            id,
            modelId,
            provider,
            capabilities,
            maxTokens: maxTokens ?? 4096,
            temperature: 0.7
        };
        this.configs.set(id, config);
        return config;
    }
    /**
     * Assign model to session
     */
    assign(sessionId, configId) {
        const config = this.configs.get(configId);
        if (!config)
            throw new Error('Config not found');
        const assignment = {
            sessionId,
            config,
            assignedAt: Date.now(),
            lastUsed: Date.now()
        };
        this.assignments.set(sessionId, assignment);
        return assignment;
    }
    /**
     * Get assignment
     */
    getAssignment(sessionId) {
        return this.assignments.get(sessionId);
    }
    /**
     * Get config
     */
    getConfig(id) {
        return this.configs.get(id);
    }
    /**
     * Update last used
     */
    updateLastUsed(sessionId) {
        const assignment = this.assignments.get(sessionId);
        if (!assignment)
            return false;
        assignment.lastUsed = Date.now();
        return true;
    }
    /**
     * Set temperature
     */
    setTemperature(configId, temperature) {
        const config = this.configs.get(configId);
        if (!config)
            return false;
        config.temperature = temperature;
        return true;
    }
    /**
     * Get by provider
     */
    getByProvider(provider) {
        return Array.from(this.configs.values())
            .filter(c => c.provider === provider);
    }
    /**
     * Get by capability
     */
    getByCapability(capability) {
        return Array.from(this.configs.values())
            .filter(c => c.capabilities.includes(capability));
    }
    /**
     * Find best model
     */
    findBest(capabilities) {
        const configs = Array.from(this.configs.values());
        // Score by capability match
        const scored = configs.map(c => ({
            config: c,
            score: capabilities.filter(cap => c.capabilities.includes(cap)).length
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.config ?? null;
    }
    /**
     * Unassign
     */
    unassign(sessionId) {
        return this.assignments.delete(sessionId);
    }
    /**
     * Get stats
     */
    getStats() {
        const configs = Array.from(this.configs.values());
        const assignments = Array.from(this.assignments.values());
        const byProvider = {};
        for (const c of configs) {
            byProvider[c.provider] = (byProvider[c.provider] ?? 0) + 1;
        }
        const activeThreshold = Date.now() - 60000;
        const active = assignments.filter(a => a.lastUsed > activeThreshold).length;
        return {
            configsCount: configs.length,
            assignmentsCount: assignments.length,
            byProvider,
            activeAssignments: active
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.configs.clear();
        this.assignments.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const teammateModel = new TeammateModel();
export default teammateModel;
//# sourceMappingURL=teammate-model.js.map