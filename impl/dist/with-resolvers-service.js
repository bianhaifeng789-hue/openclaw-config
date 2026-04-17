// @ts-nocheck
class WithResolversService {
    promises = [];
    promiseCounter = 0;
    /**
     * Create promise with resolvers
     */
    create() {
        const id = `promise-${++this.promiseCounter}-${Date.now()}`;
        this.promises.push({
            id,
            resolved: false,
            rejected: false,
            createdAt: Date.now()
        });
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        // Wrap to track state
        const trackedResolve = (value) => {
            const entry = this.promises.find(p => p.id === id);
            if (entry)
                entry.resolved = true;
            resolve(value);
        };
        const trackedReject = (reason) => {
            const entry = this.promises.find(p => p.id === id);
            if (entry)
                entry.rejected = true;
            reject(reason);
        };
        return { promise, resolve: trackedResolve, reject: trackedReject };
    }
    /**
     * Deferred (alias)
     */
    deferred() {
        return this.create();
    }
    /**
     * Create timeout promise
     */
    timeout(ms, value) {
        const { promise, resolve, reject } = this.create();
        setTimeout(() => resolve(value), ms);
        return { promise, resolve, reject };
    }
    /**
     * Create race promise
     */
    race(promises) {
        const { promise, resolve, reject } = this.create();
        Promise.race(promises).then(resolve).catch(reject);
        return { promise, resolve, reject };
    }
    /**
     * Get stats
     */
    getStats() {
        const resolved = this.promises.filter(p => p.resolved);
        const rejected = this.promises.filter(p => p.rejected);
        const pending = this.promises.filter(p => !p.resolved && !p.rejected);
        return {
            promisesCount: this.promises.length,
            resolvedCount: resolved.length,
            rejectedCount: rejected.length,
            pendingCount: pending.length,
            resolutionRate: this.promises.length > 0 ? resolved.length / this.promises.length : 0
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.promises = [];
        this.promiseCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const withResolversService = new WithResolversService();
export default withResolversService;
//# sourceMappingURL=with-resolvers-service.js.map