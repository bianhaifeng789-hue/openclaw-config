// @ts-nocheck
class RemoteManagedSettings {
    settings = new Map();
    mdmSettings = new Map();
    policySettings = new Map();
    // Precedence order (higher number = higher priority)
    precedenceOrder = {
        'policy': 100,
        'mdm': 80,
        'remote': 60,
        'local': 40
    };
    /**
     * Set local setting
     */
    setLocal(key, value) {
        const existing = this.settings.get(key);
        // Check if locked
        if (existing?.locked && existing.source !== 'local') {
            throw new Error(`Setting ${key} is locked by ${existing.source}`);
        }
        const precedence = this.calculatePrecedence(key, 'local');
        const setting = {
            key,
            value,
            source: 'local',
            locked: existing?.locked ?? false,
            precedence
        };
        this.settings.set(key, setting);
        return setting;
    }
    /**
     * Set MDM setting
     */
    setMDM(key, value, locked = true) {
        this.mdmSettings.set(key, value);
        this.updateManagedSetting(key, value, 'mdm', locked);
    }
    /**
     * Set policy setting
     */
    setPolicy(key, value, locked = true) {
        this.policySettings.set(key, value);
        this.updateManagedSetting(key, value, 'policy', locked);
    }
    /**
     * Update managed setting
     */
    updateManagedSetting(key, value, source, locked) {
        const precedence = this.calculatePrecedence(key, source);
        const existing = this.settings.get(key);
        // Only update if higher precedence
        if (!existing || precedence >= existing.precedence) {
            this.settings.set(key, {
                key,
                value,
                source,
                locked,
                precedence
            });
        }
    }
    /**
     * Calculate precedence
     */
    calculatePrecedence(key, source) {
        return this.precedenceOrder[source] ?? 0;
    }
    /**
     * Get setting (resolves precedence)
     */
    get(key) {
        const setting = this.settings.get(key);
        return setting?.value;
    }
    /**
     * Get setting source
     */
    getSource(key) {
        const setting = this.settings.get(key);
        return setting?.source ?? null;
    }
    /**
     * Check if locked
     */
    isLocked(key) {
        const setting = this.settings.get(key);
        return setting?.locked ?? false;
    }
    /**
     * Get all locked settings
     */
    getLockedSettings() {
        return Array.from(this.settings.values()).filter(s => s.locked);
    }
    /**
     * Get settings by source
     */
    getBySource(source) {
        return Array.from(this.settings.values()).filter(s => s.source === source);
    }
    /**
     * Clear local setting
     */
    clearLocal(key) {
        const setting = this.settings.get(key);
        if (!setting || setting.source !== 'local')
            return false;
        return this.settings.delete(key);
    }
    /**
     * Get stats
     */
    getStats() {
        const bySource = {
            local: 0,
            mdm: 0,
            policy: 0,
            remote: 0
        };
        for (const setting of this.settings.values()) {
            bySource[setting.source]++;
        }
        const locked = Array.from(this.settings.values()).filter(s => s.locked).length;
        return {
            total: this.settings.size,
            locked,
            bySource
        };
    }
    /**
     * Clear all local settings
     */
    clearAllLocal() {
        let cleared = 0;
        for (const [key, setting] of this.settings) {
            if (setting.source === 'local') {
                this.settings.delete(key);
                cleared++;
            }
        }
        return cleared;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.settings.clear();
        this.mdmSettings.clear();
        this.policySettings.clear();
    }
}
// Global singleton
export const remoteManagedSettings = new RemoteManagedSettings();
export default remoteManagedSettings;
//# sourceMappingURL=remote-managed-settings.js.map