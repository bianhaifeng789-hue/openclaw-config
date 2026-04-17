// @ts-nocheck
class DiagLoggerWrapper {
    config = {
        severity: 'info',
        includeTimestamp: true,
        includeLevel: true,
        formatJson: false
    };
    /**
     * Log at verbose level
     */
    verbose(message, ...args) {
        this.log('verbose', message, args);
    }
    /**
     * Log at debug level
     */
    debug(message, ...args) {
        this.log('debug', message, args);
    }
    /**
     * Log at info level
     */
    info(message, ...args) {
        this.log('info', message, args);
    }
    /**
     * Log at warn level
     */
    warn(message, ...args) {
        this.log('warn', message, args);
    }
    /**
     * Log at error level
     */
    error(message, error, ...args) {
        this.log('error', message, [error, ...args]);
    }
    /**
     * Safe log with error boundary
     */
    safeLog(level, formattedMessage) {
        try {
            // Would integrate with actual diag logger
            // For demo, use console
            const consoleMethod = level === 'error' ? 'error' :
                level === 'warn' ? 'warn' :
                    level === 'debug' ? 'debug' :
                        'log';
            console[consoleMethod](formattedMessage);
        }
        catch (e) {
            // Fallback: silent fail
        }
    }
    /**
     * Log with severity check
     */
    log(level, message, args) {
        // Check severity level
        if (!this.shouldLog(level))
            return;
        // Format message
        const formatted = this.formatMessage(level, message, args);
        // Safe log
        this.safeLog(level, formatted);
    }
    /**
     * Check if level should be logged
     */
    shouldLog(level) {
        const levels = ['error', 'warn', 'info', 'debug', 'verbose'];
        const currentLevelIndex = levels.indexOf(this.config.severity);
        const messageLevelIndex = levels.indexOf(level);
        return messageLevelIndex <= currentLevelIndex;
    }
    /**
     * Format message
     */
    formatMessage(level, message, args) {
        const parts = [];
        if (this.config.includeTimestamp) {
            parts.push(new Date().toISOString());
        }
        if (this.config.includeLevel) {
            parts.push(`[${level.toUpperCase()}]`);
        }
        parts.push(message);
        if (args.length > 0) {
            const argsStr = this.config.formatJson
                ? JSON.stringify(args)
                : args.map(a => String(a)).join(' ');
            parts.push(argsStr);
        }
        return parts.join(' ');
    }
    /**
     * Set severity level
     */
    setSeverity(severity) {
        this.config.severity = severity;
    }
    /**
     * Get severity level
     */
    getSeverity() {
        return this.config.severity;
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
    /**
     * Create child logger with custom config
     */
    createChild(config) {
        const child = new DiagLoggerWrapper();
        child.setConfig({ ...this.config, ...config });
        return child;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.config = {
            severity: 'info',
            includeTimestamp: true,
            includeLevel: true,
            formatJson: false
        };
    }
}
// Global singleton
export const diagLogger = new DiagLoggerWrapper();
export default diagLogger;
//# sourceMappingURL=diag-logger.js.map