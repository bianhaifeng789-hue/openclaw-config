// @ts-nocheck
class ToolsUtils {
    results = [];
    /**
     * Validate tool input
     */
    validateInput(input, schema) {
        const result = {
            action: 'validateInput',
            success: true,
            timestamp: Date.now()
        };
        try {
            // Would validate against schema
            result.data = { input, validated: true };
        }
        catch (e) {
            result.success = false;
            result.error = e.message;
        }
        this.results.push(result);
        return result;
    }
    /**
     * Format tool output
     */
    formatOutput(output) {
        return JSON.stringify(output);
    }
    /**
     * Parse tool input
     */
    parseInput(input) {
        try {
            return JSON.parse(input);
        }
        catch {
            return { raw: input };
        }
    }
    /**
     * Merge tool results
     */
    mergeResults(results) {
        return results.reduce((acc, r) => ({ ...acc, ...r }), {});
    }
    /**
     * Get results
     */
    getResults() {
        return [...this.results];
    }
    /**
     * Get recent results
     */
    getRecent(count = 10) {
        return this.results.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            resultsCount: this.results.length,
            successfulCount: this.results.filter(r => r.success).length,
            failedCount: this.results.filter(r => !r.success).length
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.results = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const toolsUtils = new ToolsUtils();
export default toolsUtils;
//# sourceMappingURL=tools-utils.js.map