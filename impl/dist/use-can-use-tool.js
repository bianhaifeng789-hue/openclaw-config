// @ts-nocheck
class UseCanUseTool {
    permissions = new Map();
    globalAllowed = true;
    restrictedTools = new Set();
    checkHistory = [];
    /**
     * Check if can use tool
     */
    canUse(toolId) {
        if (!this.globalAllowed) {
            this.recordCheck(toolId, false);
            return false;
        }
        if (this.restrictedTools.has(toolId)) {
            this.recordCheck(toolId, false);
            return false;
        }
        const permission = this.permissions.get(toolId);
        if (!permission) {
            this.recordCheck(toolId, true);
            return true;
        }
        // Check conditions
        if (permission.conditions) {
            for (const condition of permission.conditions) {
                if (!this.checkCondition(condition)) {
                    this.recordCheck(toolId, false);
                    return false;
                }
            }
        }
        permission.lastChecked = Date.now();
        this.recordCheck(toolId, permission.allowed);
        return permission.allowed;
    }
    /**
     * Check condition
     */
    checkCondition(condition) {
        switch (condition.type) {
            case 'mode':
                // Would check current mode
                return true;
            case 'session':
                // Would check session state
                return true;
            default:
                return true;
        }
    }
    /**
     * Record check
     */
    recordCheck(toolId, allowed) {
        this.checkHistory.push({
            toolId,
            allowed,
            timestamp: Date.now()
        });
    }
    /**
     * Set permission
     */
    setPermission(toolId, allowed, conditions) {
        this.permissions.set(toolId, {
            toolId,
            allowed,
            conditions,
            lastChecked: Date.now()
        });
    }
    /**
     * Remove permission
     */
    removePermission(toolId) {
        return this.permissions.delete(toolId);
    }
    /**
     * Restrict tool
     */
    restrict(toolId) {
        this.restrictedTools.add(toolId);
    }
    /**
     * Unrestrict tool
     */
    unrestrict(toolId) {
        this.restrictedTools.delete(toolId);
    }
    /**
     * Set global allowed
     */
    setGlobalAllowed(allowed) {
        this.globalAllowed = allowed;
    }
    /**
     * Get permission
     */
    getPermission(toolId) {
        return this.permissions.get(toolId);
    }
    /**
     * Get restricted tools
     */
    getRestrictedTools() {
        return Array.from(this.restrictedTools);
    }
    /**
     * Get check history
     */
    getHistory() {
        return [...this.checkHistory];
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.checkHistory = [];
    }
    /**
     * Get stats
     */
    getStats() {
        const checks = this.checkHistory;
        const allowed = checks.filter(c => c.allowed).length;
        return {
            permissionsCount: this.permissions.size,
            restrictedCount: this.restrictedTools.size,
            checksCount: checks.length,
            allowedRate: checks.length > 0 ? allowed / checks.length : 0
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.permissions.clear();
        this.globalAllowed = true;
        this.restrictedTools.clear();
        this.checkHistory = [];
    }
}
// Global singleton
export const useCanUseTool = new UseCanUseTool();
export default useCanUseTool;
//# sourceMappingURL=use-can-use-tool.js.map