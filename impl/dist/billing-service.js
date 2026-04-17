// @ts-nocheck
class BillingService {
    usageRecords = [];
    quotas = new Map();
    config = {
        modelPrices: {
            'claude-opus': { inputUsd: 15, outputUsd: 75 },
            'claude-sonnet': { inputUsd: 3, outputUsd: 15 },
            'claude-haiku': { inputUsd: 0.25, outputUsd: 1.25 },
            'default': { inputUsd: 1, outputUsd: 5 }
        }
    };
    /**
     * Record usage
     */
    recordUsage(userId, modelId, inputTokens, outputTokens) {
        const price = this.config.modelPrices[modelId] ?? this.config.modelPrices['default'];
        const costUsd = (inputTokens / 1_000_000 * price.inputUsd) +
            (outputTokens / 1_000_000 * price.outputUsd);
        const usage = {
            userId,
            modelId,
            inputTokens,
            outputTokens,
            costUsd,
            timestamp: Date.now()
        };
        this.usageRecords.push(usage);
        // Update quota
        this.updateQuota(userId, costUsd);
        return usage;
    }
    /**
     * Calculate cost
     */
    calculateCost(modelId, inputTokens, outputTokens) {
        const price = this.config.modelPrices[modelId] ?? this.config.modelPrices['default'];
        return (inputTokens / 1_000_000 * price.inputUsd) +
            (outputTokens / 1_000_000 * price.outputUsd);
    }
    /**
     * Set quota
     */
    setQuota(userId, monthlyLimitUsd) {
        const now = Date.now();
        const periodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
        const periodEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime();
        const quota = {
            userId,
            monthlyLimitUsd,
            usedUsd: 0,
            periodStart,
            periodEnd
        };
        this.quotas.set(userId, quota);
        return quota;
    }
    /**
     * Update quota
     */
    updateQuota(userId, costUsd) {
        const quota = this.quotas.get(userId);
        if (!quota)
            return;
        quota.usedUsd += costUsd;
    }
    /**
     * Check quota
     */
    checkQuota(userId) {
        const quota = this.quotas.get(userId);
        if (!quota) {
            return { withinQuota: true, remainingUsd: Infinity, percentageUsed: 0 };
        }
        const remaining = quota.monthlyLimitUsd - quota.usedUsd;
        const percentage = quota.usedUsd / quota.monthlyLimitUsd * 100;
        return {
            withinQuota: remaining >= 0,
            remainingUsd: remaining,
            percentageUsed: percentage
        };
    }
    /**
     * Get user usage
     */
    getUserUsage(userId) {
        return this.usageRecords.filter(u => u.userId === userId);
    }
    /**
     * Get total cost
     */
    getTotalCost(userId) {
        const records = userId ? this.getUserUsage(userId) : this.usageRecords;
        return records.reduce((sum, u) => sum + u.costUsd, 0);
    }
    /**
     * Get stats
     */
    getStats() {
        const totalCost = this.usageRecords.reduce((sum, u) => sum + u.costUsd, 0);
        const totalInput = this.usageRecords.reduce((sum, u) => sum + u.inputTokens, 0);
        const totalOutput = this.usageRecords.reduce((sum, u) => sum + u.outputTokens, 0);
        return {
            totalRecords: this.usageRecords.length,
            totalCostUsd: totalCost,
            totalInputTokens: totalInput,
            totalOutputTokens: totalOutput,
            usersWithQuota: this.quotas.size
        };
    }
    /**
     * Set model price
     */
    setModelPrice(modelId, inputUsd, outputUsd) {
        this.config.modelPrices[modelId] = { inputUsd, outputUsd };
    }
    /**
     * Clear usage records
     */
    clearUsage() {
        this.usageRecords = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearUsage();
        this.quotas.clear();
        this.config = {
            modelPrices: {
                'claude-opus': { inputUsd: 15, outputUsd: 75 },
                'claude-sonnet': { inputUsd: 3, outputUsd: 15 },
                'claude-haiku': { inputUsd: 0.25, outputUsd: 1.25 },
                'default': { inputUsd: 1, outputUsd: 5 }
            }
        };
    }
}
// Global singleton
export const billingService = new BillingService();
export default billingService;
//# sourceMappingURL=billing-service.js.map