// @ts-nocheck
class MCPAuthTool {
    auths = new Map();
    tokens = new Map();
    /**
     * Authenticate
     */
    authenticate(serverId, method, credentials) {
        const result = {
            serverId,
            authenticated: true,
            method,
            expiresAt: method !== 'none' ? Date.now() + 3600000 : undefined,
            timestamp: Date.now()
        };
        this.auths.set(serverId, result);
        if (credentials?.token) {
            this.tokens.set(serverId, credentials.token);
        }
        return result;
    }
    /**
     * Authenticate with token
     */
    authenticateWithToken(serverId, token) {
        return this.authenticate(serverId, 'token', { token });
    }
    /**
     * Authenticate with OAuth
     */
    authenticateWithOAuth(serverId) {
        return this.authenticate(serverId, 'oauth');
    }
    /**
     * Authenticate with basic
     */
    authenticateWithBasic(serverId, username, password) {
        return this.authenticate(serverId, 'basic', { username, password });
    }
    /**
     * No auth
     */
    noAuth(serverId) {
        return this.authenticate(serverId, 'none');
    }
    /**
     * Check authentication
     */
    isAuthenticated(serverId) {
        const auth = this.auths.get(serverId);
        if (!auth)
            return false;
        if (auth.expiresAt && auth.expiresAt < Date.now()) {
            this.auths.delete(serverId);
            return false;
        }
        return auth.authenticated;
    }
    /**
     * Get auth result
     */
    getAuth(serverId) {
        return this.auths.get(serverId);
    }
    /**
     * Get token
     */
    getToken(serverId) {
        return this.tokens.get(serverId);
    }
    /**
     * Revoke auth
     */
    revoke(serverId) {
        this.tokens.delete(serverId);
        return this.auths.delete(serverId);
    }
    /**
     * Get stats
     */
    getStats() {
        const byMethod = {
            none: 0, token: 0, oauth: 0, basic: 0
        };
        const now = Date.now();
        let expired = 0;
        for (const auth of this.auths.values()) {
            byMethod[auth.method]++;
            if (auth.expiresAt && auth.expiresAt < now) {
                expired++;
            }
        }
        return {
            authenticatedCount: this.auths.size,
            byMethod,
            expiredCount: expired
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.auths.clear();
        this.tokens.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const mcpAuthTool = new MCPAuthTool();
export default mcpAuthTool;
//# sourceMappingURL=mcp-auth-tool.js.map