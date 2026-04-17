// @ts-nocheck
class BrowserUtils {
    config = {
        headless: false,
        defaultTimeoutMs: 10000
    };
    openedUrls = [];
    /**
     * Open URL in browser
     */
    async open(url) {
        // Would use actual browser opening mechanism
        // For demo, track URL
        this.openedUrls.push(url);
        console.log(`[Browser] Opening: ${url}`);
        return true;
    }
    /**
     * Open URL with fallback
     */
    async openWithFallback(url, fallbackUrl) {
        try {
            return await this.open(url);
        }
        catch {
            if (fallbackUrl) {
                return await this.open(fallbackUrl);
            }
            return false;
        }
    }
    /**
     * Check if headless mode
     */
    isHeadless() {
        // Check environment for headless indicators
        const env = process.env;
        return env.CI === 'true' ||
            env.DISPLAY === undefined ||
            env.TERM === 'dumb' ||
            this.config.headless;
    }
    /**
     * Get browser type
     */
    getBrowserType() {
        // Would detect browser
        // For demo, return default
        return 'default';
    }
    /**
     * Parse URL
     */
    parseUrl(url) {
        try {
            const parsed = new URL(url);
            const query = {};
            parsed.searchParams.forEach((value, key) => {
                query[key] = value;
            });
            return {
                protocol: parsed.protocol,
                host: parsed.host,
                path: parsed.pathname,
                query
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Build URL
     */
    buildUrl(base, path, query) {
        let url = base;
        if (path) {
            url += path.startsWith('/') ? path : '/' + path;
        }
        if (query) {
            const queryString = Object.entries(query)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                .join('&');
            url += '?' + queryString;
        }
        return url;
    }
    /**
     * Validate URL
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get opened URLs
     */
    getOpenedUrls() {
        return [...this.openedUrls];
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
     * Get stats
     */
    getStats() {
        return {
            openedCount: this.openedUrls.length,
            headless: this.isHeadless(),
            lastOpenedUrl: this.openedUrls.length > 0 ? this.openedUrls[this.openedUrls.length - 1] : null
        };
    }
    /**
     * Clear opened URLs
     */
    clearOpened() {
        this.openedUrls = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearOpened();
        this.config = {
            headless: false,
            defaultTimeoutMs: 10000
        };
    }
}
// Global singleton
export const browserUtils = new BrowserUtils();
export default browserUtils;
//# sourceMappingURL=browser-utils.js.map