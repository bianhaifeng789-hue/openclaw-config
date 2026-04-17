// @ts-nocheck
class ReadMCPResourceTool {
    reads = [];
    cache = new Map();
    /**
     * Read resource
     */
    read(uri, serverId) {
        const cached = this.getCached(uri);
        if (cached) {
            return {
                uri,
                serverId,
                content: cached.content,
                mimeType: 'cached',
                size: cached.content.length,
                timestamp: cached.timestamp
            };
        }
        // Would read from actual MCP server
        // For demo, simulate
        const content = `Resource content from ${uri}`;
        this.setCache(uri, content);
        const read = {
            uri,
            serverId,
            content,
            mimeType: 'text/plain',
            size: content.length,
            timestamp: Date.now()
        };
        this.reads.push(read);
        return read;
    }
    /**
     * Get cached
     */
    getCached(uri) {
        const cached = this.cache.get(uri);
        if (!cached)
            return null;
        if (Date.now() - cached.timestamp > 60000) {
            this.cache.delete(uri);
            return null;
        }
        return cached;
    }
    /**
     * Set cache
     */
    setCache(uri, content) {
        this.cache.set(uri, {
            content,
            timestamp: Date.now()
        });
    }
    /**
     * Get reads
     */
    getReads() {
        return [...this.reads];
    }
    /**
     * Get reads by server
     */
    getByServer(serverId) {
        return this.reads.filter(r => r.serverId === serverId);
    }
    /**
     * Get recent reads
     */
    getRecent(count = 10) {
        return this.reads.slice(-count);
    }
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get stats
     */
    getStats() {
        const totalSize = this.reads.reduce((sum, r) => sum + r.size, 0);
        const avgSize = this.reads.length > 0 ? totalSize / this.reads.length : 0;
        return {
            readsCount: this.reads.length,
            cachedCount: this.cache.size,
            totalSize: totalSize,
            averageSize: avgSize
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.reads = [];
        this.clearCache();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const readMCPResourceTool = new ReadMCPResourceTool();
export default readMCPResourceTool;
//# sourceMappingURL=read-mcp-resource-tool.js.map