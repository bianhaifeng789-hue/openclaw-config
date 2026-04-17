// @ts-nocheck
class MagicDocsTracker {
    docs = new Map();
    pendingEmbeddings = [];
    embeddingIntervalMs = 60 * 1000; // 1 minute
    staleThresholdMs = 5 * 60 * 1000; // 5 minutes
    docCounter = 0;
    /**
     * Track document
     */
    track(path, contentHash, tokenCount, metadata) {
        const existing = this.docs.get(path);
        if (existing) {
            // Check if content changed
            if (existing.contentHash !== contentHash) {
                existing.contentHash = contentHash;
                existing.lastModified = Date.now();
                existing.embeddingStatus = 'stale';
                existing.tokenCount = tokenCount;
                this.pendingEmbeddings.push(path);
            }
            return existing;
        }
        // Create new doc
        const doc = {
            id: `doc-${++this.docCounter}-${Math.random().toString(36).slice(2, 8)}`,
            path,
            contentHash,
            lastModified: Date.now(),
            lastEmbedded: 0,
            embeddingStatus: 'pending',
            tokenCount,
            metadata: metadata ?? {}
        };
        this.docs.set(path, doc);
        this.pendingEmbeddings.push(path);
        return doc;
    }
    /**
     * Mark as embedded
     */
    markEmbedded(path) {
        const doc = this.docs.get(path);
        if (!doc)
            return false;
        doc.lastEmbedded = Date.now();
        doc.embeddingStatus = 'embedded';
        // Remove from pending
        this.pendingEmbeddings = this.pendingEmbeddings.filter(p => p !== path);
        return true;
    }
    /**
     * Mark as failed
     */
    markFailed(path) {
        const doc = this.docs.get(path);
        if (!doc)
            return false;
        doc.embeddingStatus = 'failed';
        return true;
    }
    /**
     * Get pending embeddings
     */
    getPendingEmbeddings() {
        return this.pendingEmbeddings
            .map(path => this.docs.get(path))
            .filter(Boolean);
    }
    /**
     * Get stale docs
     */
    getStaleDocs() {
        const now = Date.now();
        return Array.from(this.docs.values())
            .filter(doc => {
            if (doc.embeddingStatus === 'stale')
                return true;
            if (doc.embeddingStatus === 'embedded') {
                // Check if stale threshold exceeded
                return now - doc.lastEmbedded > this.staleThresholdMs &&
                    now - doc.lastModified > this.staleThresholdMs;
            }
            return false;
        });
    }
    /**
     * Get doc by path
     */
    get(path) {
        return this.docs.get(path);
    }
    /**
     * Remove doc
     */
    remove(path) {
        const doc = this.docs.get(path);
        if (!doc)
            return false;
        this.docs.delete(path);
        this.pendingEmbeddings = this.pendingEmbeddings.filter(p => p !== path);
        return true;
    }
    /**
     * Get all docs
     */
    getAll() {
        return Array.from(this.docs.values());
    }
    /**
     * Get stats
     */
    getStats() {
        const docs = Array.from(this.docs.values());
        return {
            totalDocs: docs.length,
            pendingCount: docs.filter(d => d.embeddingStatus === 'pending').length,
            embeddedCount: docs.filter(d => d.embeddingStatus === 'embedded').length,
            failedCount: docs.filter(d => d.embeddingStatus === 'failed').length,
            staleCount: docs.filter(d => d.embeddingStatus === 'stale').length,
            totalTokens: docs.reduce((sum, d) => sum + d.tokenCount, 0)
        };
    }
    /**
     * Set stale threshold
     */
    setStaleThreshold(ms) {
        this.staleThresholdMs = ms;
    }
    /**
     * Set embedding interval
     */
    setEmbeddingInterval(ms) {
        this.embeddingIntervalMs = ms;
    }
    /**
     * Clear all docs
     */
    clear() {
        this.docs.clear();
        this.pendingEmbeddings = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.docCounter = 0;
        this.embeddingIntervalMs = 60 * 1000;
        this.staleThresholdMs = 5 * 60 * 1000;
    }
}
// Global singleton
export const magicDocsTracker = new MagicDocsTracker();
export default magicDocsTracker;
//# sourceMappingURL=magic-docs-tracker.js.map