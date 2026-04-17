// @ts-nocheck
class ConfigTool {
    config = new Map();
    history = [];
    /**
     * Set config
     */
    set(key, value) {
        const type = this.getType(value);
        const entry = {
            key,
            value,
            type,
            updatedAt: Date.now()
        };
        const existing = this.config.get(key);
        if (existing) {
            this.history.push({ key, oldValue: existing.value, newValue: value });
        }
        this.config.set(key, entry);
        return entry;
    }
    /**
     * Get type
     */
    getType(value) {
        if (typeof value === 'string')
            return 'string';
        if (typeof value === 'number')
            return 'number';
        if (typeof value === 'boolean')
            return 'boolean';
        return 'object';
    }
    /**
     * Get config
     */
    get(key) {
        return this.config.get(key)?.value;
    }
    /**
     * Get entry
     */
    getEntry(key) {
        return this.config.get(key);
    }
    /**
     * Get all config
     */
    getAll() {
        const result = {};
        for (const [key, entry] of this.config) {
            result[key] = entry.value;
        }
        return result;
    }
    /**
     * Delete config
     */
    delete(key) {
        const existing = this.config.get(key);
        if (existing) {
            this.history.push({ key, oldValue: existing.value, newValue: undefined });
        }
        return this.config.delete(key);
    }
    /**
     * Has config
     */
    has(key) {
        return this.config.has(key);
    }
    /**
     * Get history
     */
    getHistory() {
        return [...this.history];
    }
    /**
     * Get history for key
     */
    getHistoryForKey(key) {
        return this.history.filter(h => h.key === key);
    }
    /**
     * Get stats
     */
    getStats() {
        const byType = {
            string: 0, number: 0, boolean: 0, object: 0
        };
        for (const entry of this.config.values()) {
            byType[entry.type]++;
        }
        return {
            entriesCount: this.config.size,
            byType,
            historyCount: this.history.length
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.config.clear();
        this.history = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const configTool = new ConfigTool();
export default configTool;
//# sourceMappingURL=config-tool.js.map