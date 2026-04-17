// @ts-nocheck
class GlobTool {
    searches = [];
    searchCounter = 0;
    /**
     * Glob search
     */
    glob(pattern, cwd) {
        // Would use actual glob implementation
        // For demo, simulate matches
        const matches = [];
        const mockCount = Math.floor(Math.random() * 10) + 1;
        for (let i = 0; i < mockCount; i++) {
            matches.push(`${cwd ?? process.cwd()}/file-${i}.ts`);
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
     * Search TypeScript files
     */
    searchTs(cwd) {
        return this.glob('**/*.ts', cwd);
    }
    /**
     * Search JavaScript files
     */
    searchJs(cwd) {
        return this.glob('**/*.js', cwd);
    }
    /**
     * Search JSON files
     */
    searchJson(cwd) {
        return this.glob('**/*.json', cwd);
    }
    /**
     * Search Markdown files
     */
    searchMd(cwd) {
        return this.glob('**/*.md', cwd);
    }
    /**
     * Search all files
     */
    searchAll(cwd) {
        return this.glob('**/*', cwd);
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
export const globTool = new GlobTool();
export default globTool;
//# sourceMappingURL=glob-tool.js.map