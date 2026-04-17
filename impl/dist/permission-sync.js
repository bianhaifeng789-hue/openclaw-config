// @ts-nocheck
class PermissionSync {
    states = new Map();
    globalPermissions = new Map();
    version = 0;
    /**
     * Initialize session permissions
     */
    init(sessionId, permissions) {
        const state = {
            sessionId,
            permissions,
            syncedAt: Date.now(),
            version: this.version
        };
        this.states.set(sessionId, state);
        return state;
    }
    /**
     * Sync permissions
     */
    sync(sessionId) {
        const state = this.states.get(sessionId);
        if (!state)
            return null;
        // Merge with global permissions
        for (const [key, value] of this.globalPermissions) {
            if (!state.permissions.hasOwnProperty(key)) {
                state.permissions[key] = value;
            }
        }
        state.syncedAt = Date.now();
        state.version = this.version;
        return state;
    }
    /**
     * Update global permission
     */
    updateGlobal(key, value) {
        this.globalPermissions.set(key, value);
        this.version++;
        // Notify all sessions
        for (const state of this.states.values()) {
            state.permissions[key] = value;
            state.syncedAt = Date.now();
            state.version = this.version;
        }
    }
    /**
     * Update session permission
     */
    updateSession(sessionId, key, value) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        state.permissions[key] = value;
        state.syncedAt = Date.now();
        return true;
    }
    /**
     * Get state
     */
    getState(sessionId) {
        return this.states.get(sessionId);
    }
    /**
     * Get permissions
     */
    getPermissions(sessionId) {
        const state = this.states.get(sessionId);
        return state?.permissions ?? null;
    }
    /**
     * Check permission
     */
    check(sessionId, key) {
        const state = this.states.get(sessionId);
        return state?.permissions[key] ?? this.globalPermissions.get(key) ?? false;
    }
    /**
     * Get global permissions
     */
    getGlobal() {
        return Object.fromEntries(this.globalPermissions);
    }
    /**
     * Get version
     */
    getVersion() {
        return this.version;
    }
    /**
     * Remove session
     */
    removeSession(sessionId) {
        return this.states.delete(sessionId);
    }
    /**
     * Get stats
     */
    getStats() {
        const states = Array.from(this.states.values());
        const lastSync = states.length > 0
            ? Math.max(...states.map(s => s.syncedAt))
            : null;
        return {
            sessionsCount: states.length,
            globalPermissionsCount: this.globalPermissions.size,
            version: this.version,
            lastSyncTime: lastSync
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.states.clear();
        this.globalPermissions.clear();
        this.version = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const permissionSync = new PermissionSync();
export default permissionSync;
//# sourceMappingURL=permission-sync.js.map