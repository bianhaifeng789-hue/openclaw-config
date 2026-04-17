// @ts-nocheck
class PerfettoTracing {
    events = [];
    eventSequence = 0;
    config = {
        maxEvents: 100000,
        flushIntervalMs: 5000
    };
    flushIntervalId = null;
    /**
     * Start a span (BEGIN phase)
     */
    beginSpan(name, args, parentId) {
        this.ensureCapacity();
        const spanId = `span-${this.eventSequence++}`;
        const ts = Date.now() * 1000; // Convert to microseconds
        this.events.push({
            name,
            ph: 'B', // BEGIN
            ts,
            pid: 1,
            tid: process.pid,
            id: spanId,
            cat: 'agent',
            args: { ...args, parentId }
        });
        // Flow event linking to parent
        if (parentId) {
            this.events.push({
                name: 'flow',
                ph: 'f', // FLOW_END
                ts,
                pid: 1,
                id: parentId,
                cat: 'flow',
                args: { to: spanId }
            });
        }
        return spanId;
    }
    /**
     * End a span (END phase)
     */
    endSpan(spanId, args) {
        this.ensureCapacity();
        const ts = Date.now() * 1000;
        this.events.push({
            name: 'span-end',
            ph: 'E', // END
            ts,
            pid: 1,
            tid: process.pid,
            id: spanId,
            cat: 'agent',
            args
        });
    }
    /**
     * Complete event (instant with duration)
     */
    completeEvent(name, durationUs, args) {
        this.ensureCapacity();
        const ts = Date.now() * 1000 - durationUs;
        this.events.push({
            name,
            ph: 'X', // COMPLETE
            ts,
            dur: durationUs,
            pid: 1,
            tid: process.pid,
            cat: 'agent',
            args
        });
    }
    /**
     * Instant event (marker)
     */
    instantEvent(name, args) {
        this.ensureCapacity();
        this.events.push({
            name,
            ph: 'i', // INSTANT
            ts: Date.now() * 1000,
            pid: 1,
            tid: process.pid,
            cat: 'marker',
            args,
            s: 'g' // Global scope
        });
    }
    /**
     * Ensure capacity (evict oldest if exceeding MAX_EVENTS)
     */
    ensureCapacity() {
        if (this.events.length >= this.config.maxEvents) {
            // Evict 10% oldest events
            const evictCount = Math.floor(this.config.maxEvents * 0.1);
            this.events = this.events.slice(evictCount);
            console.warn(`[Perfetto] Evicted ${evictCount} events (cap reached)`);
        }
    }
    /**
     * Get events for export
     */
    getEvents() {
        return [...this.events];
    }
    /**
     * Export to Chrome Trace Event format (JSON)
     */
    export() {
        return JSON.stringify({
            traceEvents: this.events,
            metadata: {
                producerName: 'openclaw-agent',
                timestamp: Date.now()
            }
        }, null, 2);
    }
    /**
     * Clear events
     */
    clear() {
        this.events = [];
        this.eventSequence = 0;
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            eventCount: this.events.length,
            maxEvents: this.config.maxEvents,
            utilization: this.events.length / this.config.maxEvents
        };
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
        if (this.flushIntervalId) {
            clearInterval(this.flushIntervalId);
            this.flushIntervalId = null;
        }
        this.clear();
    }
}
// Global singleton
export const perfettoTracing = new PerfettoTracing();
export default perfettoTracing;
//# sourceMappingURL=perfetto-tracing.js.map