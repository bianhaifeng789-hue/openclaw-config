// @ts-nocheck
class AutoModeCircuitBreaker {
    state = 'disabled';
    consecutiveFailures = 0;
    totalFailures = 0;
    lastFailureTime = 0;
    circuitBrokenTime = 0;
    config = {
        maxConsecutiveFailures: 3,
        maxTotalFailures: 20,
        resetAfterMs: 30 * 60 * 1000, // 30 minutes
        cooldownMs: 60 * 1000, // 1 minute
    };
    /**
     * Check if auto mode is enabled
     * Returns undefined if cold start (not yet determined)
     */
    isEnabled() {
        // Check if circuit broken
        if (this.state === 'circuit-broken') {
            // Check if cooldown elapsed
            if (Date.now() - this.circuitBrokenTime > this.config.cooldownMs) {
                this.state = 'opt-in'; // Require opt-in after cooldown
                return false;
            }
            return false;
        }
        // Cold start - not yet determined
        if (this.state === 'disabled' && this.consecutiveFailures === 0) {
            return undefined;
        }
        return this.state === 'enabled';
    }
    /**
     * Enable auto mode
     */
    enable() {
        if (this.state === 'circuit-broken') {
            // Can't enable during circuit break
            return;
        }
        this.state = 'enabled';
        this.resetFailures();
    }
    /**
     * Disable auto mode
     */
    disable() {
        this.state = 'disabled';
    }
    /**
     * Set opt-in state (user needs to explicitly enable)
     */
    setOptIn() {
        this.state = 'opt-in';
    }
    /**
     * Record success (reset consecutive failures)
     */
    recordSuccess() {
        this.consecutiveFailures = 0;
        // Keep total failures for analytics
    }
    /**
     * Record failure (increment counters, potentially break circuit)
     */
    recordFailure() {
        this.consecutiveFailures++;
        this.totalFailures++;
        this.lastFailureTime = Date.now();
        // Check limits
        if (this.consecutiveFailures >= this.config.maxConsecutiveFailures ||
            this.totalFailures >= this.config.maxTotalFailures) {
            this.breakCircuit();
        }
    }
    /**
     * Break circuit (kick out of auto mode)
     */
    breakCircuit() {
        this.state = 'circuit-broken';
        this.circuitBrokenTime = Date.now();
        console.warn('[AutoMode] Circuit broken due to excessive failures');
    }
    /**
     * Reset failures
     */
    resetFailures() {
        this.consecutiveFailures = 0;
        // Don't reset total - keep for analytics
    }
    /**
     * Check if auto mode gate access is allowed
     * Async gate check for dynamic config
     */
    async checkGateAccess() {
        const enabled = this.isEnabled();
        // Cold start - need to determine state
        if (enabled === undefined) {
            // Would check dynamic config here (GrowthBook, env, etc.)
            // For now, default to disabled requiring opt-in
            this.state = 'opt-in';
            return false;
        }
        return enabled;
    }
    /**
     * Get circuit state
     */
    getState() {
        return this.state;
    }
    /**
     * Get failure stats
     */
    getStats() {
        return {
            consecutiveFailures: this.consecutiveFailures,
            totalFailures: this.totalFailures,
            lastFailureTime: this.lastFailureTime,
            circuitBrokenTime: this.state === 'circuit-broken' ? this.circuitBrokenTime : null
        };
    }
    /**
     * Update config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.state = 'disabled';
        this.consecutiveFailures = 0;
        this.totalFailures = 0;
        this.lastFailureTime = 0;
        this.circuitBrokenTime = 0;
    }
}
// Global singleton
export const autoModeCircuitBreaker = new AutoModeCircuitBreaker();
export default autoModeCircuitBreaker;
//# sourceMappingURL=auto-mode-circuit.js.map