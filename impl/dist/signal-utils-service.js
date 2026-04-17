// @ts-nocheck
class SignalUtilsService {
    handlers = new Map();
    /**
     * Register handler
     */
    register(signal, handler) {
        const entry = {
            signal,
            handler,
            registeredAt: Date.now(),
            triggeredCount: 0
        };
        const handlers = this.handlers.get(signal) ?? [];
        handlers.push(entry);
        this.handlers.set(signal, handlers);
        return entry;
    }
    /**
     * Trigger signal
     */
    trigger(signal) {
        const handlers = this.handlers.get(signal) ?? [];
        for (const handler of handlers) {
            handler.handler();
            handler.triggeredCount++;
        }
        return handlers.length;
    }
    /**
     * Unregister handler
     */
    unregister(signal) {
        const count = this.handlers.get(signal)?.length ?? 0;
        this.handlers.delete(signal);
        return count;
    }
    /**
     * Get handlers
     */
    getHandlers(signal) {
        if (signal) {
            return this.handlers.get(signal) ?? [];
        }
        return Array.from(this.handlers.values()).flat();
    }
    /**
     * Get registered signals
     */
    getRegisteredSignals() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Get stats
     */
    getStats() {
        const bySignal = {};
        let totalTriggered = 0;
        for (const [signal, handlers] of this.handlers) {
            bySignal[signal] = handlers.length;
            totalTriggered += handlers.reduce((sum, h) => sum + h.triggeredCount, 0);
        }
        const handlersCount = Array.from(this.handlers.values()).reduce((sum, h) => sum + h.length, 0);
        return {
            signalsCount: this.handlers.size,
            handlersCount: handlersCount,
            totalTriggered: totalTriggered,
            bySignal
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.handlers.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const signalUtilsService = new SignalUtilsService();
export default signalUtilsService;
//# sourceMappingURL=signal-utils-service.js.map