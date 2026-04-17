// @ts-nocheck
class MonitorTool {
    monitors = new Map();
    monitorCounter = 0;
    listeners = new Map();
    /**
     * Create monitor
     */
    create(path) {
        const id = `monitor-${++this.monitorCounter}-${Date.now()}`;
        const monitor = {
            id,
            path,
            events: [],
            active: true,
            createdAt: Date.now()
        };
        this.monitors.set(id, monitor);
        return monitor;
    }
    /**
     * Stop monitor
     */
    stop(id) {
        const monitor = this.monitors.get(id);
        if (!monitor)
            return false;
        monitor.active = false;
        return true;
    }
    /**
     * Start monitor
     */
    start(id) {
        const monitor = this.monitors.get(id);
        if (!monitor)
            return false;
        monitor.active = true;
        return true;
    }
    /**
     * Delete monitor
     */
    delete(id) {
        this.listeners.delete(id);
        return this.monitors.delete(id);
    }
    /**
     * Record event
     */
    recordEvent(monitorId, type, path) {
        const monitor = this.monitors.get(monitorId);
        const event = {
            type,
            path,
            timestamp: Date.now()
        };
        if (monitor) {
            monitor.events.push(event);
        }
        // Notify listeners
        const listeners = this.listeners.get(monitorId);
        if (listeners) {
            for (const listener of listeners) {
                listener(event);
            }
        }
        return event;
    }
    /**
     * Subscribe
     */
    subscribe(monitorId, listener) {
        const listeners = this.listeners.get(monitorId) ?? new Set();
        listeners.add(listener);
        this.listeners.set(monitorId, listeners);
        return () => listeners.delete(listener);
    }
    /**
     * Get monitor
     */
    getMonitor(id) {
        return this.monitors.get(id);
    }
    /**
     * Get active monitors
     */
    getActive() {
        return Array.from(this.monitors.values())
            .filter(m => m.active);
    }
    /**
     * Get events
     */
    getEvents(monitorId) {
        return this.monitors.get(monitorId)?.events ?? [];
    }
    /**
     * Get recent events
     */
    getRecentEvents(monitorId, count = 10) {
        const events = this.getEvents(monitorId);
        return events.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const monitors = Array.from(this.monitors.values());
        const totalEvents = monitors.reduce((sum, m) => sum + m.events.length, 0);
        return {
            monitorsCount: monitors.length,
            activeCount: monitors.filter(m => m.active).length,
            totalEvents: totalEvents,
            listenersCount: this.listeners.size
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.monitors.clear();
        this.listeners.clear();
        this.monitorCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const monitorTool = new MonitorTool();
export default monitorTool;
//# sourceMappingURL=monitor-tool.js.map