// @ts-nocheck
class SleepTool {
    sleeps = [];
    sleepCounter = 0;
    /**
     * Sleep
     */
    async sleep(durationMs, reason) {
        const result = {
            durationMs,
            reason,
            completed: true,
            timestamp: Date.now()
        };
        // Would actually sleep
        // For demo, simulate
        await this.delay(10); // Minimal delay
        this.sleeps.push(result);
        return result;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Sleep seconds
     */
    async sleepSeconds(seconds, reason) {
        return this.sleep(seconds * 1000, reason);
    }
    /**
     * Sleep minutes
     */
    async sleepMinutes(minutes, reason) {
        return this.sleep(minutes * 60 * 1000, reason);
    }
    /**
     * Get sleeps
     */
    getSleeps() {
        return [...this.sleeps];
    }
    /**
     * Get recent sleeps
     */
    getRecent(count = 10) {
        return this.sleeps.slice(-count);
    }
    /**
     * Get total sleep time
     */
    getTotalSleepTime() {
        return this.sleeps.reduce((sum, s) => sum + s.durationMs, 0);
    }
    /**
     * Get stats
     */
    getStats() {
        const avgDuration = this.sleeps.length > 0
            ? this.sleeps.reduce((sum, s) => sum + s.durationMs, 0) / this.sleeps.length
            : 0;
        return {
            sleepsCount: this.sleeps.length,
            totalDurationMs: this.getTotalSleepTime(),
            averageDurationMs: avgDuration,
            completedCount: this.sleeps.filter(s => s.completed).length
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.sleeps = [];
        this.sleepCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const sleepTool = new SleepTool();
export default sleepTool;
//# sourceMappingURL=sleep-tool.js.map