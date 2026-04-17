// @ts-nocheck
class SlowOperationsDetector {
    operations = [];
    thresholds = new Map();
    operationCounter = 0;
    config = {
        defaultThresholdMs: 1000,
        maxOperations: 100,
        logEnabled: true
    };
    /**
     * Set threshold
     */
    setThreshold(operationName, thresholdMs) {
        this.thresholds.set(operationName, thresholdMs);
    }
    /**
     * Check operation
     */
    check(operationName, durationMs, metadata) {
        const threshold = this.thresholds.get(operationName) ?? this.config.defaultThresholdMs;
        if (durationMs < threshold)
            return null;
        const operation = {
            id: `slow-${++this.operationCounter}`,
            name: operationName,
            durationMs,
            thresholdMs: threshold,
            metadata,
            timestamp: Date.now()
        };
        this.operations.push(operation);
        // Trim history
        while (this.operations.length > this.config.maxOperations) {
            this.operations.shift();
        }
        // Log if enabled
        if (this.config.logEnabled) {
            console.warn(`[SlowOp] ${operationName} took ${durationMs}ms (threshold: ${threshold}ms)`);
        }
        return operation;
    }
    /**
     * Track operation
     */
    async track(operationName, fn) {
        const startTime = Date.now();
        const result = await fn();
        const durationMs = Date.now() - startTime;
        const slowOp = this.check(operationName, durationMs);
        return {
            result,
            durationMs,
            slow: slowOp !== null
        };
    }
    /**
     * Get slow operations
     */
    getSlowOperations() {
        return [...this.operations];
    }
    /**
     * Get slow operations by name
     */
    getByOperation(name) {
        return this.operations.filter(o => o.name === name);
    }
    /**
     * Get slowest operations
     */
    getSlowest(count = 10) {
        return this.operations
            .sort((a, b) => b.durationMs - a.durationMs)
            .slice(0, count);
    }
    /**
     * Get threshold
     */
    getThreshold(operationName) {
        return this.thresholds.get(operationName) ?? this.config.defaultThresholdMs;
    }
    /**
     * Get stats
     */
    getStats() {
        const slowest = this.operations.length > 0
            ? this.operations.reduce((max, o) => o.durationMs > max.durationMs ? o : max).name
            : null;
        const avg = this.operations.length > 0
            ? this.operations.reduce((sum, o) => sum + o.durationMs, 0) / this.operations.length
            : 0;
        const thresholds = {};
        for (const [name, threshold] of this.thresholds) {
            thresholds[name] = threshold;
        }
        return {
            totalSlow: this.operations.length,
            slowestOperation: slowest,
            averageDuration: avg,
            thresholds
        };
    }
    /**
     * Clear operations
     */
    clear() {
        this.operations = [];
        this.operationCounter = 0;
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
        this.clear();
        this.thresholds.clear();
        this.config = {
            defaultThresholdMs: 1000,
            maxOperations: 100,
            logEnabled: true
        };
    }
}
// Global singleton
export const slowOperationsDetector = new SlowOperationsDetector();
// Set default thresholds
slowOperationsDetector.setThreshold('file_read', 500);
slowOperationsDetector.setThreshold('file_write', 500);
slowOperationsDetector.setThreshold('api_call', 2000);
slowOperationsDetector.setThreshold('llm_request', 10000);
export default slowOperationsDetector;
//# sourceMappingURL=slow-operations-detector.js.map