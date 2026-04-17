// @ts-nocheck
class ToolSchemaCacheService {
    cache = new Map();
    cacheTTL = 3600000; // 1 hour
    /**
     * Cache schema
     */
    cache(toolName, schema) {
        const cached = {
            toolName,
            schema,
            cachedAt: Date.now(),
            accessedAt: Date.now(),
            accessCount: 0
        };
        this.cache.set(toolName, cached);
        return cached;
    }
    /**
     * Get schema
     */
    get(toolName) {
        const cached = this.cache.get(toolName);
        if (!cached)
            return undefined;
        // Check TTL
        if (Date.now() - cached.cachedAt > this.cacheTTL) {
            this.cache.delete(toolName);
            return undefined;
        }
        cached.accessedAt = Date.now();
        cached.accessCount++;
        return cached;
    }
    /**
     * Get schema only
     */
    getSchema(toolName) {
        return this.get(toolName)?.schema;
    }
    /**
     * Has schema
     */
    has(toolName) {
        return this.get(toolName) !== undefined;
    }
    /**
     * Invalidate schema
     */
    invalidate(toolName) {
        return this.cache.delete(toolName);
    }
    /**
     * Invalidate all
     */
    invalidateAll() {
        this.cache.clear();
    }
    /**
     * Get cached tools
     */
    getCachedTools() {
        return Array.from(this.cache.keys());
    }
    /**
     * Get stats
     */
    getStats() {
        const entries = Array.from(this.cache.values());
        const now = Date.now();
        const totalAccess = entries.reduce((sum, e) => sum + e.accessCount, 0);
        const avgAccess = entries.length > 0 ? totalAccess / entries.length : 0;
        const expired = entries.filter(e => now - e.cachedAt > this.cacheTTL).length;
        return {
            cacheCount: entries.length,
            cacheTTL: this.cacheTTL,
            totalAccessCount: totalAccess,
            averageAccessCount: avgAccess,
            expiredCount: expired
        };
    }
    /**
     * Set TTL
     */
    setTTL(ms) {
        this.cacheTTL = ms;
    }
    /**
     * Clear all
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.cacheTTL = 3600000;
    }
}
// Global singleton
export const toolSchemaCacheService = new ToolSchemaCacheService();
export default toolSchemaCacheService;
//# sourceMappingURL=tool-schema-cache-service.js.map