// @ts-nocheck
class MemoizeUtilsService {
    caches = new Map();
    globalCache = new Map();
    /**
     * Memoize function
     */
    memoize(fn, keyFn) {
        const cache = new Map();
        const cacheId = `memoize-${Date.now()}`;
        this.caches.set(cacheId, cache);
        const memoized = (...args) => {
            const key = keyFn ? keyFn(...args) : JSON.stringify(args);
            const cached = cache.get(key) ?? this.globalCache.get(key);
            if (cached) {
                cached.accessCount++;
                return cached.result;
            }
            const result = fn(...args);
            const entry = {
                key,
                result,
                cachedAt: Date.now(),
                accessCount: 1
            };
            cache.set(key, entry);
            return result;
        };
        return memoized;
    }
    /**
     * Memoize with TTL
     */
    memoizeWithTTL(fn, ttlMs, keyFn) {
        const cache = new Map();
        const memoized = (...args) => {
            const key = keyFn ? keyFn(...args) : JSON.stringify(args);
            const cached = cache.get(key);
            if (cached && Date.now() - cached.cachedAt < ttlMs) {
                cached.accessCount++;
                return cached.result;
            }
            const result = fn(...args);
            cache.set(key, {
                key,
                result,
                cachedAt: Date.now(),
                accessCount: 1
            });
            return result;
        };
        return memoized;
    }
    /**
     * Clear cache
     */
    clear(cacheId) {
        if (cacheId) {
            this.caches.delete(cacheId);
        }
        else {
            this.caches.clear();
            this.globalCache.clear();
        }
    }
    /**
     * Get cache size
     */
    getCacheSize(cacheId) {
        if (cacheId) {
            return this.caches.get(cacheId)?.size ?? 0;
        }
        let total = this.globalCache.size;
        for (const cache of this.caches.values()) {
            total += cache.size;
        }
        return total;
    }
    /**
     * Get stats
     */
    getStats() {
        let totalEntries = this.globalCache.size;
        let totalAccess = 0;
        for (const cache of this.caches.values()) {
            totalEntries += cache.size;
            for (const entry of cache.values()) {
                totalAccess += entry.accessCount;
            }
        }
        for (const entry of this.globalCache.values()) {
            totalAccess += entry.accessCount;
        }
        const avgAccess = totalEntries > 0 ? totalAccess / totalEntries : 0;
        return {
            cachesCount: this.caches.size + 1,
            totalEntries: totalEntries,
            totalAccessCount: totalAccess,
            averageAccessCount: avgAccess
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.caches.clear();
        this.globalCache.clear();
    }
}
// Global singleton
export const memoizeUtilsService = new MemoizeUtilsService();
export default memoizeUtilsService;
//# sourceMappingURL=memoize-utils-service.js.map