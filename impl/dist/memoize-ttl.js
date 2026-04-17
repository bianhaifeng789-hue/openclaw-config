// @ts-nocheck
class MemoizeTTL {
    cache = new Map();
    weakCache = new Map();
    defaultTTL = 5 * 60 * 1000; // 5 minutes
    maxCacheSize = 100;
    /**
     * Memoize function with TTL
     */
    memoize(fn, options) {
        const ttlMs = options?.ttlMs ?? this.defaultTTL;
        const resolver = options?.resolver ?? ((...args) => JSON.stringify(args));
        const maxSize = options?.maxSize ?? this.maxCacheSize;
        const memoized = async (...args) => {
            const key = resolver(...args);
            // Check cache
            const cached = this.cache.get(key);
            if (cached) {
                // Check TTL
                if (Date.now() - cached.computedAt < cached.ttlMs) {
                    return cached.value;
                }
                // TTL expired: remove
                this.cache.delete(key);
                this.weakCache.delete(key);
            }
            // Compute fresh
            const value = await fn(...args);
            // Cache result
            this.ensureCapacity(maxSize);
            this.cache.set(key, {
                value,
                computedAt: Date.now(),
                ttlMs,
                resolverKey: key
            });
            // WeakRef for GC
            if (typeof value === 'object' && value !== null) {
                this.weakCache.set(key, new WeakRef(value));
            }
            return value;
        };
        return memoized;
    }
    /**
     * Memoize sync function with TTL
     */
    memoizeSync(fn, options) {
        const ttlMs = options?.ttlMs ?? this.defaultTTL;
        const resolver = options?.resolver ?? ((...args) => JSON.stringify(args));
        const memoized = (...args) => {
            const key = resolver(...args);
            // Check cache
            const cached = this.cache.get(key);
            if (cached) {
                if (Date.now() - cached.computedAt < cached.ttlMs) {
                    return cached.value;
                }
                this.cache.delete(key);
            }
            // Compute
            const value = fn(...args);
            // Cache
            this.ensureCapacity(this.maxCacheSize);
            this.cache.set(key, {
                value,
                computedAt: Date.now(),
                ttlMs
            });
            return value;
        };
        return memoized;
    }
    /**
     * Ensure cache capacity
     */
    ensureCapacity(maxSize) {
        if (this.cache.size >= maxSize) {
            // Evict oldest
            let oldestKey = null;
            let oldestTime = Infinity;
            for (const [key, entry] of this.cache) {
                if (entry.computedAt < oldestTime) {
                    oldestTime = entry.computedAt;
                    oldestKey = key;
                }
            }
            if (oldestKey) {
                this.cache.delete(oldestKey);
                this.weakCache.delete(oldestKey);
            }
        }
    }
    /**
     * Invalidate cache by key
     */
    invalidate(key) {
        const deleted = this.cache.delete(key);
        this.weakCache.delete(key);
        return deleted;
    }
    /**
     * Invalidate all entries matching pattern
     */
    invalidatePattern(pattern) {
        let count = 0;
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
                this.weakCache.delete(key);
                count++;
            }
        }
        return count;
    }
    /**
     * Refresh entry (force recomputation)
     */
    refresh(key, fn) {
        this.cache.delete(key);
        return fn();
    }
    /**
     * Clear all cache
     */
    clear() {
        this.cache.clear();
        this.weakCache.clear();
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            cacheSize: this.cache.size,
            weakCacheSize: this.weakCache.size,
            totalEntries: this.cache.size
        };
    }
    /**
     * Set default TTL
     */
    setDefaultTTL(ms) {
        this.defaultTTL = ms;
    }
    /**
     * Set max cache size
     */
    setMaxSize(size) {
        this.maxCacheSize = size;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.defaultTTL = 5 * 60 * 1000;
        this.maxCacheSize = 100;
    }
}
// Global singleton
export const memoizeTTL = new MemoizeTTL();
export default memoizeTTL;
//# sourceMappingURL=memoize-ttl.js.map