// @ts-nocheck
class WhichUtilsService {
    searches = [];
    pathCache = new Map();
    /**
     * Find command
     */
    which(command) {
        const cached = this.pathCache.get(command);
        if (cached) {
            return {
                command,
                path: cached,
                found: true,
                timestamp: Date.now()
            };
        }
        // Would search PATH for actual executable
        // For demo, simulate
        const path = this.simulateWhich(command);
        if (path) {
            this.pathCache.set(command, path);
        }
        const result = {
            command,
            path,
            found: path !== null,
            timestamp: Date.now()
        };
        this.searches.push(result);
        return result;
    }
    /**
     * Simulate which
     */
    simulateWhich(command) {
        const mockPaths = ['/usr/bin', '/usr/local/bin', '/bin'];
        const mockCommands = ['node', 'npm', 'git', 'bash', 'sh'];
        if (mockCommands.includes(command)) {
            return `/usr/bin/${command}`;
        }
        return null;
    }
    /**
     * Find all
     */
    whichAll(command) {
        const results = [];
        const mockPaths = ['/usr/bin', '/usr/local/bin', '/bin'];
        for (const basePath of mockPaths) {
            results.push({
                command,
                path: `${basePath}/${command}`,
                found: true,
                timestamp: Date.now()
            });
        }
        return results;
    }
    /**
     * Is available
     */
    isAvailable(command) {
        return this.which(command).found;
    }
    /**
     * Get searches
     */
    getSearches() {
        return [...this.searches];
    }
    /**
     * Get found commands
     */
    getFound() {
        return this.searches.filter(s => s.found);
    }
    /**
     * Get not found commands
     */
    getNotFound() {
        return this.searches.filter(s => !s.found);
    }
    /**
     * Get cache
     */
    getCache() {
        const result = {};
        for (const [key, value] of this.pathCache) {
            result[key] = value;
        }
        return result;
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.pathCache.clear();
    }
    /**
     * Get stats
     */
    getStats() {
        const found = this.searches.filter(s => s.found);
        return {
            searchesCount: this.searches.length,
            foundCount: found.length,
            notFoundCount: this.searches.filter(s => !s.found).length,
            cacheSize: this.pathCache.size,
            successRate: this.searches.length > 0 ? found.length / this.searches.length : 0
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.searches = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
        this.clearCache();
    }
}
// Global singleton
export const whichUtilsService = new WhichUtilsService();
export default whichUtilsService;
//# sourceMappingURL=which-utils-service.js.map