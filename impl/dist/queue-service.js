// @ts-nocheck
class QueueService {
    queue = [];
    processing = [];
    completed = [];
    failed = [];
    itemCounter = 0;
    maxConcurrent = 1;
    /**
     * Add item
     */
    add(data, priority) {
        const item = {
            id: `queue-${++this.itemCounter}-${Date.now()}`,
            data,
            priority: priority ?? 0,
            status: 'pending',
            addedAt: Date.now()
        };
        this.queue.push(item);
        this.sortQueue();
        return item;
    }
    /**
     * Sort queue by priority
     */
    sortQueue() {
        this.queue.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Process next
     */
    processNext() {
        if (this.processing.length >= this.maxConcurrent)
            return undefined;
        const item = this.queue.shift();
        if (!item)
            return undefined;
        item.status = 'processing';
        this.processing.push(item);
        return item;
    }
    /**
     * Complete item
     */
    complete(id) {
        const item = this.processing.find(i => i.id === id);
        if (!item)
            return false;
        item.status = 'completed';
        item.processedAt = Date.now();
        this.processing = this.processing.filter(i => i.id !== id);
        this.completed.push(item);
        return true;
    }
    /**
     * Fail item
     */
    fail(id) {
        const item = this.processing.find(i => i.id === id);
        if (!item)
            return false;
        item.status = 'failed';
        item.processedAt = Date.now();
        this.processing = this.processing.filter(i => i.id !== id);
        this.failed.push(item);
        return true;
    }
    /**
     * Get pending
     */
    getPending() {
        return [...this.queue];
    }
    /**
     * Get processing
     */
    getProcessing() {
        return [...this.processing];
    }
    /**
     * Get completed
     */
    getCompleted() {
        return [...this.completed];
    }
    /**
     * Get failed
     */
    getFailed() {
        return [...this.failed];
    }
    /**
     * Set max concurrent
     */
    setMaxConcurrent(max) {
        this.maxConcurrent = max;
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            queueSize: this.queue.length,
            processingSize: this.processing.length,
            completedSize: this.completed.length,
            failedSize: this.failed.length,
            maxConcurrent: this.maxConcurrent
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.queue = [];
        this.processing = [];
        this.completed = [];
        this.failed = [];
        this.itemCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.maxConcurrent = 1;
    }
}
// Global singleton
export const queueService = new QueueService();
export default queueService;
//# sourceMappingURL=queue-service.js.map