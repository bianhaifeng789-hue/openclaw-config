/**
 * Cost Tracker for coding-agent
 * Adapted from Claude Code's cost-tracker.ts
 */
// Pricing per 1000 tokens (approximate)
const MODEL_PRICING = {
    'claude-sonnet-4-20250514': { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
    'claude-opus-4-20250514': { inputCostPer1k: 0.015, outputCostPer1k: 0.075 },
    'claude-3-5-sonnet-20241022': { inputCostPer1k: 0.003, outputCostPer1k: 0.015 },
    'claude-3-5-haiku-20241022': { inputCostPer1k: 0.001, outputCostPer1k: 0.005 },
    'gpt-4o': { inputCostPer1k: 0.005, outputCostPer1k: 0.015 },
    'gpt-4o-mini': { inputCostPer1k: 0.00015, outputCostPer1k: 0.0006 },
};
export class CostTracker {
    entries = [];
    sessionStart = Date.now();
    trackRequest(model, inputTokens, outputTokens) {
        const pricing = MODEL_PRICING[model] || { inputCostPer1k: 0.003, outputCostPer1k: 0.015 };
        const inputCost = (inputTokens / 1000) * pricing.inputCostPer1k;
        const outputCost = (outputTokens / 1000) * pricing.outputCostPer1k;
        this.entries.push({
            model,
            inputTokens,
            outputTokens,
            timestamp: Date.now(),
            cost: inputCost + outputCost,
        });
    }
    getSessionCost() {
        return this.entries.reduce((sum, entry) => sum + entry.cost, 0);
    }
    getSessionTokens() {
        return {
            input: this.entries.reduce((sum, e) => sum + e.inputTokens, 0),
            output: this.entries.reduce((sum, e) => sum + e.outputTokens, 0),
        };
    }
    getEntries() {
        return [...this.entries];
    }
    getSessionDuration() {
        return Date.now() - this.sessionStart;
    }
    formatCost() {
        const cost = this.getSessionCost();
        const tokens = this.getSessionTokens();
        const duration = this.getSessionDuration();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `Session: ${minutes}m ${seconds}s | Tokens: ${tokens.input} in / ${tokens.output} out | Cost: $${cost.toFixed(4)}`;
    }
    getSummary() {
        const cost = this.getSessionCost();
        const tokens = this.getSessionTokens();
        let summary = `## 💰 Cost Summary\n\n`;
        summary += `- **Total Cost**: $${cost.toFixed(4)}\n`;
        summary += `- **Input Tokens**: ${tokens.input}\n`;
        summary += `- **Output Tokens**: ${tokens.output}\n`;
        summary += `- **Requests**: ${this.entries.length}\n\n`;
        if (this.entries.length > 0) {
            summary += `### By Model\n`;
            const byModel = this.groupByModel();
            for (const [model, data] of Object.entries(byModel)) {
                summary += `- ${model}: ${data.requests} requests, $${data.cost.toFixed(4)}\n`;
            }
        }
        return summary;
    }
    groupByModel() {
        const grouped = {};
        for (const entry of this.entries) {
            if (!grouped[entry.model]) {
                grouped[entry.model] = { requests: 0, cost: 0, input: 0, output: 0 };
            }
            grouped[entry.model].requests++;
            grouped[entry.model].cost += entry.cost;
            grouped[entry.model].input += entry.inputTokens;
            grouped[entry.model].output += entry.outputTokens;
        }
        return grouped;
    }
    reset() {
        this.entries = [];
        this.sessionStart = Date.now();
    }
}
// Global cost tracker instance
export const globalCostTracker = new CostTracker();
//# sourceMappingURL=CostTracker.js.map