/**
 * Cost Tracker for coding-agent
 *
 * Tracks token usage and estimated costs for LLM calls.
 * Adapted from Claude Code's cost-tracker.ts
 */
/**
 * Default cost configurations for common models
 */
export const DEFAULT_MODEL_COSTS = {
    'claude-sonnet-4': {
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00,
        cacheReadCostPer1M: 0.30,
        cacheWriteCostPer1M: 3.75,
    },
    'claude-opus-4': {
        inputCostPer1M: 15.00,
        outputCostPer1M: 75.00,
        cacheReadCostPer1M: 1.50,
        cacheWriteCostPer1M: 18.75,
    },
    'claude-3-5-sonnet': {
        inputCostPer1M: 3.00,
        outputCostPer1M: 15.00,
        cacheReadCostPer1M: 0.30,
        cacheWriteCostPer1M: 3.75,
    },
    'claude-3-opus': {
        inputCostPer1M: 15.00,
        outputCostPer1M: 75.00,
        cacheReadCostPer1M: 1.50,
        cacheWriteCostPer1M: 18.75,
    },
    'gpt-4o': {
        inputCostPer1M: 2.50,
        outputCostPer1M: 10.00,
    },
    'gpt-4-turbo': {
        inputCostPer1M: 10.00,
        outputCostPer1M: 30.00,
    },
    'gpt-3.5-turbo': {
        inputCostPer1M: 0.50,
        outputCostPer1M: 1.50,
    },
    'deepseek-chat': {
        inputCostPer1M: 0.14,
        outputCostPer1M: 0.28,
        cacheReadCostPer1M: 0.014,
    },
    'deepseek-coder': {
        inputCostPer1M: 0.14,
        outputCostPer1M: 0.28,
        cacheReadCostPer1M: 0.014,
    },
};
/**
 * Cost Tracker class
 */
