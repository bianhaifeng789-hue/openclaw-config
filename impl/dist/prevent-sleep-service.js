// @ts-nocheck
class PreventSleepService {
    preventions = new Map();
    preventionCounter = 0;
    systemSleepPrevented = false;
    /**
     * Prevent system sleep
     */
    prevent(reason) {
        const id = `prevent-${++this.preventionCounter}`;
        const prevention = {
            id,
            reason,
            startTime: Date.now(),
            active: true
        };
        this.preventions.set(id, prevention);
        // Would call actual system API to prevent sleep
        // For demo, just set flag
        this.systemSleepPrevented = true;
        console.log(`[PreventSleep] Sleep prevented: ${reason}`);
        return prevention;
    }
    /**
     * Allow sleep (release prevention)
     */
    allow(id) {
        const prevention = this.preventions.get(id);
        if (!prevention)
            return false;
        prevention.active = false;
        this.preventions.delete(id);
        // Check if any active preventions remain
        const activeCount = Array.from(this.preventions.values()).filter(p => p.active).length;
        if (activeCount === 0) {
            this.systemSleepPrevented = false;
            console.log(`[PreventSleep] Sleep allowed`);
        }
        return true;
    }
    /**
     * Allow all (release all preventions)
     */
    allowAll() {
        const count = this.preventions.size;
        this.preventions.clear();
        this.systemSleepPrevented = false;
        console.log(`[PreventSleep] All ${count} preventions released`);
        return count;
    }
    /**
     * Check if sleep is prevented
     */
    isPrevented() {
        return this.systemSleepPrevented;
    }
    /**
     * Get active preventions
     */
    getActive() {
        return Array.from(this.preventions.values()).filter(p => p.active);
    }
    /**
     * Get prevention by ID
     */
    getById(id) {
        return this.preventions.get(id);
    }
    /**
     * Get stats
     */
    getStats() {
        const active = this.getActive();
        const longestActive = active.length > 0
            ? Math.max(...active.map(p => Date.now() - p.startTime))
            : null;
        return {
            activeCount: active.length,
            totalCount: this.preventions.size,
            systemSleepPrevented: this.systemSleepPrevented,
            longestActive
        };
    }
    /**
     * Auto-release preventions after timeout
     */
    async autoReleaseTimeout(timeoutMs) {
        const now = Date.now();
        for (const [id, prevention] of this.preventions) {
            if (now - prevention.startTime > timeoutMs) {
                this.allow(id);
            }
        }
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.preventions.clear();
        this.preventionCounter = 0;
        this.systemSleepPrevented = false;
    }
}
// Global singleton
export const preventSleepService = new PreventSleepService();
export default preventSleepService;
//# sourceMappingURL=prevent-sleep-service.js.map