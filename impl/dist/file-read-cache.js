// @ts-nocheck
class FileReadCache {
    contentCache = new Map();
    statCache = new Map();
    config = {
        maxSize: 50, // Max files cached
        maxContentSize: 1024 * 1024, // 1MB max file size to cache
        ttlMs: 10 * 60 * 1000 // 10 minutes
    };
    readFile = async () => '';
    statFile = async () => ({ mtime: 0, size: 0 });
    /**
     * Set file reader functions
     */
    setReaders(readFn, statFn) {
        this.readFile = readFn;
        this.statFile = statFn;
    }
    /**
     * Read file with cache
     */
    async read(path) {
        // Check if cached
        const cached = this.contentCache.get(path);
        if (cached) {
            // Check TTL
            if (Date.now() - cached.readAt > this.config.ttlMs) {
                this.contentCache.delete(path);
                this.statCache.delete(path);
            }
            else {
                // Check mtime
                const stat = await this.statFile(path);
                if (stat.mtime === cached.mtime) {
                    // Cache valid
                    cached.hits++;
                    return cached.content;
                }
                // mtime changed: invalidate
                this.contentCache.delete(path);
            }
        }
        // Read fresh
        const content = await this.readFile(path);
        const stat = await this.statFile(path);
        // Cache if within size limit
        if (stat.size <= this.config.maxContentSize) {
            this.ensureCapacity();
            this.contentCache.set(path, {
                content,
                mtime: stat.mtime,
                size: stat.size,
                readAt: Date.now(),
                hits: 0
            });
            this.statCache.set(path, stat);
        }
        return content;
    }
    /**
     * Invalidate file cache
     */
    invalidate(path) {
        this.contentCache.delete(path);
        this.statCache.delete(path);
    }
    /**
     * Invalidate all caches
     */
    invalidateAll() {
        this.contentCache.clear();
        this.statCache.clear();
    }
    /**
     * Invalidate by pattern
     */
    invalidatePattern(pattern) {
        let count = 0;
        for (const path of this.contentCache.keys()) {
            if (path.includes(pattern)) {
                this.contentCache.delete(path);
                this.statCache.delete(path);
                count++;
            }
        }
        return count;
    }
    /**
     * Ensure capacity
     */
    ensureCapacity() {
        if (this.contentCache.size >= this.config.maxSize) {
            // Evict lowest-hit entry
            let lowestKey = null;
            let lowestHits = Infinity;
            for (const [key, entry] of this.contentCache) {
                if (entry.hits < lowestHits) {
                    lowestHits = entry.hits;
                    lowestKey = key;
                }
            }
            if (lowestKey) {
                this.contentCache.delete(lowestKey);
                this.statCache.delete(lowestKey);
            }
        }
    }
    /**
     * Get stats
     */
    getStats() {
        let totalHits = 0;
        for (const entry of this.contentCache.values()) {
            totalHits += entry.hits;
        }
        return {
            contentCacheSize: this.contentCache.size,
            statCacheSize: this.statCache.size,
            totalHits,
            maxSize: this.config.maxSize
        };
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.contentCache.clear();
        this.statCache.clear();
    }
}
// Global singleton
export const fileReadCache = new FileReadCache();
export default fileReadCache;
//# sourceMappingURL=file-read-cache.js.map