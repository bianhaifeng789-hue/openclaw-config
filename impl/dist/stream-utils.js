// @ts-nocheck
class StreamUtils {
    config = {
        chunkSize: 1024,
        maxBuffer: 1024 * 1024, // 1MB
        timeoutMs: 30000 // 30 seconds
    };
    /**
     * Chunk async iterator into fixed-size chunks
     */
    async *chunkIterator(iter, chunkSize) {
        let chunk = [];
        for await (const item of iter) {
            chunk.push(item);
            if (chunk.length >= chunkSize) {
                yield chunk;
                chunk = [];
            }
        }
        if (chunk.length > 0) {
            yield chunk;
        }
    }
    /**
     * Buffer stream with backpressure
     */
    async bufferStream(iter, maxBuffer) {
        const buffer = [];
        for await (const item of iter) {
            if (buffer.length >= maxBuffer) {
                // Backpressure: wait for consumer
                await this.wait(1);
            }
            buffer.push(item);
        }
        return buffer;
    }
    /**
     * Error recovery stream
     */
    async *errorRecoveryStream(iter, onError, maxRetries = 3) {
        let retries = 0;
        try {
            for await (const item of iter) {
                retries = 0; // Reset on success
                yield item;
            }
        }
        catch (e) {
            retries++;
            if (retries < maxRetries) {
                const recoveryItem = onError(e instanceof Error ? e : new Error(String(e)));
                if (recoveryItem !== null) {
                    yield recoveryItem;
                }
                // Continue iteration
            }
            else {
                throw e;
            }
        }
    }
    /**
     * Timeout stream
     */
    async *timeoutStream(iter, timeoutMs) {
        const timeoutPromise = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('Stream timeout')), ms));
        for await (const item of iter) {
            try {
                await Promise.race([
                    Promise.resolve(item),
                    timeoutPromise(timeoutMs)
                ]);
                yield item;
            }
            catch (e) {
                if (e instanceof Error && e.message === 'Stream timeout') {
                    throw e;
                }
                throw e;
            }
        }
    }
    /**
     * Merge multiple streams
     */
    async *mergeStreams(streams) {
        const iterators = streams.map(s => s[Symbol.asyncIterator]());
        const pending = new Set(iterators);
        while (pending.size > 0) {
            for (const iter of pending) {
                try {
                    const result = await iter.next();
                    if (result.done) {
                        pending.delete(iter);
                    }
                    else {
                        yield result.value;
                    }
                }
                catch (e) {
                    pending.delete(iter);
                    console.warn('[StreamUtils] Iterator error:', e);
                }
            }
        }
    }
    /**
     * Collect stream to array
     */
    async collectStream(iter) {
        const result = [];
        for await (const item of iter) {
            result.push(item);
        }
        return result;
    }
    /**
     * Map stream
     */
    async *mapStream(iter, fn) {
        for await (const item of iter) {
            yield await fn(item);
        }
    }
    /**
     * Filter stream
     */
    async *filterStream(iter, fn) {
        for await (const item of iter) {
            if (await fn(item)) {
                yield item;
            }
        }
    }
    /**
     * Take first N items
     */
    async *takeStream(iter, count) {
        let taken = 0;
        for await (const item of iter) {
            if (taken >= count)
                break;
            yield item;
            taken++;
        }
    }
    /**
     * Wait helper
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get config
     */
    getConfig() {
        return { ...this.config };
    }
}
// Global singleton
export const streamUtils = new StreamUtils();
export default streamUtils;
//# sourceMappingURL=stream-utils.js.map