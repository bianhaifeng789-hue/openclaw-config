// @ts-nocheck
class ToolResultStorageService {
    storage = new Map();
    resultCounter = 0;
    maxSize = 100;
    /**
     * Store result
     */
    store(toolName, result) {
        const id = `result-${++this.resultCounter}-${Date.now()}`;
        const stored = {
            id,
            toolName,
            result,
            storedAt: Date.now(),
            accessedAt: Date.now(),
            accessCount: 0
        };
        // Evict oldest if over max size
        if (this.storage.size >= this.maxSize) {
            const oldest = Array.from(this.storage.values())
                .sort((a, b) => a.accessedAt - b.accessedAt)[0];
            if (oldest)
                this.storage.delete(oldest.id);
        }
        this.storage.set(id, stored);
        return stored;
    }
    /**
     * Get result
     */
    get(id) {
        const stored = this.storage.get(id);
        if (stored) {
            stored.accessedAt = Date.now();
            stored.accessCount++;
        }
        return stored;
    }
    /**
     * Get by tool
     */
    getByTool(toolName) {
        return Array.from(this.storage.values())
            .filter(s => s.toolName === toolName);
    }
    /**
     * Get recent
     */
    getRecent(count = 10) {
        return Array.from(this.storage.values())
            .sort((a, b) => b.storedAt - a.storedAt)
            .slice(0, count);
    }
    /**
     * Delete result
     */
    delete(id) {
        return this.storage.delete(id);
    }
    /**
     * Clear by tool
     */
    clearByTool(toolName) {
        const toDelete = this.getByTool(toolName);
        for (const stored of toDelete) {
            this.storage.delete(stored.id);
        }
        return toDelete.length;
    }
    /**
     * Get stats
     */
    getStats() {
        const byTool = {};
        const totalAccess = Array.from(this.storage.values())
            .reduce((sum, s) => sum + s.accessCount, 0);
        for (const stored of this.storage.values()) {
            byTool[stored.toolName] = (byTool[stored.toolName] ?? 0) + 1;
        }
        return {
            storageCount: this.storage.size,
            maxSize: this.maxSize,
            totalAccessCount: totalAccess,
            byTool
        };
    }
    /**
     * Set max size
     */
    setMaxSize(size) {
        this.maxSize = size;
    }
    /**
     * Clear all
     */
    clear() {
        this.storage.clear();
        this.resultCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.maxSize = 100;
    }
}
// Global singleton
export const toolResultStorageService = new ToolResultStorageService();
export default toolResultStorageService;
//# sourceMappingURL=tool-result-storage-service.js.map