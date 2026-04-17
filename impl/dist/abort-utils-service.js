// @ts-nocheck
class AbortUtilsService {
    controllers = new Map();
    controllerCounter = 0;
    /**
     * Create controller
     */
    create() {
        const id = `abort-${++this.controllerCounter}-${Date.now()}`;
        const controller = {
            id,
            aborted: false,
            createdAt: Date.now()
        };
        this.controllers.set(id, controller);
        return controller;
    }
    /**
     * Abort controller
     */
    abort(id, reason) {
        const controller = this.controllers.get(id);
        if (!controller || controller.aborted)
            return false;
        controller.aborted = true;
        controller.reason = reason;
        controller.abortedAt = Date.now();
        return true;
    }
    /**
     * Check aborted
     */
    isAborted(id) {
        return this.controllers.get(id)?.aborted ?? false;
    }
    /**
     * Get controller
     */
    getController(id) {
        return this.controllers.get(id);
    }
    /**
     * Get aborted controllers
     */
    getAborted() {
        return Array.from(this.controllers.values())
            .filter(c => c.aborted);
    }
    /**
     * Get active controllers
     */
    getActive() {
        return Array.from(this.controllers.values())
            .filter(c => !c.aborted);
    }
    /**
     * Combined abort signal
     */
    combine(ids) {
        const combined = this.create();
        for (const id of ids) {
            if (this.isAborted(id)) {
                this.abort(combined.id, `Signal ${id} already aborted`);
                break;
            }
        }
        return combined;
    }
    /**
     * Get stats
     */
    getStats() {
        const controllers = Array.from(this.controllers.values());
        return {
            controllersCount: controllers.length,
            abortedCount: controllers.filter(c => c.aborted).length,
            activeCount: controllers.filter(c => !c.aborted).length,
            abortRate: controllers.length > 0 ? controllers.filter(c => c.aborted).length / controllers.length : 0
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.controllers.clear();
        this.controllerCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const abortUtilsService = new AbortUtilsService();
export default abortUtilsService;
//# sourceMappingURL=abort-utils-service.js.map