// @ts-nocheck
class ToolResultStorage {
    results = new Map();
    sessionResults = new Map(); // sessionId -> result IDs
    maxResults = 100;
    maxResultSize = 50 * 1024; // 50KB
    resultIdCounter = 0;
    /**
     * Store tool result
     */
    store(result) {
        const id = `result-${++this.resultIdCounter}-${Date.now()}`;
        const fullResult = {
            ...result,
            timestamp: Date.now()
        };
        // Check size
        const serialized = JSON.stringify(fullResult);
        if (serialized.length > this.maxResultSize) {
            // Truncate output
            fullResult.output = this.truncateOutput(fullResult.output);
        }
        this.ensureCapacity();
        this.results.set(id, fullResult);
        // Track by session
        const sessionIds = this.sessionResults.get(result.sessionId) ?? [];
        sessionIds.push(id);
        this.sessionResults.set(result.sessionId, sessionIds);
        return id;
    }
    /**
     * Truncate large output
     */
    truncateOutput(output) {
        if (typeof output === 'string') {
            return output.slice(0, this.maxResultSize) + '... [truncated]';
        }
        if (typeof output === 'object') {
            const serialized = JSON.stringify(output);
            if (serialized.length > this.maxResultSize) {
                return { truncated: true, preview: serialized.slice(0, 1000) };
            }
        }
        return output;
    }
    /**
     * Get result by ID
     */
    get(id) {
        return this.results.get(id);
    }
    /**
     * Get results for session
     */
    getForSession(sessionId) {
        const ids = this.sessionResults.get(sessionId) ?? [];
        return ids.map(id => this.results.get(id)).filter(Boolean);
    }
    /**
     * Get results for tool
     */
    getForTool(toolName) {
        return Array.from(this.results.values())
            .filter(r => r.toolName === toolName);
    }
    /**
     * Get recent results
     */
    getRecent(count) {
        return Array.from(this.results.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }
    /**
     * Clear results for session
     */
    clearForSession(sessionId) {
        const ids = this.sessionResults.get(sessionId) ?? [];
        let cleared = 0;
        for (const id of ids) {
            if (this.results.delete(id))
                cleared++;
        }
        this.sessionResults.delete(sessionId);
        return cleared;
    }
    /**
     * Ensure capacity
     */
    ensureCapacity() {
        while (this.results.size >= this.maxResults) {
            // Evict oldest
            const oldestId = Array.from(this.results.keys())[0];
            if (oldestId) {
                const result = this.results.get(oldestId);
                // Remove from session tracking
                if (result) {
                    const sessionIds = this.sessionResults.get(result.sessionId) ?? [];
                    const filtered = sessionIds.filter(id => id !== oldestId);
                    this.sessionResults.set(result.sessionId, filtered);
                }
                this.results.delete(oldestId);
            }
        }
    }
    /**
     * Get stats
     */
    getStats() {
        const results = Array.from(this.results.values());
        const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
        const successCount = results.filter(r => r.success).length;
        return {
            totalResults: results.length,
            maxResults: this.maxResults,
            sessionCount: this.sessionResults.size,
            averageDuration: results.length > 0 ? totalDuration / results.length : 0,
            successRate: results.length > 0 ? successCount / results.length : 0
        };
    }
    /**
     * Set max results
     */
    setMaxResults(max) {
        this.maxResults = max;
        this.ensureCapacity();
    }
    /**
     * Clear all
     */
    clear() {
        this.results.clear();
        this.sessionResults.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.resultIdCounter = 0;
        this.maxResults = 100;
        this.maxResultSize = 50 * 1024;
    }
}
// Global singleton
export const toolResultStorage = new ToolResultStorage();
export default toolResultStorage;
//# sourceMappingURL=tool-result-storage.js.map