// @ts-nocheck
class TimeoutUtils {
    config = {
        defaultTimeout: 30000, // 30 seconds
        maxTimeout: 300000, // 5 minutes
        minTimeout: 100 // 100ms
    };
    /**
     * Get timeout from environment
     */
    getEnvTimeout(name, defaultValue) {
        const envValue = process.env[name];
        if (!envValue)
            return defaultValue;
        // Parse environment value
        const parsed = this.parseTimeout(envValue);
        return this.validateTimeout(parsed, defaultValue);
    }
    /**
     * Parse timeout string (e.g., "30s", "5m", "1h")
     */
    parseTimeout(value) {
        const match = value.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/);
        if (!match)
            return parseInt(value) ?? 0;
        const num = parseFloat(match[1]);
        const unit = match[2] ?? 'ms';
        switch (unit) {
            case 'ms': return num;
            case 's': return num * 1000;
            case 'm': return num * 60 * 1000;
            case 'h': return num * 60 * 60 * 1000;
            default: return num;
        }
    }
    /**
     * Validate timeout within limits
     */
    validateTimeout(value, defaultValue) {
        if (value < this.config.minTimeout)
            return defaultValue;
        if (value > this.config.maxTimeout)
            return this.config.maxTimeout;
        return value;
    }
    /**
     * Wrap function with timeout
     */
    async withTimeout(fn, options) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                options.onTimeout?.();
                reject(new Error(`Timeout after ${options.ms}ms`));
            }, options.ms);
            // Unref timer
            if (typeof timer.unref === 'function') {
                timer.unref();
            }
            fn()
                .then(result => {
                clearTimeout(timer);
                resolve(result);
            })
                .catch(error => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }
    /**
     * Create deadline timeout
     */
    createDeadline(deadlineMs) {
        const deadline = Date.now() + deadlineMs;
        return {
            remaining: () => Math.max(0, deadline - Date.now()),
            isExpired: () => Date.now() >= deadline,
            check: () => {
                if (Date.now() >= deadline) {
                    throw new Error('Deadline expired');
                }
            }
        };
    }
    /**
     * Race with timeout
     */
    async raceWithTimeout(promise, ms) {
        const timeoutPromise = new Promise((_, reject) => {
            const timer = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
            if (typeof timer.unref === 'function')
                timer.unref();
        });
        return Promise.race([promise, timeoutPromise]);
    }
    /**
     * Delay with timeout
     */
    async delay(ms, signal) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, ms);
            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timer);
                    reject(new Error('Delay aborted'));
                }, { once: true });
            }
            if (typeof timer.unref === 'function') {
                timer.unref();
            }
        });
    }
    /**
     * Retry with timeout
     */
    async retryWithTimeout(fn, options) {
        let retries = 0;
        while (retries < options.maxRetries) {
            try {
                return await this.withTimeout(fn, { ms: options.timeoutMs });
            }
            catch (e) {
                retries++;
                if (retries >= options.maxRetries)
                    throw e;
                await this.delay(options.retryDelayMs * retries);
            }
        }
        throw new Error('Max retries exceeded');
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
        this.config = {
            defaultTimeout: 30000,
            maxTimeout: 300000,
            minTimeout: 100
        };
    }
}
// Global singleton
export const timeoutUtils = new TimeoutUtils();
export default timeoutUtils;
//# sourceMappingURL=timeout-utils.js.map