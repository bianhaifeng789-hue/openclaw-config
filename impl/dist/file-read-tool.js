// @ts-nocheck
class FileReadTool {
    cache = new Map();
    reads = [];
    cacheTTL = 60000; // 1 minute
    maxFileSize = 1024 * 1024; // 1MB
    /**
     * Read file
     */
    read(filePath, useCache) {
        const cached = useCache !== false ? this.getCached(filePath) : null;
        if (cached) {
            return {
                filePath,
                content: cached.content,
                lines: cached.content.split('\n').length,
                bytes: cached.content.length,
                cached: true,
                timestamp: cached.timestamp
            };
        }
        // Would read actual file
        // For demo, simulate
        const content = `Simulated content from ${filePath}`;
        // Cache result
        this.setCache(filePath, content);
        const result = {
            filePath,
            content,
            lines: content.split('\n').length,
            bytes: content.length,
            cached: false,
            timestamp: Date.now()
        };
        this.reads.push(result);
        return result;
    }
    /**
     * Read lines
     */
    readLines(filePath, start, end) {
        const result = this.read(filePath);
        const lines = result.content.split('\n');
        return lines.slice(start, end).join('\n');
    }
    /**
     * Read with limit
     */
    readWithLimit(filePath, maxBytes) {
        const result = this.read(filePath);
        return result.content.slice(0, maxBytes);
    }
    /**
     * Get cached
     */
    getCached(filePath) {
        const cached = this.cache.get(filePath);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.cache.delete(filePath);
            return null;
        }
        return cached;
    }
    /**
     * Set cache
     */
    setCache(filePath, content) {
        this.cache.set(filePath, {
            content,
            timestamp: Date.now()
        });
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get reads
     */
    getReads() {
        return [...this.reads];
    }
    /**
     * Get recent reads
     */
    getRecent(count = 10) {
        return this.reads.slice(-count);
    }
    /**
     * Set cache TTL
     */
    setCacheTTL(ms) {
        this.cacheTTL = ms;
    }
    /**
     * Set max file size
     */
    setMaxFileSize(bytes) {
        this.maxFileSize = bytes;
    }
    /**
     * Get stats
     */
    getStats() {
        const cachedReads = this.reads.filter(r => r.cached);
        const avgBytes = this.reads.length > 0
            ? this.reads.reduce((sum, r) => sum + r.bytes, 0) / this.reads.length
            : 0;
        return {
            readsCount: this.reads.length,
            cachedReads: cachedReads.length,
            cacheSize: this.cache.size,
            averageBytes: avgBytes
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearCache();
        this.reads = [];
        this.cacheTTL = 60000;
        this.maxFileSize = 1024 * 1024;
    }
}
// Global singleton
export const fileReadTool = new FileReadTool();
export default fileReadTool;
//# sourceMappingURL=file-read-tool.js.map