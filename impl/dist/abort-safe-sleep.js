// @ts-nocheck
/**
 * Abort-Safe Sleep Pattern - 可中断睡眠
 */
class AbortSafeSleep {
    sleepsCount = 0;
    /**
     * Sleep that can be aborted
     */
    async sleep(ms, signal) {
        this.sleepsCount++;
        if (signal?.aborted) {
            throw new DOMException('Sleep aborted', 'AbortError');
        }
        return new Promise((resolve, reject) => {
            if (signal?.aborted) {
                reject(new DOMException('Sleep aborted', 'AbortError'));
                return;
            }
            const abortHandler = () => {
                clearTimeout(timer);
                reject(new DOMException('Sleep aborted', 'AbortError'));
            };
            const timer = setTimeout(() => {
                if (signal) {
                    signal.removeEventListener('abort', abortHandler);
                }
                resolve();
            }, ms);
            if (signal) {
                signal.addEventListener('abort', abortHandler, { once: true });
            }
        });
    }
    /**
     * Sleep with abort controller
     */
    sleepWithAbort(ms) {
        const controller = new AbortController();
        const promise = this.sleep(ms, controller.signal);
        return {
            promise,
            abort: () => controller.abort()
        };
    }
    /**
     * Get stats
     */
    getStats() {
        return { sleepsCount: this.sleepsCount };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.sleepsCount = 0;
    }
}
// Global singleton
export const abortSafeSleep = new AbortSafeSleep();
export default abortSafeSleep;
//# sourceMappingURL=abort-safe-sleep.js.map