// @ts-nocheck
class WithResolversPolyfill {
    /**
     * Promise.withResolvers polyfill
     * Creates promise with resolve/reject exposed
     */
    withResolvers() {
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return {
            promise,
            resolve: resolve,
            reject: reject
        };
    }
    /**
     * Pending promise with status tracking
     */
    pending() {
        let resolve;
        let reject;
        const state = {
            promise: new Promise((res, rej) => {
                resolve = (value) => {
                    state.status = 'resolved';
                    state.value = value;
                    res(value);
                };
                reject = (reason) => {
                    state.status = 'rejected';
                    state.reason = reason;
                    rej(reason);
                };
            }),
            resolve: undefined,
            reject: undefined,
            status: 'pending'
        };
        state.resolve = resolve;
        state.reject = reject;
        return state;
    }
    /**
     * Deferred promise (classic deferred pattern)
     */
    deferred() {
        const pending = this.pending();
        return {
            promise: pending.promise,
            resolve: pending.resolve,
            reject: pending.reject,
            isResolved: () => pending.status === 'resolved',
            isRejected: () => pending.status === 'rejected',
            isPending: () => pending.status === 'pending'
        };
    }
    /**
     * Create timeout promise with resolvers
     */
    timeout(ms, onTimeout) {
        const { promise, resolve, reject } = this.withResolvers();
        const timer = setTimeout(() => {
            if (onTimeout) {
                resolve(onTimeout());
            }
            else {
                reject(new Error(`Timeout after ${ms}ms`));
            }
        }, ms);
        const cancel = () => {
            clearTimeout(timer);
            reject(new Error('Timeout cancelled'));
        };
        // Unref timer
        if (typeof timer.unref === 'function') {
            timer.unref();
        }
        return { promise, resolve, reject, cancel };
    }
    /**
     * Race with resolvers (multiple promises)
     */
    raceWithResolvers(promises) {
        const { promise, resolve, reject } = this.withResolvers();
        const cleanup = () => {
            // Would cancel any pending promises if they support cancellation
        };
        Promise.race(promises)
            .then(value => {
            cleanup();
            resolve(value);
        })
            .catch(reason => {
            cleanup();
            reject(reason);
        });
        return { promise, resolve, reject, cancel: cleanup };
    }
    /**
     * Create lazy promise (only executes when awaited)
     */
    lazy(fn) {
        let executed = false;
        let { promise, resolve, reject } = this.withResolvers();
        const execute = () => {
            if (executed)
                return;
            executed = true;
            fn()
                .then(resolve)
                .catch(reject);
        };
        // Override then to trigger execution
        const lazyPromise = {
            then: (onFulfilled, onRejected) => {
                execute();
                return promise.then(onFulfilled, onRejected);
            },
            catch: (onRejected) => {
                execute();
                return promise.catch(onRejected);
            },
            finally: (onFinally) => {
                execute();
                return promise.finally(onFinally);
            },
            execute
        };
        return lazyPromise;
    }
    /**
     * Reset for testing
     */
    _reset() {
        // No state
    }
}
// Global singleton
export const withResolversPolyfill = new WithResolversPolyfill();
// Export convenience function
export const withResolvers = withResolversPolyfill.withResolvers.bind(withResolversPolyfill);
export default withResolversPolyfill;
//# sourceMappingURL=with-resolvers.js.map