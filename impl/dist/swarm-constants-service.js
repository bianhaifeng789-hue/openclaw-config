// @ts-nocheck
class SwarmConstantsService {
    constants = {
        MAX_AGENTS: 50,
        MAX_TASKS: 100,
        MAX_RETRIES: 5,
        HEARTBEAT_INTERVAL_MS: 30000,
        HEARTBEAT_TIMEOUT_MS: 120000,
        TASK_TIMEOUT_MS: 60000,
        BACKOFF_INITIAL_MS: 1000,
        BACKOFF_MAX_MS: 30000,
        QUEUE_MAX_SIZE: 1000,
        MESSAGE_MAX_SIZE: 1024 * 1024 // 1MB
    };
    /**
     * Get constants
     */
    get() {
        return { ...this.constants };
    }
    /**
     * Get single constant
     */
    getValue(key) {
        return this.constants[key];
    }
    /**
     * Set constant
     */
    set(key, value) {
        this.constants[key] = value;
    }
    /**
     * Get max agents
     */
    getMaxAgents() {
        return this.constants.MAX_AGENTS;
    }
    /**
     * Get max tasks
     */
    getMaxTasks() {
        return this.constants.MAX_TASKS;
    }
    /**
     * Get heartbeat interval
     */
    getHeartbeatInterval() {
        return this.constants.HEARTBEAT_INTERVAL_MS;
    }
    /**
     * Get heartbeat timeout
     */
    getHeartbeatTimeout() {
        return this.constants.HEARTBEAT_TIMEOUT_MS;
    }
    /**
     * Get task timeout
     */
    getTaskTimeout() {
        return this.constants.TASK_TIMEOUT_MS;
    }
    /**
     * Get backoff
     */
    getBackoff(attempt) {
        const backoff = this.constants.BACKOFF_INITIAL_MS * Math.pow(2, attempt);
        return Math.min(backoff, this.constants.BACKOFF_MAX_MS);
    }
    /**
     * Validate within limits
     */
    validateLimits(agents, tasks) {
        return agents <= this.constants.MAX_AGENTS && tasks <= this.constants.MAX_TASKS;
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            constantsCount: Object.keys(this.constants).length,
            allConstants: this.get()
        };
    }
    /**
     * Reset to defaults
     */
    reset() {
        this.constants = {
            MAX_AGENTS: 50,
            MAX_TASKS: 100,
            MAX_RETRIES: 5,
            HEARTBEAT_INTERVAL_MS: 30000,
            HEARTBEAT_TIMEOUT_MS: 120000,
            TASK_TIMEOUT_MS: 60000,
            BACKOFF_INITIAL_MS: 1000,
            BACKOFF_MAX_MS: 30000,
            QUEUE_MAX_SIZE: 1000,
            MESSAGE_MAX_SIZE: 1024 * 1024
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.reset();
    }
}
// Global singleton
export const swarmConstantsService = new SwarmConstantsService();
export default swarmConstantsService;
//# sourceMappingURL=swarm-constants-service.js.map