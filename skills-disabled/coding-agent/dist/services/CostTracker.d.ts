/**
 * Cost Tracker for coding-agent
 * Adapted from Claude Code's cost-tracker.ts
 */
export interface CostEntry {
    model: string;
    inputTokens: number;
    outputTokens: number;
    timestamp: number;
    cost: number;
}
export interface ModelPricing {
    inputCostPer1k: number;
    outputCostPer1k: number;
}
export declare class CostTracker {
    private entries;
    private sessionStart;
    trackRequest(model: string, inputTokens: number, outputTokens: number): void;
    getSessionCost(): number;
    getSessionTokens(): {
        input: number;
        output: number;
    };
    getEntries(): CostEntry[];
    getSessionDuration(): number;
    formatCost(): string;
    getSummary(): string;
    private groupByModel;
    reset(): void;
}
export declare const globalCostTracker: CostTracker;
//# sourceMappingURL=CostTracker.d.ts.map