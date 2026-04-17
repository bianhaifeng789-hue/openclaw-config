// @ts-nocheck
class OTelEventLogging {
    eventSequence = 0;
    events = [];
    promptIdMap = new Map();
    config = {
        maxEvents: 10000,
        redactPatterns: ['api_key', 'secret', 'password', 'token'],
        outputPath: 'logs/events.jsonl'
    };
    /**
     * Log event with auto-increment sequence
     */
    logEvent(eventName, attributes, promptId) {
        const sequence = ++this.eventSequence;
        // Redact sensitive attributes
        const redactedAttributes = this.redactAttributes(attributes);
        const event = {
            eventSequence: sequence,
            eventName,
            timestamp: Date.now(),
            promptId,
            sessionId: this.getCurrentSessionId(),
            attributes: redactedAttributes,
            redacted: this.hasRedactedFields(attributes)
        };
        // Ensure capacity
        this.ensureCapacity();
        this.events.push(event);
        // Track by prompt ID
        if (promptId) {
            const promptEvents = this.promptIdMap.get(promptId) ?? [];
            promptEvents.push(event);
            this.promptIdMap.set(promptId, promptEvents);
        }
        return sequence;
    }
    /**
     * Get events by prompt ID (correlation)
     */
    getEventsByPromptId(promptId) {
        return this.promptIdMap.get(promptId) ?? [];
    }
    /**
     * Get all events
     */
    getAllEvents() {
        return [...this.events];
    }
    /**
     * Get current session ID
     */
    getCurrentSessionId() {
        // Would integrate with session system
        return `session-${Date.now()}`;
    }
    /**
     * Redact sensitive attributes
     */
    redactAttributes(attributes) {
        const result = {};
        for (const [key, value] of Object.entries(attributes)) {
            if (this.shouldRedact(key)) {
                result[key] = '[REDACTED]';
            }
            else {
                result[key] = value;
            }
        }
        return result;
    }
    /**
     * Check if field should be redacted
     */
    shouldRedact(key) {
        return this.config.redactPatterns.some(p => key.toLowerCase().includes(p));
    }
    /**
     * Check if any field was redacted
     */
    hasRedactedFields(attributes) {
        for (const key of Object.keys(attributes)) {
            if (this.shouldRedact(key))
                return true;
        }
        return false;
    }
    /**
     * Ensure capacity (evict oldest if exceeding max)
     */
    ensureCapacity() {
        if (this.events.length >= this.config.maxEvents) {
            const evictCount = Math.floor(this.config.maxEvents * 0.1);
            this.events = this.events.slice(evictCount);
        }
    }
    /**
     * Export to JSONL
     */
    exportJSONL() {
        return this.events.map(e => JSON.stringify(e)).join('\n');
    }
    /**
     * Get event sequence counter
     */
    getEventSequence() {
        return this.eventSequence;
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            eventCount: this.events.length,
            maxEvents: this.config.maxEvents,
            promptIdCount: this.promptIdMap.size,
            sequence: this.eventSequence
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
        this.eventSequence = 0;
        this.events = [];
        this.promptIdMap.clear();
    }
}
// Global singleton
export const otelEventLogging = new OTelEventLogging();
export default otelEventLogging;
//# sourceMappingURL=otel-event-logging.js.map