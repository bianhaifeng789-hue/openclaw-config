// @ts-nocheck
class WebSearchTool {
    history = [];
    maxResults = 10;
    searchEngines = ['google', 'bing', 'duckduckgo'];
    /**
     * Search
     */
    async search(query, options) {
        const maxResults = options?.maxResults ?? this.maxResults;
        // Would use actual search API
        // For demo, simulate results
        const results = [];
        for (let i = 0; i < maxResults; i++) {
            results.push({
                title: `Result ${i + 1} for "${query}"`,
                url: `https://example.com/result-${i + 1}`,
                snippet: `Snippet for result ${i + 1} about ${query}`,
                rank: i + 1,
                source: options?.engine ?? 'simulated'
            });
        }
        const result = {
            query,
            results,
            totalResults: results.length,
            searchedAt: Date.now()
        };
        this.history.push(result);
        return result;
    }
    /**
     * Get history
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Get recent searches
     */
    getRecent(count = 5) {
        return this.history.slice(-count);
    }
    /**
     * Get search by query
     */
    getByQuery(query) {
        return this.history.filter(s => s.query === query);
    }
    /**
     * Set max results
     */
    setMaxResults(max) {
        this.maxResults = max;
    }
    /**
     * Get max results
     */
    getMaxResults() {
        return this.maxResults;
    }
    /**
     * Add search engine
     */
    addSearchEngine(name) {
        if (!this.searchEngines.includes(name)) {
            this.searchEngines.push(name);
        }
    }
    /**
     * Get search engines
     */
    getSearchEngines() {
        return [...this.searchEngines];
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
    }
    /**
     * Get stats
     */
    getStats() {
        const searches = this.history;
        const uniqueQueries = new Set(searches.map(s => s.query)).size;
        const avgResults = searches.length > 0
            ? searches.reduce((sum, s) => sum + s.totalResults, 0) / searches.length
            : 0;
        return {
            searchesCount: searches.length,
            totalResults: searches.reduce((sum, s) => sum + s.totalResults, 0),
            averageResults: avgResults,
            uniqueQueries: uniqueQueries
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.history = [];
        this.maxResults = 10;
        this.searchEngines = ['google', 'bing', 'duckduckgo'];
    }
}
// Global singleton
export const webSearchTool = new WebSearchTool();
export default webSearchTool;
//# sourceMappingURL=web-search-tool.js.map