// @ts-nocheck
class CompactService {
    compactHistory = [];
    totalCompacted = 0;
    isCompacting = false;
    config = {
        tokenThreshold: 150000, // 150k tokens
        maxSummaryTokens: 50000,
        preserveRecentMessages: 10
    };
    /**
     * Check if should compact
     */
    shouldCompact(currentTokens) {
        return currentTokens >= this.config.tokenThreshold && !this.isCompacting;
    }
    /**
     * Run compact
     */
    async compact(messages) {
        if (this.isCompacting) {
            throw new Error('Compact already in progress');
        }
        this.isCompacting = true;
        const startTime = Date.now();
        try {
            // Calculate original tokens
            const originalTokens = messages.reduce((sum, m) => sum + m.tokens, 0);
            // Preserve recent messages
            const preservedMessages = messages.slice(-this.config.preserveRecentMessages);
            // Summarize older messages
            const olderMessages = messages.slice(0, -this.config.preserveRecentMessages);
            const summary = this.generateSummary(olderMessages);
            // Calculate compacted tokens
            const preservedTokens = preservedMessages.reduce((sum, m) => sum + m.tokens, 0);
            const summaryTokens = Math.min(this.config.maxSummaryTokens, Math.floor(summary.length / 4));
            const compactedTokens = preservedTokens + summaryTokens;
            const reductionRatio = (originalTokens - compactedTokens) / originalTokens;
            const result = {
                originalTokens,
                compactedTokens,
                reductionRatio,
                preservedMessages: preservedMessages.length,
                summaryGenerated: summary.length > 0,
                timestamp: startTime
            };
            this.compactHistory.push(result);
            this.totalCompacted++;
            return result;
        }
        finally {
            this.isCompacting = false;
        }
    }
    /**
     * Generate summary from messages
     */
    generateSummary(messages) {
        // Would use LLM for summarization
        // For demo, return simple concatenation
        const keyPoints = messages.slice(0, 5).map(m => m.content.slice(0, 100));
        return `Summary: ${keyPoints.join('; ')}`;
    }
    /**
     * Get compact history
     */
    getHistory() {
        return [...this.compactHistory];
    }
    /**
     * Get stats
     */
    getStats() {
        const averageReduction = this.compactHistory.length > 0
            ? this.compactHistory.reduce((sum, r) => sum + r.reductionRatio, 0) / this.compactHistory.length
            : 0;
        const lastCompactTime = this.compactHistory.length > 0
            ? this.compactHistory[this.compactHistory.length - 1].timestamp
            : null;
        return {
            totalCompacted: this.totalCompacted,
            averageReduction,
            lastCompactTime,
            config: { ...this.config }
        };
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.compactHistory = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.compactHistory = [];
        this.totalCompacted = 0;
        this.isCompacting = false;
        this.config = {
            tokenThreshold: 150000,
            maxSummaryTokens: 50000,
            preserveRecentMessages: 10
        };
    }
}
// Global singleton
export const compactService = new CompactService();
export default compactService;
//# sourceMappingURL=compact-service.js.map