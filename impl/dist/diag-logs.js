// @ts-nocheck
class DiagLogs {
    entries = [];
    sinks = [];
    minLevel = 'info';
    maxEntries = 1000;
    levelOrder = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    /**
     * Add log sink
     */
    addSink(sink) {
        this.sinks.push(sink);
        return () => {
            this.sinks = this.sinks.filter(s => s !== sink);
        };
    }
    /**
     * Set minimum log level
     */
    setMinLevel(level) {
        this.minLevel = level;
    }
    /**
     * Log trace
     */
    trace(message, context) {
        this.log('trace', message, context);
    }
    /**
     * Log debug
     */
    debug(message, context) {
        this.log('debug', message, context);
    }
    /**
     * Log info
     */
    info(message, context) {
        this.log('info', message, context);
    }
    /**
     * Log warn
     */
    warn(message, context) {
        this.log('warn', message, context);
    }
    /**
     * Log error
     */
    error(message, error, context) {
        this.log('error', message, context, error);
    }
    /**
     * Log fatal
     */
    fatal(message, error, context) {
        this.log('fatal', message, context, error);
    }
    /**
     * Core log method
     */
    log(level, message, context, error) {
        // Check level
        if (!this.shouldLog(level))
            return;
        const entry = {
            level,
            message,
            timestamp: Date.now(),
            context,
            error
        };
        // Add to buffer
        this.entries.push(entry);
        this.ensureCapacity();
        // Send to sinks
        for (const sink of this.sinks) {
            try {
                sink(entry);
            }
            catch (e) {
                console.error('[DiagLogs] Sink error:', e);
            }
        }
    }
    /**
     * Check if level should be logged
     */
    shouldLog(level) {
        const levelIndex = this.levelOrder.indexOf(level);
        const minIndex = this.levelOrder.indexOf(this.minLevel);
        return levelIndex >= minIndex;
    }
    /**
     * Ensure buffer capacity
     */
    ensureCapacity() {
        while (this.entries.length > this.maxEntries) {
            this.entries.shift();
        }
    }
    /**
     * Get all entries
     */
    getEntries() {
        return [...this.entries];
    }
    /**
     * Get entries by level
     */
    getEntriesByLevel(level) {
        return this.entries.filter(e => e.level === level);
    }
    /**
     * Get recent entries
     */
    getRecentEntries(count) {
        return this.entries.slice(-count);
    }
    /**
     * Clear entries
     */
    clear() {
        this.entries = [];
    }
    /**
     * Get stats
     */
    getStats() {
        const byLevel = {
            trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0
        };
        for (const entry of this.entries) {
            byLevel[entry.level]++;
        }
        return { total: this.entries.length, byLevel };
    }
    /**
     * Format entry for display
     */
    formatEntry(entry) {
        const timestamp = new Date(entry.timestamp).toISOString();
        const level = entry.level.toUpperCase();
        const context = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
        const error = entry.error ? ` Error: ${entry.error.message}` : '';
        return `[${timestamp}] [${level}] ${entry.message}${context}${error}`;
    }
    /**
     * Set max entries
     */
    setMaxEntries(max) {
        this.maxEntries = max;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.entries = [];
        this.sinks = [];
        this.minLevel = 'info';
    }
}
// Global singleton
export const diagLogs = new DiagLogs();
// Add console sink by default
diagLogs.addSink(entry => {
    const formatted = diagLogs.formatEntry(entry);
    switch (entry.level) {
        case 'trace':
        case 'debug':
            console.log(formatted);
            break;
        case 'info':
            console.info(formatted);
            break;
        case 'warn':
            console.warn(formatted);
            break;
        case 'error':
        case 'fatal':
            console.error(formatted);
            break;
    }
});
export default diagLogs;
//# sourceMappingURL=diag-logs.js.map