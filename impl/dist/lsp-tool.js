// @ts-nocheck
class LSPTool {
    results = [];
    lspClient = null;
    /**
     * Initialize
     */
    initialize(client) {
        this.lspClient = client;
    }
    /**
     * Get diagnostics
     */
    diagnostics(filePath) {
        const diagnostics = this.lspClient?.getDiagnostics(filePath) ?? [];
        const result = {
            action: 'diagnostics',
            file: filePath,
            result: diagnostics,
            timestamp: Date.now()
        };
        this.results.push(result);
        return result;
    }
    /**
     * Get completions
     */
    completions(filePath, line, character) {
        const completions = this.lspClient?.requestCompletions(filePath, { line, character }) ?? [];
        const result = {
            action: 'completions',
            file: filePath,
            position: { line, character },
            result: completions,
            timestamp: Date.now()
        };
        this.results.push(result);
        return result;
    }
    /**
     * Get hover
     */
    hover(filePath, line, character) {
        const hoverInfo = this.lspClient?.requestHover(filePath, { line, character }) ?? null;
        const result = {
            action: 'hover',
            file: filePath,
            position: { line, character },
            result: hoverInfo,
            timestamp: Date.now()
        };
        this.results.push(result);
        return result;
    }
    /**
     * Get definition
     */
    definition(filePath, line, character) {
        const definitions = this.lspClient?.requestDefinition(filePath, { line, character }) ?? null;
        const result = {
            action: 'definition',
            file: filePath,
            position: { line, character },
            result: definitions,
            timestamp: Date.now()
        };
        this.results.push(result);
        return result;
    }
    /**
     * Get results
     */
    getResults() {
        return [...this.results];
    }
    /**
     * Get results by action
     */
    getByAction(action) {
        return this.results.filter(r => r.action === action);
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
        const byAction = {};
        for (const result of this.results) {
            byAction[result.action] = (byAction[result.action] ?? 0) + 1;
        }
        const avgSize = this.results.length > 0
            ? this.results.reduce((sum, r) => sum + JSON.stringify(r.result).length, 0) / this.results.length
            : 0;
        return {
            resultsCount: this.results.length,
            byAction,
            averageResultSize: avgSize
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
        this.lspClient = null;
    }
}
// Global singleton
export const lspTool = new LSPTool();
export default lspTool;
//# sourceMappingURL=lsp-tool.js.map