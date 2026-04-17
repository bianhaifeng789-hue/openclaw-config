// @ts-nocheck
class CostTracker {
    entries = [];
    sessionCosts = new Map();
    modelCosts = new Map();
    dailyBudget = 100; // USD
    maxEntries = 1000;
    // Model pricing (USD per 1M tokens)
    pricing = new Map([
        ['claude-3-opus', { input: 15, output: 75 }],
        ['claude-3-sonnet', { input: 3, output: 15 }],
        ['claude-3-haiku', { input: 0.25, output: 1.25 }],
        ['gpt-4', { input: 30, output: 60 }],
        ['gpt-4-turbo', { input: 10, output: 30 }],
        ['gpt-3.5-turbo', { input: 0.5, output: 1.5 }]
    ]);
    /**
     * Record cost
     */
    record(sessionId, modelId, inputTokens, outputTokens) {
        const cost = this.calculateCost(modelId, inputTokens, outputTokens);
        const entry = {
            sessionId,
            modelId,
            inputTokens,
            outputTokens,
            costUsd: cost,
            timestamp: Date.now()
        };
        this.entries.push(entry);
        this.ensureCapacity();
        // Update session cost
        const sessionCost = this.sessionCosts.get(sessionId) ?? 0;
        this.sessionCosts.set(sessionId, sessionCost + cost);
        // Update model cost
        const modelCost = this.modelCosts.get(modelId) ?? 0;
        this.modelCosts.set(modelId, modelCost + cost);
        return entry;
    }
    /**
     * Calculate cost
     */
    calculateCost(modelId, inputTokens, outputTokens) {
        const pricing = this.pricing.get(modelId) ?? { input: 1, output: 2 };
        const inputCost = (inputTokens / 1000000) * pricing.input;
        const outputCost = (outputTokens / 1000000) * pricing.output;
        return inputCost + outputCost;
    }
    /**
     * Get session cost
     */
    getSessionCost(sessionId) {
        return this.sessionCosts.get(sessionId) ?? 0;
    }
    /**
     * Get model cost
     */
    getModelCost(modelId) {
        return this.modelCosts.get(modelId) ?? 0;
    }
    /**
     * Get total cost
     */
    getTotalCost() {
        return this.entries.reduce((sum, e) => sum + e.costUsd, 0);
    }
    /**
     * Get summary
     */
    getSummary() {
        const totalCost = this.getTotalCost();
        const totalInputTokens = this.entries.reduce((sum, e) => sum + e.inputTokens, 0);
        const totalOutputTokens = this.entries.reduce((sum, e) => sum + e.outputTokens, 0);
        const sessionCount = new Set(this.entries.map(e => e.sessionId)).size;
        const modelCounts = {};
        for (const [model, cost] of this.modelCosts) {
            modelCounts[model] = cost;
        }
        return {
            totalCost,
            totalInputTokens,
            totalOutputTokens,
            sessionCount,
            modelCounts
        };
    }
    /**
     * Check budget
     */
    isWithinBudget() {
        return this.getTotalCost() <= this.dailyBudget;
    }
    /**
     * Get remaining budget
     */
    getRemainingBudget() {
        return Math.max(0, this.dailyBudget - this.getTotalCost());
    }
    /**
     * Ensure capacity
     */
    ensureCapacity() {
        while (this.entries.length > this.maxEntries) {
            const removed = this.entries.shift();
            if (removed) {
                // Update session/model costs
                const sessionCost = this.sessionCosts.get(removed.sessionId) ?? 0;
                this.sessionCosts.set(removed.sessionId, sessionCost - removed.costUsd);
                const modelCost = this.modelCosts.get(removed.modelId) ?? 0;
                this.modelCosts.set(removed.modelId, modelCost - removed.costUsd);
            }
        }
    }
    /**
     * Get entries for time range
     */
    getEntriesForRange(start, end) {
        return this.entries.filter(e => e.timestamp >= start && e.timestamp <= end);
    }
    /**
     * Set pricing
     */
    setPricing(modelId, input, output) {
        this.pricing.set(modelId, { input, output });
    }
    /**
     * Set daily budget
     */
    setDailyBudget(budget) {
        this.dailyBudget = budget;
    }
    /**
     * Clear all entries
     */
    clear() {
        this.entries = [];
        this.sessionCosts.clear();
        this.modelCosts.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.dailyBudget = 100;
    }
}
// Global singleton
export const costTracker = new CostTracker();
export default costTracker;
//# sourceMappingURL=cost-tracker.js.map