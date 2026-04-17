// @ts-nocheck
class ToolSearchAutoService {
    results = [];
    searchCounter = 0;
    toolRegistry = [];
    /**
     * Register tools
     */
    registerTools(tools) {
        this.toolRegistry = tools;
    }
    /**
     * Auto search
     */
    autoSearch(query) {
        const id = `auto-search-${++this.searchCounter}-${Date.now()}`;
        const matchedTools = this.matchTools(query);
        const score = matchedTools.length > 0 ? 1 / matchedTools.length : 0;
        const result = {
            query,
            matchedTools,
            score,
            auto: true,
            timestamp: Date.now()
        };
        this.results.push(result);
        return result;
    }
    /**
     * Match tools
     */
    matchTools(query) {
        const lowerQuery = query.toLowerCase();
        return this.toolRegistry
            .filter(tool => tool.toLowerCase().includes(lowerQuery))
            .sort((a, b) => {
            const aScore = a.toLowerCase().indexOf(lowerQuery);
            const bScore = b.toLowerCase().indexOf(lowerQuery);
            return aScore - bScore;
        });
    }
    /**
     * Suggest tools
     */
    suggest(query) {
        const result = this.autoSearch(query);
        return result.matchedTools;
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
        const avgScore = this.results.length > 0
            ? this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length
            : 0;
        const avgMatches = this.results.length > 0
            ? this.results.reduce((sum, r) => sum + r.matchedTools.length, 0) / this.results.length
            : 0;
        const uniqueQueries = new Set(this.results.map(r => r.query)).size;
        return {
            searchesCount: this.results.length,
            averageScore: avgScore,
            averageMatches: avgMatches,
            uniqueQueries: uniqueQueries
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.results = [];
        this.searchCounter = 0;
        this.toolRegistry = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const toolSearchAutoService = new ToolSearchAutoService();
export default toolSearchAutoService;
//# sourceMappingURL=tool-search-auto-service.js.map