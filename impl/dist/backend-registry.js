// @ts-nocheck
class BackendRegistry {
    registry = new Map();
    endpoints = new Map(); // endpoint -> id
    /**
     * Register backend
     */
    register(id, name, endpoint, protocol, config) {
        const registration = {
            id,
            name,
            endpoint,
            protocol,
            registeredAt: Date.now(),
            lastActive: Date.now(),
            config: config ?? {}
        };
        this.registry.set(id, registration);
        this.endpoints.set(endpoint, id);
        return registration;
    }
    /**
     * Unregister backend
     */
    unregister(id) {
        const reg = this.registry.get(id);
        if (!reg)
            return false;
        this.endpoints.delete(reg.endpoint);
        this.registry.delete(id);
        return true;
    }
    /**
     * Get by ID
     */
    getById(id) {
        return this.registry.get(id);
    }
    /**
     * Get by endpoint
     */
    getByEndpoint(endpoint) {
        const id = this.endpoints.get(endpoint);
        if (!id)
            return undefined;
        return this.registry.get(id);
    }
    /**
     * Get by name
     */
    getByName(name) {
        return Array.from(this.registry.values())
            .filter(r => r.name === name);
    }
    /**
     * Get by protocol
     */
    getByProtocol(protocol) {
        return Array.from(this.registry.values())
            .filter(r => r.protocol === protocol);
    }
    /**
     * Update last active
     */
    updateLastActive(id) {
        const reg = this.registry.get(id);
        if (!reg)
            return false;
        reg.lastActive = Date.now();
        return true;
    }
    /**
     * Update config
     */
    updateConfig(id, config) {
        const reg = this.registry.get(id);
        if (!reg)
            return false;
        reg.config = { ...reg.config, ...config };
        return true;
    }
    /**
     * List all
     */
    list() {
        return Array.from(this.registry.values());
    }
    /**
     * Get active backends
     */
    getActive(thresholdMs = 60000) {
        const now = Date.now();
        return Array.from(this.registry.values())
            .filter(r => now - r.lastActive < thresholdMs);
    }
    /**
     * Get stats
     */
    getStats() {
        const regs = Array.from(this.registry.values());
        const byProtocol = {
            http: 0, ws: 0, grpc: 0
        };
        for (const r of regs)
            byProtocol[r.protocol]++;
        return {
            registeredCount: regs.length,
            endpointsCount: this.endpoints.size,
            byProtocol,
            activeCount: this.getActive().length
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.registry.clear();
        this.endpoints.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const backendRegistry = new BackendRegistry();
export default backendRegistry;
//# sourceMappingURL=backend-registry.js.map