// @ts-nocheck
class DesktopDeepLink {
    handlers = new Map();
    processedLinks = [];
    scheme = 'openclaw';
    /**
     * Register handler
     */
    registerHandler(action, handler) {
        this.handlers.set(action, { action, handler });
    }
    /**
     * Parse deep link
     */
    parse(url) {
        try {
            // Parse URL like openclaw://action?param1=value1&param2=value2
            const withoutScheme = url.replace(`${this.scheme}://`, '');
            const [action, queryString] = withoutScheme.split('?');
            const params = {};
            if (queryString) {
                for (const pair of queryString.split('&')) {
                    const [key, value] = pair.split('=');
                    params[key] = decodeURIComponent(value);
                }
            }
            return {
                scheme: this.scheme,
                action,
                params,
                timestamp: Date.now()
            };
        }
        catch {
            return null;
        }
    }
    /**
     * Handle deep link
     */
    async handle(url) {
        const link = this.parse(url);
        if (!link)
            return false;
        this.processedLinks.push(link);
        const handler = this.handlers.get(link.action);
        if (!handler) {
            console.warn(`[DeepLink] No handler for action: ${link.action}`);
            return false;
        }
        try {
            await handler.handler(link.params);
            return true;
        }
        catch (e) {
            console.error(`[DeepLink] Handler error:`, e);
            return false;
        }
    }
    /**
     * Generate deep link URL
     */
    generate(action, params) {
        const queryString = params
            ? Object.entries(params)
                .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
                .join('&')
            : '';
        return `${this.scheme}://${action}${queryString ? `?${queryString}` : ''}`;
    }
    /**
     * Get processed links
     */
    getProcessedLinks() {
        return [...this.processedLinks];
    }
    /**
     * Set scheme
     */
    setScheme(scheme) {
        this.scheme = scheme;
    }
    /**
     * Get scheme
     */
    getScheme() {
        return this.scheme;
    }
    /**
     * Get registered actions
     */
    getRegisteredActions() {
        return Array.from(this.handlers.keys());
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            handlersCount: this.handlers.size,
            processedCount: this.processedLinks.length,
            scheme: this.scheme
        };
    }
    /**
     * Clear processed links
     */
    clearProcessed() {
        this.processedLinks = [];
    }
    /**
     * Unregister handler
     */
    unregisterHandler(action) {
        return this.handlers.delete(action);
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.handlers.clear();
        this.processedLinks = [];
        this.scheme = 'openclaw';
    }
}
// Global singleton
export const desktopDeepLink = new DesktopDeepLink();
// Register default handlers
desktopDeepLink.registerHandler('open', async (params) => {
    console.log(`[DeepLink] Opening: ${params.path ?? params.file}`);
});
desktopDeepLink.registerHandler('settings', async (params) => {
    console.log(`[DeepLink] Settings: ${params.section ?? 'general'}`);
});
export default desktopDeepLink;
//# sourceMappingURL=desktop-deep-link.js.map