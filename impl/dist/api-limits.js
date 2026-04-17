// @ts-nocheck
class APILimits {
    config = {
        maxRequestsPerMinute: 60,
        maxRequestsPerHour: 1000,
        maxConcurrentRequests: 5,
        maxTokensPerRequest: 100000,
        maxTokensPerDay: 1000000
    };
    status = {
        requestsPerMinute: 0,
        requestsPerHour: 0,
        tokensPerDay: 0,
        concurrentRequests: 0,
        lastReset: Date.now()
    };
    /**
     * Check if can make request
     */
    canMakeRequest() {
        this.checkAndReset();
        return (this.status.requestsPerMinute < this.config.maxRequestsPerMinute &&
            this.status.requestsPerHour < this.config.maxRequestsPerHour &&
            this.status.concurrentRequests < this.config.maxConcurrentRequests);
    }
    /**
     * Check if can use tokens
     */
    canUseTokens(tokens) {
        this.checkAndReset();
        return (tokens <= this.config.maxTokensPerRequest &&
            this.status.tokensPerDay + tokens <= this.config.maxTokensPerDay);
    }
    /**
     * Record request
     */
    recordRequest(tokens) {
        this.checkAndReset();
        this.status.requestsPerMinute++;
        this.status.requestsPerHour++;
        this.status.tokensPerDay += tokens;
    }
    /**
     * Start concurrent request
     */
    startConcurrent() {
        if (this.status.concurrentRequests >= this.config.maxConcurrentRequests) {
            return false;
        }
        this.status.concurrentRequests++;
        return true;
    }
    /**
     * End concurrent request
     */
    endConcurrent() {
        this.status.concurrentRequests = Math.max(0, this.status.concurrentRequests - 1);
    }
    /**
     * Check and reset counters
     */
    checkAndReset() {
        const now = Date.now();
        const elapsed = now - this.status.lastReset;
        // Reset minute counter
        if (elapsed >= 60 * 1000) {
            this.status.requestsPerMinute = 0;
        }
        // Reset hour counter
        if (elapsed >= 60 * 60 * 1000) {
            this.status.requestsPerHour = 0;
        }
        // Reset day counter
        if (elapsed >= 24 * 60 * 60 * 1000) {
            this.status.requestsPerMinute = 0;
            this.status.requestsPerHour = 0;
            this.status.tokensPerDay = 0;
            this.status.lastReset = now;
        }
    }
    /**
     * Get wait time until next request
     */
    getWaitTime() {
        this.checkAndReset();
        if (this.canMakeRequest())
            return 0;
        // Calculate wait based on which limit hit
        const minuteWait = 60 * 1000 - (Date.now() - this.status.lastReset);
        const hourWait = 60 * 60 * 1000 - (Date.now() - this.status.lastReset);
        if (this.status.requestsPerMinute >= this.config.maxRequestsPerMinute) {
            return Math.min(minuteWait, 60 * 1000);
        }
        if (this.status.requestsPerHour >= this.config.maxRequestsPerHour) {
            return Math.min(hourWait, 60 * 60 * 1000);
        }
        return 0;
    }
    /**
     * Get remaining requests
     */
    getRemainingRequests() {
        this.checkAndReset();
        return {
            perMinute: this.config.maxRequestsPerMinute - this.status.requestsPerMinute,
            perHour: this.config.maxRequestsPerHour - this.status.requestsPerHour,
            perDay: Math.floor(this.config.maxTokensPerDay / this.config.maxTokensPerRequest) -
                Math.floor(this.status.tokensPerDay / this.config.maxTokensPerRequest)
        };
    }
    /**
     * Get status
     */
    getStatus() {
        this.checkAndReset();
        return { ...this.status };
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
        this.config = {
            maxRequestsPerMinute: 60,
            maxRequestsPerHour: 1000,
            maxConcurrentRequests: 5,
            maxTokensPerRequest: 100000,
            maxTokensPerDay: 1000000
        };
        this.status = {
            requestsPerMinute: 0,
            requestsPerHour: 0,
            tokensPerDay: 0,
            concurrentRequests: 0,
            lastReset: Date.now()
        };
    }
}
// Global singleton
export const apiLimits = new APILimits();
export default apiLimits;
//# sourceMappingURL=api-limits.js.map