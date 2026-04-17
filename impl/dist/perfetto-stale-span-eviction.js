// @ts-nocheck
class PerfettoStaleSpanEviction {
    strongSpans = new Map();
    cleanupIntervalId = null;
    cleanupIntervalStarted = false;
    config = {
        ttlMs: 30 * 60 * 1000, // 30 minutes
        cleanupIntervalMs: 60 * 1000, // 1 minute
        maxStrongSpans: 1000
    };
    /**
     * Register span for TTL tracking
     */
    registerSpan(spanId, events) {
        this.ensureCleanupInterval();
        const entry = {
            spanId,
            startTime: Date.now(),
            events,
            weakRef: new WeakRef(events)
        };
        // Evict if exceeding max
        if (this.strongSpans.size >= this.config.maxStrongSpans) {
            this.evictOldest();
        }
        this.strongSpans.set(spanId, entry);
    }
    /**
     * Get span events (from strong or weak ref)
     */
    getSpanEvents(spanId) {
        const entry = this.strongSpans.get(spanId);
        if (!entry)
            return undefined;
        // Check TTL
        if (Date.now() - entry.startTime > this.config.ttlMs) {
            this.strongSpans.delete(spanId);
            return undefined;
        }
        return entry.events;
    }
    /**
     * Ensure cleanup interval is running
     */
    ensureCleanupInterval() {
        if (this.cleanupIntervalStarted)
            return;
        this.cleanupIntervalStarted = true;
        this.cleanupIntervalId = setInterval(() => {
            this.evictStaleSpans();
        }, this.config.cleanupIntervalMs);
        // Unref to not block exit
        if (typeof this.cleanupIntervalId.unref === 'function') {
            this.cleanupIntervalId.unref();
        }
    }
    /**
     * Evict stale spans (TTL expired)
     */
    evictStaleSpans() {
        const cutoff = Date.now() - this.config.ttlMs;
        let evicted = 0;
        for (const [spanId, entry] of this.strongSpans) {
            if (entry.startTime < cutoff) {
                this.strongSpans.delete(spanId);
                evicted++;
            }
            else {
                // Check if weakRef was GC'd
                if (entry.weakRef?.deref() === undefined) {
                    this.strongSpans.delete(spanId);
                    evicted++;
                }
            }
        }
        if (evicted > 0) {
            console.log(`[PerfettoEviction] Evicted ${evicted} stale spans`);
        }
    }
    /**
     * Evict oldest span
     */
    evictOldest() {
        let oldestId = null;
        let oldestTime = Infinity;
        for (const [spanId, entry] of this.strongSpans) {
            if (entry.startTime < oldestTime) {
                oldestTime = entry.startTime;
                oldestId = spanId;
            }
        }
        if (oldestId) {
            this.strongSpans.delete(oldestId);
        }
    }
    /**
     * Get strong spans count
     */
    getStrongCount() {
        return this.strongSpans.size;
    }
    /**
     * Get config
     */
    getConfig() {
        return { ...this.config };
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
        if (this.cleanupIntervalId) {
            clearInterval(this.cleanupIntervalId);
            this.cleanupIntervalId = null;
        }
        this.cleanupIntervalStarted = false;
        this.strongSpans.clear();
    }
}
// Global singleton
export const perfettoStaleSpanEviction = new PerfettoStaleSpanEviction();
export default perfettoStaleSpanEviction;
//# sourceMappingURL=perfetto-stale-span-eviction.js.map