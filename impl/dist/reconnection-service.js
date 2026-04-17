// @ts-nocheck
class ReconnectionService {
    states = new Map();
    config = {
        maxAttempts: 5,
        initialBackoffMs: 1000,
        maxBackoffMs: 30000,
        backoffMultiplier: 2
    };
    /**
     * Initialize reconnection
     */
    init(sessionId, target) {
        const state = {
            sessionId,
            target,
            attempts: 0,
            maxAttempts: this.config.maxAttempts,
            lastAttempt: 0,
            status: 'disconnected',
            backoffMs: this.config.initialBackoffMs
        };
        this.states.set(sessionId, state);
        return state;
    }
    /**
     * Attempt reconnection
     */
    async attempt(sessionId) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        if (state.attempts >= state.maxAttempts) {
            state.status = 'failed';
            return false;
        }
        state.status = 'connecting';
        state.attempts++;
        state.lastAttempt = Date.now();
        // Would attempt actual connection
        // For demo, simulate success after delay
        await this.delay(state.backoffMs);
        // Simulate 70% success rate
        const success = Math.random() < 0.7;
        if (success) {
            state.status = 'connected';
            return true;
        }
        // Update backoff
        state.backoffMs = Math.min(state.backoffMs * this.config.backoffMultiplier, this.config.maxBackoffMs);
        state.status = 'disconnected';
        return false;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get state
     */
    getState(sessionId) {
        return this.states.get(sessionId);
    }
    /**
     * Mark connected
     */
    markConnected(sessionId) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        state.status = 'connected';
        state.attempts = 0;
        state.backoffMs = this.config.initialBackoffMs;
        return true;
    }
    /**
     * Mark disconnected
     */
    markDisconnected(sessionId) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        state.status = 'disconnected';
        return true;
    }
    /**
     * Reset attempts
     */
    resetAttempts(sessionId) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        state.attempts = 0;
        state.backoffMs = this.config.initialBackoffMs;
        return true;
    }
    /**
     * Get next backoff time
     */
    getNextBackoff(sessionId) {
        const state = this.states.get(sessionId);
        return state?.backoffMs ?? this.config.initialBackoffMs;
    }
    /**
     * Get pending reconnections
     */
    getPending() {
        return Array.from(this.states.values())
            .filter(s => s.status === 'disconnected' && s.attempts < s.maxAttempts);
    }
    /**
     * Get connected sessions
     */
    getConnected() {
        return Array.from(this.states.values())
            .filter(s => s.status === 'connected');
    }
    /**
     * Get stats
     */
    getStats() {
        const states = Array.from(this.states.values());
        const avgAttempts = states.length > 0
            ? states.reduce((sum, s) => sum + s.attempts, 0) / states.length
            : 0;
        return {
            totalSessions: states.length,
            connectedCount: states.filter(s => s.status === 'connected').length,
            pendingCount: states.filter(s => s.status === 'disconnected').length,
            failedCount: states.filter(s => s.status === 'failed').length,
            averageAttempts: avgAttempts
        };
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Clear all
     */
    clear() {
        this.states.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.config = {
            maxAttempts: 5,
            initialBackoffMs: 1000,
            maxBackoffMs: 30000,
            backoffMultiplier: 2
        };
    }
}
// Global singleton
export const reconnectionService = new ReconnectionService();
export default reconnectionService;
//# sourceMappingURL=reconnection-service.js.map