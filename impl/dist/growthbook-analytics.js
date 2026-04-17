// @ts-nocheck
class GrowthBookAnalytics {
    featureFlags = new Map();
    events = [];
    userId = null;
    maxEvents = 500;
    /**
     * Set user ID
     */
    setUserId(id) {
        this.userId = id;
    }
    /**
     * Get user ID
     */
    getUserId() {
        return this.userId;
    }
    /**
     * Set feature flag
     */
    setFlag(key, enabled, value, conditions) {
        this.featureFlags.set(key, {
            key,
            enabled,
            value,
            conditions
        });
    }
    /**
     * Check if feature enabled
     */
    isFeatureEnabled(key) {
        const flag = this.featureFlags.get(key);
        if (!flag)
            return false;
        // Check conditions
        if (flag.conditions) {
            return this.evaluateConditions(flag.conditions);
        }
        return flag.enabled;
    }
    /**
     * Get feature value
     */
    getFeatureValue(key, defaultValue) {
        const flag = this.featureFlags.get(key);
        if (!flag || !flag.enabled)
            return defaultValue;
        return flag.value ?? defaultValue;
    }
    /**
     * Evaluate conditions
     */
    evaluateConditions(conditions) {
        // Would evaluate against user attributes
        // For demo, return true
        return true;
    }
    /**
     * Track event
     */
    track(name, properties = {}) {
        const event = {
            name,
            properties,
            timestamp: Date.now(),
            userId: this.userId
        };
        this.events.push(event);
        this.ensureCapacity();
    }
    /**
     * Ensure capacity
     */
    ensureCapacity() {
        while (this.events.length > this.maxEvents) {
            this.events.shift();
        }
    }
    /**
     * Get events
     */
    getEvents() {
        return [...this.events];
    }
    /**
     * Get events by name
     */
    getEventsByName(name) {
        return this.events.filter(e => e.name === name);
    }
    /**
     * Get all flags
     */
    getAllFlags() {
        return Array.from(this.featureFlags.values());
    }
    /**
     * Get enabled flags
     */
    getEnabledFlags() {
        return Array.from(this.featureFlags.values())
            .filter(f => f.enabled);
    }
    /**
     * Get stats
     */
    getStats() {
        const uniqueEventNames = new Set(this.events.map(e => e.name)).size;
        return {
            totalFlags: this.featureFlags.size,
            enabledFlags: this.getEnabledFlags().length,
            totalEvents: this.events.length,
            uniqueEventNames
        };
    }
    /**
     * Clear events
     */
    clearEvents() {
        this.events = [];
    }
    /**
     * Clear flags
     */
    clearFlags() {
        this.featureFlags.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearEvents();
        this.clearFlags();
        this.userId = null;
        this.maxEvents = 500;
    }
}
// Global singleton
export const growthBookAnalytics = new GrowthBookAnalytics();
// Set default feature flags
growthBookAnalytics.setFlag('memory_maintenance', true);
growthBookAnalytics.setFlag('auto_dream', true);
growthBookAnalytics.setFlag('voice_mode', false);
growthBookAnalytics.setFlag('compact_service', true);
growthBookAnalytics.setFlag('tips_service', true);
export default growthBookAnalytics;
//# sourceMappingURL=growthbook-analytics.js.map