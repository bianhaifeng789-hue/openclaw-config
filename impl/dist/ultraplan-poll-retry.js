// @ts-nocheck
class UltraplanPollRetry {
    state = {
        consecutiveFailures: 0,
        totalFailures: 0,
        lastFailureTime: 0,
        currentDelayMs: 1000
    };
    config = {
        maxFailures: 5,
        baseDelayMs: 1000,
        maxDelayMs: 30000,
        backoffMultiplier: 2
    };
    /**
     * Poll with retry logic
     */
    async poll(fn) {
        // Check if too many failures
        if (this.state.consecutiveFailures >= this.config.maxFailures) {
            throw new Error(`Poll aborted: ${this.state.consecutiveFailures} consecutive failures`);
        }
        try {
            const result = await fn();
            // Success: reset failures
            this.resetFailures();
            return result;
        }
        catch (error) {
            this.recordFailure(error);
            // Check if transient
            if (this.isTransientNetworkError(error)) {
                // Wait with exponential backoff
                await this.waitWithBackoff();
                // Retry
                return this.poll(fn);
            }
            // Non-transient: throw
            throw error;
        }
    }
    /**
     * Check if error is transient network error
     */
    isTransientNetworkError(error) {
        const message = error.message.toLowerCase();
        // Transient errors
        const transientPatterns = [
            'timeout',
            'etimedout',
            'econnreset',
            'econnrefused',
            'enotfound', // DNS
            'socket hang up',
            'network',
            'temporary',
            'rate limit',
            '429',
            '503',
            '502'
        ];
        for (const pattern of transientPatterns) {
            if (message.includes(pattern)) {
                return true;
            }
        }
        // Check error code
        const code = error.code;
        const transientCodes = ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN'];
        if (transientCodes.includes(code)) {
            return true;
        }
        return false;
    }
    /**
     * Record failure
     */
    recordFailure(error) {
        this.state.consecutiveFailures++;
        this.state.totalFailures++;
        this.state.lastFailureTime = Date.now();
        this.state.lastError = error;
        console.warn(`[PollRetry] Failure ${this.state.consecutiveFailures}: ${error.message}`);
    }
    /**
     * Reset failures on success
     */
    resetFailures() {
        if (this.state.consecutiveFailures > 0) {
            console.log(`[PollRetry] Success after ${this.state.consecutiveFailures} failures`);
        }
        this.state.consecutiveFailures = 0;
        this.state.currentDelayMs = this.config.baseDelayMs;
        this.state.lastError = undefined;
    }
    /**
     * Wait with exponential backoff
     */
    async waitWithBackoff() {
        // Calculate delay
        const delay = Math.min(this.state.currentDelayMs * this.config.backoffMultiplier, this.config.maxDelayMs);
        this.state.currentDelayMs = delay;
        console.log(`[PollRetry] Waiting ${delay}ms before retry`);
        await this.sleep(delay);
    }
    /**
     * Sleep helper
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
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
        this.state = {
            consecutiveFailures: 0,
            totalFailures: 0,
            lastFailureTime: 0,
            currentDelayMs: this.config.baseDelayMs
        };
    }
}
// Global singleton
export const ultraplanPollRetry = new UltraplanPollRetry();
export default ultraplanPollRetry;
//# sourceMappingURL=ultraplan-poll-retry.js.map