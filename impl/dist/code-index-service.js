// @ts-nocheck
class CodeIndexService {
    entries = new Map();
    pendingQueue = [];
    indexCounter = 0;
    isIndexing = false;
    config = {
        maxEntries: 10000,
        batchSize: 100,
        embeddingEnabled: true
    };
    /**
     * Add file to indexing queue
     */
    addToQueue(filePath) {
        if (!this.pendingQueue.includes(filePath)) {
            this.pendingQueue.push(filePath);
        }
    }
    /**
     * Process indexing queue
     */
    async processQueue(processFn) {
        if (this.isIndexing)
            return 0;
        this.isIndexing = true;
        let processed = 0;
        try {
            while (this.pendingQueue.length > 0) {
                const batch = this.pendingQueue.splice(0, this.config.batchSize);
                for (const path of batch) {
                    try {
                        const entry = await processFn(path);
                        this.entries.set(entry.id, entry);
                        processed++;
                    }
                    catch (e) {
                        console.warn(`[CodeIndex] Failed to index ${path}:`, e);
                    }
                }
            }
        }
        finally {
            this.isIndexing = false;
        }
        return processed;
    }
    /**
     * Search indexed code
     */
    search(query, options) {
        const results = [];
        const queryLower = query.toLowerCase();
        const maxResults = options?.maxResults ?? 10;
        for (const entry of this.entries.values()) {
            if (options?.language && entry.language !== options.language)
                continue;
            // Simple text matching (would use embedding similarity in real implementation)
            const score = this.calculateScore(entry, queryLower);
            if (score > 0) {
                results.push({
                    filePath: entry.filePath,
                    snippet: '', // Would extract relevant snippet
                    score,
                    language: entry.language
                });
            }
        }
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, maxResults);
    }
    /**
     * Calculate relevance score
     */
    calculateScore(entry, query) {
        // Would use embedding similarity
        // For demo, use simple path matching
        const pathLower = entry.filePath.toLowerCase();
        let score = 0;
        if (pathLower.includes(query))
            score += 50;
        if (pathLower.endsWith(query))
            score += 30;
        return score;
    }
    /**
     * Get entry by ID
     */
    getById(id) {
        return this.entries.get(id);
    }
    /**
     * Get entry by path
     */
    getByPath(filePath) {
        for (const entry of this.entries.values()) {
            if (entry.filePath === filePath)
                return entry;
        }
        return undefined;
    }
    /**
     * Remove entry
     */
    remove(id) {
        return this.entries.delete(id);
    }
    /**
     * Update entry
     */
    update(id, updates) {
        const entry = this.entries.get(id);
        if (!entry)
            return false;
        Object.assign(entry, updates);
        return true;
    }
    /**
     * Get queue size
     */
    getQueueSize() {
        return this.pendingQueue.length;
    }
    /**
     * Get stats
     */
    getStats() {
        const languageCounts = {};
        for (const entry of this.entries.values()) {
            languageCounts[entry.language] = (languageCounts[entry.language] ?? 0) + 1;
        }
        return {
            totalEntries: this.entries.size,
            queuedFiles: this.pendingQueue.length,
            isIndexing: this.isIndexing,
            languageCounts
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.entries.clear();
        this.pendingQueue = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.indexCounter = 0;
        this.isIndexing = false;
    }
}
// Global singleton
export const codeIndexService = new CodeIndexService();
export default codeIndexService;
//# sourceMappingURL=code-index-service.js.map