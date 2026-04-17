// @ts-nocheck
class ThreeTierSettingsCache {
    // Layer 1: Session-level cache (entire settings object)
    sessionCache = null;
    // Layer 2: Per-source cache (settings per source file)
    perSourceCache = new Map();
    // Layer 3: Parse file cache (raw parsed content)
    parseFileCache = new Map();
    // Cache TTL in milliseconds
    ttl = 5 * 60 * 1000; // 5 minutes default
    // Max cache entries per layer
    maxEntries = 100;
    /**
     * Get from session cache (top layer)
     * Returns undefined if not cached or expired
     */
    getSession() {
        if (!this.sessionCache)
            return undefined;
        if (Date.now() - this.sessionCache.timestamp > this.ttl) {
            this.sessionCache = null;
            return undefined;
        }
        return this.sessionCache.value;
    }
    /**
     * Set session cache
     */
    setSession(value, source) {
        this.sessionCache = {
            value,
            timestamp: Date.now(),
            source
        };
    }
    /**
     * Get from per-source cache
     */
    getPerSource(sourcePath) {
        const entry = this.perSourceCache.get(sourcePath);
        if (!entry)
            return undefined;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.perSourceCache.delete(sourcePath);
            return undefined;
        }
        return entry.value;
    }
    /**
     * Set per-source cache
     */
    setPerSource(sourcePath, value) {
        this.evictIfNeeded(this.perSourceCache);
        this.perSourceCache.set(sourcePath, {
            value,
            timestamp: Date.now(),
            source: sourcePath
        });
    }
    /**
     * Get from parse file cache
     * Returns cached raw content or parsed value
     */
    getParseFile(filePath) {
        const entry = this.parseFileCache.get(filePath);
        if (!entry)
            return undefined;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.parseFileCache.delete(filePath);
            return undefined;
        }
        return entry.value;
    }
    /**
     * Set parse file cache
     */
    setParseFile(filePath, value) {
        this.evictIfNeeded(this.parseFileCache);
        this.parseFileCache.set(filePath, {
            value,
            timestamp: Date.now(),
            source: filePath
        });
    }
    /**
     * Invalidate all caches
     */
    invalidateAll() {
        this.sessionCache = null;
        this.perSourceCache.clear();
        this.parseFileCache.clear();
    }
    /**
     * Invalidate specific source
     */
    invalidateSource(sourcePath) {
        // Invalidate session if it came from this source
        if (this.sessionCache?.source === sourcePath) {
            this.sessionCache = null;
        }
        this.perSourceCache.delete(sourcePath);
        this.parseFileCache.delete(sourcePath);
    }
    /**
     * Evict oldest entries if cache exceeds max size
     */
    evictIfNeeded(cache) {
        if (cache.size < this.maxEntries)
            return;
        // Find oldest entry
        let oldestKey = null;
        let oldestTime = Infinity;
        for (const [key, entry] of cache) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            cache.delete(oldestKey);
        }
    }
    /**
     * Set TTL for all caches
     */
    setTTL(ms) {
        this.ttl = ms;
    }
    /**
     * Set max entries per cache layer
     */
    setMaxEntries(count) {
        this.maxEntries = count;
    }
    /**
     * Get cache statistics
     */
    getStats() {
        return {
            sessionCached: this.sessionCache !== null,
            perSourceCount: this.perSourceCache.size,
            parseFileCount: this.parseFileCache.size,
            ttl: this.ttl
        };
    }
    /**
     * Reset all caches (for testing)
     */
    _reset() {
        this.invalidateAll();
        this.ttl = 5 * 60 * 1000;
        this.maxEntries = 100;
    }
}
// Global singleton
export const settingsCache = new ThreeTierSettingsCache();
export default settingsCache;
//# sourceMappingURL=settings-cache.js.map