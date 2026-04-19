/**
 * Cost Tracker for coding-agent
 *
 * Tracks token usage and estimated costs for LLM calls.
 * Adapted from Claude Code's cost-tracker.ts
 */
export type ModelCostConfig = {
    inputCostPer1M: number;
    outputCostPer1M: number;
    cacheReadCostPer1M?: number;
    cacheWriteCostPer1M?: number;
};
export type TokenUsage = {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
};
export type CostBreakdown = TokenUsage & {
    inputCost: number;
    outputCost: number;
    cacheReadCost?: number;
    cacheWriteCost?: number;
    totalCost: number;
};
export type CostTrackerState = {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCacheReadTokens: number;
    totalCacheWriteTokens: number;
    totalCost: number;
    modelBreakdown: Map<string, CostBreakdown>;
    recentCalls: Array<{
        timestamp: Date;
        model: string;
        usage: TokenUsage;
        cost: number;
    }>;
};
/**
 * Default cost configurations for common models
 */
export declare const DEFAULT_MODEL_COSTS: Record<string, ModelCostConfig>;
/**
 * Cost Tracker class
 */
export declare class CostTracker {
    private state;
    private modelCosts;
    private maxRecentCalls;
    constructor(modelCosts?: Record<string, ModelCostConfig>);
    /**
     * Track a single LLM call
     */
    trackCall(model: string, usage: TokenUsage): CostBreakdown;
    /**
     * Get current state summary
     */
    getState(): CostTrackerState;
    /**
     * Get formatted cost summary
     */
    getFormattedSummary(): string;
    /**
     * Reset tracker state
     */
    reset(): void;
    /**
     * Add or update model cost config
     */
    setModelCost(model: string, config: ModelCostConfig): void;
    private getModelConfig;
    private calculateCost;
    private formatTokens;
    private formatCost;
}
export declare function getCostTracker(): CostTracker;
export declare function resetCostTracker(): void;
//# sourceMappingURL=cost-tracker.d.ts.map