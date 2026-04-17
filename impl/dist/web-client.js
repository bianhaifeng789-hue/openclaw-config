// @ts-nocheck
class WebClient {
    config = {
        timeoutMs: 30000,
        maxRetries: 3,
        retryDelayMs: 1000,
        headers: {}
    };
    requestHistory = [];
    /**
     * Set base URL
     */
    setBaseUrl(url) {
        this.config.baseUrl = url;
    }
    /**
     * Set headers
     */
    setHeaders(headers) {
        this.config.headers = { ...this.config.headers, ...headers };
    }
    /**
     * Set auth header
     */
    setAuth(token) {
        this.config.headers = {
            ...this.config.headers,
            'Authorization': `Bearer ${token}`
        };
    }
    /**
     * GET request
     */
    async get(path, options) {
        return this.request('GET', path, options);
    }
    /**
     * POST request
     */
    async post(path, body, options) {
        return this.request('POST', path, { ...options, body });
    }
    /**
     * PUT request
     */
    async put(path, body, options) {
        return this.request('PUT', path, { ...options, body });
    }
    /**
     * DELETE request
     */
    async delete(path, options) {
        return this.request('DELETE', path, options);
    }
    /**
     * Core request method
     */
    async request(method, path, options) {
        const url = this.buildUrl(path, options?.params);
        const startTime = Date.now();
        let retries = 0;
        while (retries < this.config.maxRetries) {
            try {
                // Would make actual HTTP request
                // For demo, simulate response
                const response = {
                    status: 200,
                    headers: {},
                    body: { success: true },
                    durationMs: Date.now() - startTime
                };
                // Track history
                this.requestHistory.push({
                    url,
                    method,
                    timestamp: Date.now()
                });
                return response;
            }
            catch (e) {
                retries++;
                if (retries < this.config.maxRetries) {
                    await this.delay(this.config.retryDelayMs * retries);
                }
                else {
                    throw e;
                }
            }
        }
        throw new Error('Max retries exceeded');
    }
    /**
     * Build URL with params
     */
    buildUrl(path, params) {
        let url = this.config.baseUrl ? `${this.config.baseUrl}${path}` : path;
        if (params) {
            const queryString = Object.entries(params)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                .join('&');
            url += `?${queryString}`;
        }
        return url;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get request history
     */
    getHistory() {
        return [...this.requestHistory];
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.requestHistory = [];
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
     * Reset for testing
     */
    _reset() {
        this.config = {
            timeoutMs: 30000,
            maxRetries: 3,
            retryDelayMs: 1000,
            headers: {}
        };
        this.requestHistory = [];
    }
}
// Global singleton
export const webClient = new WebClient();
export default webClient;
//# sourceMappingURL=web-client.js.map