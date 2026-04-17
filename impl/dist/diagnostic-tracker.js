// @ts-nocheck
class DiagnosticTracker {
    metrics = new Map();
    alerts = [];
    thresholds = new Map();
    alertCounter = 0;
    config = {
        maxMetricHistory: 100,
        autoAlert: true
    };
    /**
     * Track metric
     */
    track(name, value, unit = '', tags) {
        const metric = {
            name,
            value,
            unit,
            timestamp: Date.now(),
            tags
        };
        const history = this.metrics.get(name) ?? [];
        history.push(metric);
        // Trim history
        while (history.length > this.config.maxMetricHistory) {
            history.shift();
        }
        this.metrics.set(name, history);
        // Check thresholds
        if (this.config.autoAlert) {
            this.checkThreshold(name, value);
        }
        return metric;
    }
    /**
     * Set threshold
     */
    setThreshold(name, warning, error, critical) {
        this.thresholds.set(name, { warning, error, critical });
    }
    /**
     * Check threshold
     */
    checkThreshold(name, value) {
        const threshold = this.thresholds.get(name);
        if (!threshold)
            return;
        let type = null;
        if (value >= threshold.critical)
            type = 'critical';
        else if (value >= threshold.error)
            type = 'error';
        else if (value >= threshold.warning)
            type = 'warning';
        if (type) {
            this.createAlert(type, name, threshold[type], value);
        }
    }
    /**
     * Create alert
     */
    createAlert(type, metric, threshold, value) {
        const alert = {
            id: `alert-${++this.alertCounter}`,
            type,
            message: `${metric} exceeded ${type} threshold: ${value} > ${threshold}`,
            metric,
            threshold,
            value,
            timestamp: Date.now(),
            resolved: false
        };
        this.alerts.push(alert);
    }
    /**
     * Resolve alert
     */
    resolveAlert(id) {
        const alert = this.alerts.find(a => a.id === id);
        if (!alert)
            return false;
        alert.resolved = true;
        return true;
    }
    /**
     * Get metric history
     */
    getMetricHistory(name) {
        return this.metrics.get(name) ?? [];
    }
    /**
     * Get latest metric
     */
    getLatest(name) {
        const history = this.metrics.get(name);
        if (!history || history.length === 0)
            return undefined;
        return history[history.length - 1];
    }
    /**
     * Get active alerts
     */
    getActiveAlerts() {
        return this.alerts.filter(a => !a.resolved);
    }
    /**
     * Get all alerts
     */
    getAllAlerts() {
        return [...this.alerts];
    }
    /**
     * Get stats
     */
    getStats() {
        const totalSamples = Array.from(this.metrics.values())
            .reduce((sum, h) => sum + h.length, 0);
        return {
            metricsCount: this.metrics.size,
            totalSamples,
            activeAlerts: this.getActiveAlerts().length,
            resolvedAlerts: this.alerts.filter(a => a.resolved).length
        };
    }
    /**
     * Clear metrics
     */
    clearMetrics() {
        this.metrics.clear();
    }
    /**
     * Clear alerts
     */
    clearAlerts() {
        this.alerts = [];
        this.alertCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearMetrics();
        this.clearAlerts();
        this.thresholds.clear();
        this.config = {
            maxMetricHistory: 100,
            autoAlert: true
        };
    }
}
// Global singleton
export const diagnosticTracker = new DiagnosticTracker();
// Set default thresholds
diagnosticTracker.setThreshold('memory_usage', 80, 90, 95);
diagnosticTracker.setThreshold('error_rate', 1, 5, 10);
diagnosticTracker.setThreshold('latency_ms', 500, 1000, 5000);
export default diagnosticTracker;
//# sourceMappingURL=diagnostic-tracker.js.map