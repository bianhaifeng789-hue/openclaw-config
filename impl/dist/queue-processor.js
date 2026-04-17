// @ts-nocheck
class QueueProcessor {
    queue = [];
    processing = new Map();
    completed = [];
    failed = [];
    itemCounter = 0;
    isProcessing = false;
    config = {
        maxConcurrent: 5,
        maxQueueSize: 100,
        retryLimit: 3,
        retryDelayMs: 1000
    };
    processor = async () => { };
    /**
     * Set processor function
     */
    setProcessor(fn) {
        this.processor = fn;
    }
    /**
     * Enqueue item
     */
    enqueue(data, priority = 0) {
        if (this.queue.length >= this.config.maxQueueSize) {
            throw new Error('Queue full');
        }
        const id = `item-${++this.itemCounter}`;
        const item = {
            id,
            data,
            priority,
            enqueuedAt: Date.now(),
            attempts: 0,
            status: 'pending'
        };
        this.queue.push(item);
        this.sortQueue();
        // Start processing if not already
        if (!this.isProcessing) {
            this.startProcessing();
        }
        return id;
    }
    /**
     * Sort queue by priority (higher first)
     */
    sortQueue() {
        this.queue.sort((a, b) => b.priority - a.priority);
    }
    /**
     * Start processing queue
     */
    async startProcessing() {
        this.isProcessing = true;
        while (this.queue.length > 0 || this.processing.size > 0) {
            // Fill up to maxConcurrent
            while (this.processing.size < this.config.maxConcurrent && this.queue.length > 0) {
                const item = this.queue.shift();
                if (item) {
                    this.processItem(item);
                }
            }
            // Wait for any processing to complete
            await this.sleep(100);
        }
        this.isProcessing = false;
    }
    /**
     * Process single item
     */
    async processItem(item) {
        item.status = 'processing';
        item.attempts++;
        this.processing.set(item.id, item);
        try {
            await this.processor(item.data);
            item.status = 'completed';
            this.completed.push(item);
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            item.error = error;
            if (item.attempts < this.config.retryLimit) {
                // Retry
                item.status = 'pending';
                await this.sleep(this.config.retryDelayMs * item.attempts);
                this.queue.push(item);
                this.sortQueue();
            }
            else {
                // Failed
                item.status = 'failed';
                this.failed.push(item);
            }
        }
        this.processing.delete(item.id);
    }
    /**
     * Get queue stats
     */
    getStats() {
        return {
            queued: this.queue.length,
            processing: this.processing.size,
            completed: this.completed.length,
            failed: this.failed.length,
            totalProcessed: this.completed.length + this.failed.length
        };
    }
    /**
     * Get item by ID
     */
    getItem(id) {
        return this.queue.find(i => i.id === id) ?? this.processing.get(id) ??
            this.completed.find(i => i.id === id) ?? this.failed.find(i => i.id === id);
    }
    /**
     * Drain queue (wait for all to complete)
     */
    async drain() {
        while (this.queue.length > 0 || this.processing.size > 0) {
            await this.sleep(100);
        }
    }
    /**
     * Clear queue
     */
    clear() {
        this.queue = [];
        this.processing.clear();
    }
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        this.queue = [];
        this.processing.clear();
        this.completed = [];
        this.failed = [];
        this.itemCounter = 0;
        this.isProcessing = false;
    }
}
// Export factory
export function createQueueProcessor(config) {
    const queue = new QueueProcessor();
    if (config)
        queue.setConfig(config);
    return queue;
}
export default QueueProcessor;
//# sourceMappingURL=queue-processor.js.map