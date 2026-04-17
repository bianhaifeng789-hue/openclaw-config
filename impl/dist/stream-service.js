// @ts-nocheck
class StreamService {
    chunks = [];
    chunkCounter = 0;
    listeners = new Set();
    /**
     * Write chunk
     */
    write(data) {
        const chunk = {
            id: `chunk-${++this.chunkCounter}-${Date.now()}`,
            data,
            index: this.chunks.length,
            timestamp: Date.now()
        };
        this.chunks.push(chunk);
        this.notifyListeners(chunk);
        return chunk;
    }
    /**
     * Read chunks
     */
    read(start, end) {
        if (start === undefined && end === undefined) {
            return [...this.chunks];
        }
        return this.chunks.slice(start ?? 0, end);
    }
    /**
     * Read all as string
     */
    readAll() {
        return this.chunks.map(c => c.data).join('');
    }
    /**
     * Subscribe
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Notify listeners
     */
    notifyListeners(chunk) {
        for (const listener of this.listeners) {
            listener(chunk);
        }
    }
    /**
     * Get chunk count
     */
    getChunkCount() {
        return this.chunks.length;
    }
    /**
     * Get total size
     */
    getTotalSize() {
        return this.chunks.reduce((sum, c) => sum + c.data.length, 0);
    }
    /**
     * Get stats
     */
    getStats() {
        const avgChunkSize = this.chunks.length > 0
            ? this.chunks.reduce((sum, c) => sum + c.data.length, 0) / this.chunks.length
            : 0;
        return {
            chunksCount: this.chunks.length,
            totalSize: this.getTotalSize(),
            averageChunkSize: avgChunkSize,
            listenersCount: this.listeners.size
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.chunks = [];
        this.chunkCounter = 0;
        this.listeners.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const streamService = new StreamService();
export default streamService;
//# sourceMappingURL=stream-service.js.map