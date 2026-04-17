// @ts-nocheck
class WebFetchTool {
    cache = new Map();
    history = [];
    defaultTimeout = 10000;
    cacheTTL = 3600000; // 1 hour
    /**
     * Fetch URL
     */
    async fetch(url, options) {
        // Check cache
        const cached = this.getCached(url);
        if (cached) {
            return {
                url,
                content: cached.content,
                contentType: 'cached',
                statusCode: 200,
                cached: true,
                fetchedAt: cached.fetchedAt
            };
        }
        // Would fetch actual URL
        // For demo, simulate
        const result = {
            url,
            content: this.simulateContent(url),
            contentType: 'text/html',
            statusCode: 200,
            cached: false,
            fetchedAt: Date.now()
        };
        // Cache result
        this.setCache(url, result.content);
        // Record history
        this.history.push(result);
        return result;
    }
    /**
     * Simulate content
     */
    simulateContent(url) {
        return `Simulated content from ${url}`;
    }
    /**
     * Get cached
     */
    getCached(url) {
        const cached = this.cache.get(url);
        if (!cached)
            return null;
        if (Date.now() - cached.fetchedAt > cached.ttl) {
            this.cache.delete(url);
            return null;
        }
        return cached;
    }
    /**
     * Set cache
     */
    setCache(url, content) {
        this.cache.set(url, {
            content,
            fetchedAt: Date.now(),
            ttl: this.cacheTTL
        });
    }
    /**
     * Extract content
     */
    extract(html, selector) {
        // Would parse HTML and extract
        // For demo, truncate
        return html.slice(0, 500);
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache size
     */
    getCacheSize() {
        return this.cache.size;
    }
    /**
     * Get history
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Get recent fetches
     */
    getRecent(count = 10) {
        return this.history.slice(-count);
    }
    /**
     * Set cache TTL
     */
    setCacheTTL(ttlMs) {
        this.cacheTTL = ttlMs;
    }
    /**
     * Get stats
     */
    getStats() {
        const cachedCount = this.history.filter(h => h.cached).length;
        return {
            cacheSize: this.cache.size,
            historyCount: this.history.length,
            cachedFetches: cachedCount,
            totalFetches: this.history.length
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearCache();
        this.history = [];
        this.defaultTimeout = 10000;
        this.cacheTTL = 3600000;
    }
}
// Global singleton
export const webFetchTool = new WebFetchTool();
export default webFetchTool;
//# sourceMappingURL=web-fetch-tool.js.map