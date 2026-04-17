// @ts-nocheck
class BufferedWriter {
    buffer = [];
    bufferSize = 0;
    lastFlushTime = Date.now();
    flushIntervalId = null;
    config = {
        bufferSize: 64 * 1024, // 64KB
        flushIntervalMs: 5000, // 5 seconds
        maxRetries: 3,
        retryDelayMs: 100
    };
    writer = async () => {
        // Default writer: console
        console.log('[BufferedWriter] Would write:', this.buffer.length, 'chunks');
    };
    /**
     * Set writer function
     */
    setWriter(fn) {
        this.writer = fn;
    }
    /**
     * Write data to buffer
     */
    async write(data) {
        this.buffer.push(data);
        this.bufferSize += data.length;
        // Check if buffer threshold exceeded
        if (this.bufferSize >= this.config.bufferSize) {
            await this.flush();
        }
    }
    /**
     * Flush buffer to writer
     */
    async flush() {
        if (this.buffer.length === 0)
            return;
        const data = this.buffer.join('');
        this.buffer = [];
        this.bufferSize = 0;
        this.lastFlushTime = Date.now();
        // Write with retry
        await this.writeWithRetry(data);
    }
    /**
     * Write with retry on error
     */
    async writeWithRetry(data) {
        let retries = 0;
        while (retries < this.config.maxRetries) {
            try {
                await this.writer(data);
                return;
            }
            catch (e) {
                retries++;
                console.warn(`[BufferedWriter] Write failed (attempt ${retries}):`, e);
                if (retries < this.config.maxRetries) {
                    await this.sleep(this.config.retryDelayMs * retries); // Exponential backoff
                }
            }
        }
        // Final failure: save to recovery file
        console.error('[BufferedWriter] All retries failed, saving to recovery');
        await this.saveToRecovery(data);
    }
    /**
     * Save to recovery file on failure
     */
    async saveToRecovery(data) {
        // Would save to disk
        // For demo, just log
        console.error('[BufferedWriter] Recovery data length:', data.length);
    }
    /**
     * Start auto-flush interval
     */
    startAutoFlush() {
        if (this.flushIntervalId)
            return;
        this.flushIntervalId = setInterval(async () => {
            if (Date.now() - this.lastFlushTime >= this.config.flushIntervalMs) {
                await this.flush();
            }
        }, this.config.flushIntervalMs);
        // Unref to not block exit
        if (typeof this.flushIntervalId.unref === 'function') {
            this.flushIntervalId.unref();
        }
    }
    /**
     * Stop auto-flush
     */
    stopAutoFlush() {
        if (this.flushIntervalId) {
            clearInterval(this.flushIntervalId);
            this.flushIntervalId = null;
        }
    }
    /**
     * Get buffer stats
     */
    getStats() {
        return {
            bufferLength: this.buffer.length,
            bufferSize: this.bufferSize,
            lastFlushTime: this.lastFlushTime,
            pendingChunks: this.buffer.length
        };
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.stopAutoFlush();
        this.buffer = [];
        this.bufferSize = 0;
        this.lastFlushTime = Date.now();
    }
}
// Global singleton
export const bufferedWriter = new BufferedWriter();
export default bufferedWriter;
//# sourceMappingURL=buffered-writer.js.map