export class CostTracker {
    state = {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCacheReadTokens: 0,
        totalCacheWriteTokens: 0,
        totalCost: 0,
        modelBreakdown: new Map(),
        recentCalls: [],
    };
    modelCosts;
    maxRecentCalls = 100;
    constructor(modelCosts) {
        this.modelCosts = modelCosts || DEFAULT_MODEL_COSTS;
    }
    /**
     * Track a single LLM call
     */
    trackCall(model, usage) {
        const config = this.getModelConfig(model);
        const breakdown = this.calculateCost(usage, config);
        // Update totals
        this.state.totalInputTokens += usage.inputTokens;
        this.state.totalOutputTokens += usage.outputTokens;
        this.state.totalCacheReadTokens += usage.cacheReadTokens ?? 0;
        this.state.totalCacheWriteTokens += usage.cacheWriteTokens ?? 0;
        this.state.totalCost += breakdown.totalCost;
        // Update model breakdown
        const existing = this.state.modelBreakdown.get(model);
        if (existing) {
            this.state.modelBreakdown.set(model, {
                inputTokens: existing.inputTokens + usage.inputTokens,
                outputTokens: existing.outputTokens + usage.outputTokens,
                cacheReadTokens: (existing.cacheReadTokens ?? 0) + (usage.cacheReadTokens ?? 0),
                cacheWriteTokens: (existing.cacheWriteTokens ?? 0) + (usage.cacheWriteTokens ?? 0),
                inputCost: existing.inputCost + breakdown.inputCost,
                outputCost: existing.outputCost + breakdown.outputCost,
                cacheReadCost: (existing.cacheReadCost ?? 0) + (breakdown.cacheReadCost ?? 0),
                cacheWriteCost: (existing.cacheWriteCost ?? 0) + (breakdown.cacheWriteCost ?? 0),
                totalCost: existing.totalCost + breakdown.totalCost,
            });
        }
        else {
            this.state.modelBreakdown.set(model, breakdown);
        }
        // Add to recent calls
        this.state.recentCalls.push({
            timestamp: new Date(),
            model,
            usage,
            cost: breakdown.totalCost,
        });
        // Trim recent calls if too many
        if (this.state.recentCalls.length > this.maxRecentCalls) {
            this.state.recentCalls = this.state.recentCalls.slice(-this.maxRecentCalls);
        }
        return breakdown;
    }
    /**
     * Get current state summary
     */
    getState() {
        return {
            ...this.state,
            modelBreakdown: new Map(this.state.modelBreakdown),
            recentCalls: [...this.state.recentCalls],
        };
    }
    /**
     * Get formatted cost summary
     */
    getFormattedSummary() {
        const lines = [];
        lines.push('=== Cost Summary ===');
        lines.push(`Total Tokens: ${this.formatTokens(this.state.totalInputTokens + this.state.totalOutputTokens)}`);
        lines.push(`  Input:  ${this.formatTokens(this.state.totalInputTokens)}`);
        lines.push(`  Output: ${this.formatTokens(this.state.totalOutputTokens)}`);
        if (this.state.totalCacheReadTokens > 0) {
            lines.push(`  Cache Read:  ${this.formatTokens(this.state.totalCacheReadTokens)}`);
        }
        if (this.state.totalCacheWriteTokens > 0) {
            lines.push(`  Cache Write: ${this.formatTokens(this.state.totalCacheWriteTokens)}`);
        }
        lines.push(`Total Cost: ${this.formatCost(this.state.totalCost)}`);
        if (this.state.modelBreakdown.size > 1) {
            lines.push('');
            lines.push('By Model:');
            for (const [model, breakdown] of this.state.modelBreakdown) {
                lines.push(`  ${model}: ${this.formatCost(breakdown.totalCost)} (${this.formatTokens(breakdown.inputTokens + breakdown.outputTokens)} tokens)`);
            }
        }
        return lines.join('\n');
    }
    /**
     * Reset tracker state
     */
    reset() {
        this.state = {
            totalInputTokens: 0,
            totalOutputTokens: 0,
            totalCacheReadTokens: 0,
            totalCacheWriteTokens: 0,
            totalCost: 0,
            modelBreakdown: new Map(),
            recentCalls: [],
        };
    }
    /**
     * Add or update model cost config
     */
    setModelCost(model, config) {
        this.modelCosts[model] = config;
    }
    getModelConfig(model) {
        // Try exact match first
        if (this.modelCosts[model]) {
            return this.modelCosts[model];
        }
        // Try partial match (e.g., 'claude-3-5-sonnet-20241022' -> 'claude-3-5-sonnet')
        for (const [key, config] of Object.entries(this.modelCosts)) {
            if (model.includes(key) || key.includes(model.split('-').slice(0, 3).join('-'))) {
                return config;
            }
        }
        // Default fallback (unknown model)
        return {
            inputCostPer1M: 1.00,
            outputCostPer1M: 2.00,
        };
    }
    calculateCost(usage, config) {
        const inputCost = (usage.inputTokens / 1_000_000) * config.inputCostPer1M;
        const outputCost = (usage.outputTokens / 1_000_000) * config.outputCostPer1M;
        const cacheReadCost = usage.cacheReadTokens
            ? (usage.cacheReadTokens / 1_000_000) * (config.cacheReadCostPer1M ?? 0)
            : undefined;
        const cacheWriteCost = usage.cacheWriteTokens
            ? (usage.cacheWriteTokens / 1_000_000) * (config.cacheWriteCostPer1M ?? 0)
            : undefined;
        const totalCost = inputCost + outputCost + (cacheReadCost ?? 0) + (cacheWriteCost ?? 0);
        return {
            ...usage,
            inputCost,
            outputCost,
            cacheReadCost,
            cacheWriteCost,
            totalCost,
        };
    }
    formatTokens(tokens) {
        if (tokens >= 1_000_000) {
            return `${(tokens / 1_000_000).toFixed(2)}M`;
        }
        if (tokens >= 1_000) {
            return `${(tokens / 1_000).toFixed(1)}K`;
        }
        return `${tokens}`;
    }
    formatCost(cost) {
        if (cost >= 1) {
            return `$${cost.toFixed(2)}`;
        }
        if (cost >= 0.01) {
            return `$${cost.toFixed(3)}`;
        }
        return `$${cost.toFixed(4)}`;
    }
}
// Singleton instance for convenience
let _instance;
export function getCostTracker() {
    if (!_instance) {
        _instance = new CostTracker();
    }
    return _instance;
}
export function resetCostTracker() {
    _instance = undefined;
}
//# sourceMappingURL=cost-tracker.js.map