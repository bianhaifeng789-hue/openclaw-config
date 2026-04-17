// @ts-nocheck
class ToolUseSummary {
    records = [];
    summaries = new Map();
    recordCounter = 0;
    /**
     * Record tool use
     */
    record(toolId, toolName, sessionId, success, durationMs, error) {
        const record = {
            toolId,
            toolName,
            sessionId,
            success,
            durationMs,
            error,
            timestamp: Date.now()
        };
        this.records.push(record);
        this.updateSummary(toolId, success, durationMs);
        return record;
    }
    /**
     * Update summary
     */
    updateSummary(toolId, success, durationMs) {
        const summary = this.summaries.get(toolId) ?? {
            toolId,
            totalUses: 0,
            successCount: 0,
            failureCount: 0,
            averageDurationMs: 0,
            lastUsed: Date.now()
        };
        summary.totalUses++;
        if (success)
            summary.successCount++;
        else
            summary.failureCount++;
        // Update average duration
        summary.averageDurationMs =
            (summary.averageDurationMs * (summary.totalUses - 1) + durationMs) / summary.totalUses;
        summary.lastUsed = Date.now();
        this.summaries.set(toolId, summary);
    }
    /**
     * Get summary
     */
    getSummary(toolId) {
        return this.summaries.get(toolId);
    }
    /**
     * Get all summaries
     */
    getAllSummaries() {
        return Array.from(this.summaries.values());
    }
    /**
     * Get records
     */
    getRecords(limit) {
        const records = [...this.records].reverse();
        return limit ? records.slice(0, limit) : records;
    }
    /**
     * Get records by tool
     */
    getRecordsByTool(toolId) {
        return this.records.filter(r => r.toolId === toolId);
    }
    /**
     * Get records by session
     */
    getRecordsBySession(sessionId) {
        return this.records.filter(r => r.sessionId === sessionId);
    }
    /**
     * Get most used tools
     */
    getMostUsed(count = 5) {
        return Array.from(this.summaries.values())
            .sort((a, b) => b.totalUses - a.totalUses)
            .slice(0, count);
    }
    /**
     * Get slowest tools
     */
    getSlowest(count = 5) {
        return Array.from(this.summaries.values())
            .sort((a, b) => b.averageDurationMs - a.averageDurationMs)
            .slice(0, count);
    }
    /**
     * Get success rate
     */
    getSuccessRate(toolId) {
        if (toolId) {
            const summary = this.summaries.get(toolId);
            if (!summary)
                return 0;
            return summary.totalUses > 0 ? summary.successCount / summary.totalUses : 0;
        }
        const allRecords = this.records;
        const success = allRecords.filter(r => r.success).length;
        return allRecords.length > 0 ? success / allRecords.length : 0;
    }
    /**
     * Get stats
     */
    getStats() {
        const records = this.records;
        const success = records.filter(r => r.success).length;
        const avgDuration = records.length > 0
            ? records.reduce((sum, r) => sum + r.durationMs, 0) / records.length
            : 0;
        return {
            recordsCount: records.length,
            summariesCount: this.summaries.size,
            totalSuccessCount: success,
            totalFailureCount: records.length - success,
            overallSuccessRate: this.getSuccessRate(),
            averageDurationMs: avgDuration
        };
    }
    /**
     * Clear old records
     */
    clearOld(thresholdMs = 3600000) {
        const threshold = Date.now() - thresholdMs;
        const oldCount = this.records.filter(r => r.timestamp < threshold).length;
        this.records = this.records.filter(r => r.timestamp >= threshold);
        return oldCount;
    }
    /**
     * Clear all
     */
    clear() {
        this.records = [];
        this.summaries.clear();
        this.recordCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const toolUseSummary = new ToolUseSummary();
export default toolUseSummary;
//# sourceMappingURL=tool-use-summary.js.map