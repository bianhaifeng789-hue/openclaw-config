// @ts-nocheck
class GrepTool {
    searches = [];
    searchCounter = 0;
    /**
     * Grep search
     */
    grep(pattern, cwd) {
        // Would use actual grep implementation
        // For demo, simulate matches
        const matches = [];
        const mockCount = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < mockCount; i++) {
            matches.push({
                file: `${cwd ?? process.cwd()}/file-${i}.ts`,
                line: i * 10 + 1,
                content: `Match for pattern "${pattern}"`
            });
        }
        const result = {
            pattern,
            matches,
            count: matches.length,
            timestamp: Date.now()
        };
        this.searches.push(result);
        return result;
    }
    /**
     * Search with options
     */
    searchWithOptions(pattern, options) {
        return this.grep(pattern);
    }
    /**
     * Search exact match
     */
    searchExact(pattern, cwd) {
        return this.grep(pattern, cwd);
    }
    /**
     * Search case insensitive
     */
    searchCaseInsensitive(pattern, cwd) {
        return this.grep(pattern.toLowerCase(), cwd);
    }
    /**
     * Search regex
     */
    searchRegex(regex, cwd) {
        return this.grep(regex, cwd);
    }
    /**
     * Get searches
     */
    getSearches() {
        return [...this.searches];
    }
    /**
     * Get searches by pattern
     */
    getByPattern(pattern) {
        return this.searches.filter(s => s.pattern === pattern);
    }
    /**
     * Get recent searches
     */
    getRecent(count = 10) {
        return this.searches.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const totalMatches = this.searches.reduce((sum, s) => sum + s.count, 0);
        const avgMatches = this.searches.length > 0 ? totalMatches / this.searches.length : 0;
        const uniquePatterns = new Set(this.searches.map(s => s.pattern)).size;
        return {
            searchesCount: this.searches.length,
            totalMatches: totalMatches,
            averageMatches: avgMatches,
            uniquePatterns: uniquePatterns
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.searches = [];
        this.searchCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const grepTool = new GrepTool();
export default grepTool;
//# sourceMappingURL=grep-tool.js.map