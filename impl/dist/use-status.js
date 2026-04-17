// @ts-nocheck
class UseStatus {
    status = {
        overall: 'healthy',
        components: [],
        lastUpdated: Date.now(),
        uptimeMs: 0
    };
    startTime = Date.now();
    listeners = new Set();
    /**
     * Get status
     */
    getStatus() {
        this.status.uptimeMs = Date.now() - this.startTime;
        return { ...this.status };
    }
    /**
     * Update component status
     */
    updateComponent(name, status, details) {
        const existing = this.status.components.find(c => c.name === name);
        if (existing) {
            existing.status = status;
            existing.details = details;
        }
        else {
            this.status.components.push({ name, status, details });
        }
        this.status.lastUpdated = Date.now();
        this.recalculateOverall();
        this.notifyListeners();
    }
    /**
     * Recalculate overall status
     */
    recalculateOverall() {
        const components = this.status.components;
        if (components.some(c => c.status === 'critical')) {
            this.status.overall = 'critical';
        }
        else if (components.some(c => c.status === 'degraded')) {
            this.status.overall = 'degraded';
        }
        else if (components.every(c => c.status === 'healthy')) {
            this.status.overall = 'healthy';
        }
        else {
            this.status.overall = 'unknown';
        }
    }
    /**
     * Remove component
     */
    removeComponent(name) {
        const index = this.status.components.findIndex(c => c.name === name);
        if (index === -1)
            return false;
        this.status.components.splice(index, 1);
        this.recalculateOverall();
        this.notifyListeners();
        return true;
    }
    /**
     * Get component
     */
    getComponent(name) {
        return this.status.components.find(c => c.name === name);
    }
    /**
     * Check health
     */
    isHealthy() {
        return this.status.overall === 'healthy';
    }
    /**
     * Check degraded
     */
    isDegraded() {
        return this.status.overall === 'degraded';
    }
    /**
     * Check critical
     */
    isCritical() {
        return this.status.overall === 'critical';
    }
    /**
     * Get uptime
     */
    getUptime() {
        return Date.now() - this.startTime;
    }
    /**
     * Subscribe
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Notify listeners
     */
    notifyListeners() {
        for (const listener of this.listeners) {
            listener(this.getStatus());
        }
    }
    /**
     * Get stats
     */
    getStats() {
        const healthy = this.status.components.filter(c => c.status === 'healthy').length;
        return {
            componentsCount: this.status.components.length,
            overallStatus: this.status.overall,
            uptimeMs: this.getUptime(),
            listenersCount: this.listeners.size,
            healthyComponents: healthy
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.status = {
            overall: 'healthy',
            components: [],
            lastUpdated: Date.now(),
            uptimeMs: 0
        };
        this.startTime = Date.now();
        this.listeners.clear();
    }
}
// Global singleton
export const useStatus = new UseStatus();
// Initialize default components
useStatus.updateComponent('core', 'healthy');
useStatus.updateComponent('network', 'healthy');
export default useStatus;
//# sourceMappingURL=use-status.js.map