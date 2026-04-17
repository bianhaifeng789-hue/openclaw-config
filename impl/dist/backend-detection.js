// @ts-nocheck
class BackendDetection {
    backends = new Map();
    preferredBackend = null;
    /**
     * Register backend
     */
    register(id, type, capabilities) {
        const info = {
            id,
            type,
            capabilities,
            status: 'available',
            latencyMs: 0,
            lastCheck: Date.now()
        };
        this.backends.set(id, info);
        return info;
    }
    /**
     * Detect backends
     */
    detect() {
        // Would probe actual backends
        // For demo, return registered
        return Array.from(this.backends.values());
    }
    /**
     * Check backend status
     */
    async checkStatus(id) {
        const backend = this.backends.get(id);
        if (!backend)
            return 'unavailable';
        // Would ping backend
        backend.lastCheck = Date.now();
        return backend.status;
    }
    /**
     * Get backend
     */
    getBackend(id) {
        return this.backends.get(id);
    }
    /**
     * Get available backends
     */
    getAvailable() {
        return Array.from(this.backends.values())
            .filter(b => b.status === 'available');
    }
    /**
     * Get backends by type
     */
    getByType(type) {
        return Array.from(this.backends.values())
            .filter(b => b.type === type);
    }
    /**
     * Set preferred backend
     */
    setPreferred(id) {
        if (!this.backends.has(id))
            return false;
        this.preferredBackend = id;
        return true;
    }
    /**
     * Get preferred backend
     */
    getPreferred() {
        if (!this.preferredBackend)
            return null;
        return this.backends.get(this.preferredBackend) ?? null;
    }
    /**
     * Check capability
     */
    hasCapability(id, capability) {
        const backend = this.backends.get(id);
        return backend?.capabilities.includes(capability) ?? false;
    }
    /**
     * Find backend with capability
     */
    findWithCapability(capability) {
        return Array.from(this.backends.values())
            .find(b => b.status === 'available' && b.capabilities.includes(capability)) ?? null;
    }
    /**
     * Get stats
     */
    getStats() {
        const backends = Array.from(this.backends.values());
        const byType = {
            local: 0, remote: 0, cloud: 0, hybrid: 0
        };
        for (const b of backends)
            byType[b.type]++;
        return {
            backendsCount: backends.length,
            availableCount: backends.filter(b => b.status === 'available').length,
            byType
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.backends.clear();
        this.preferredBackend = null;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const backendDetection = new BackendDetection();
export default backendDetection;
//# sourceMappingURL=backend-detection.js.map