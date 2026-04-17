// @ts-nocheck
class BootstrapStateService {
    state = {
        steps: [],
        startTime: 0,
        endTime: null,
        overallStatus: 'initializing'
    };
    /**
     * Start bootstrap
     */
    start() {
        this.state.startTime = Date.now();
        this.state.overallStatus = 'initializing';
    }
    /**
     * Add step
     */
    addStep(id, name) {
        const step = {
            id,
            name,
            status: 'pending',
            durationMs: null
        };
        this.state.steps.push(step);
        return step;
    }
    /**
     * Start step
     */
    startStep(id) {
        const step = this.state.steps.find(s => s.id === id);
        if (!step)
            return false;
        step.status = 'running';
        return true;
    }
    /**
     * Complete step
     */
    completeStep(id) {
        const step = this.state.steps.find(s => s.id === id);
        if (!step)
            return false;
        step.status = 'completed';
        step.durationMs = Date.now() - this.state.startTime;
        this.checkOverallStatus();
        return true;
    }
    /**
     * Fail step
     */
    failStep(id, error) {
        const step = this.state.steps.find(s => s.id === id);
        if (!step)
            return false;
        step.status = 'failed';
        step.error = error;
        step.durationMs = Date.now() - this.state.startTime;
        this.state.overallStatus = 'failed';
        return true;
    }
    /**
     * Check overall status
     */
    checkOverallStatus() {
        const allCompleted = this.state.steps.every(s => s.status === 'completed');
        if (allCompleted) {
            this.state.endTime = Date.now();
            this.state.overallStatus = 'ready';
        }
    }
    /**
     * Get state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get step
     */
    getStep(id) {
        return this.state.steps.find(s => s.id === id);
    }
    /**
     * Get pending steps
     */
    getPendingSteps() {
        return this.state.steps.filter(s => s.status === 'pending');
    }
    /**
     * Get running steps
     */
    getRunningSteps() {
        return this.state.steps.filter(s => s.status === 'running');
    }
    /**
     * Get completed steps
     */
    getCompletedSteps() {
        return this.state.steps.filter(s => s.status === 'completed');
    }
    /**
     * Get failed steps
     */
    getFailedSteps() {
        return this.state.steps.filter(s => s.status === 'failed');
    }
    /**
     * Get progress
     */
    getProgress() {
        const completed = this.state.steps.filter(s => s.status === 'completed').length;
        const total = this.state.steps.length;
        return total > 0 ? completed / total : 0;
    }
    /**
     * Is ready
     */
    isReady() {
        return this.state.overallStatus === 'ready';
    }
    /**
     * Get total duration
     */
    getTotalDuration() {
        if (!this.state.endTime)
            return null;
        return this.state.endTime - this.state.startTime;
    }
    /**
     * Reset
     */
    reset() {
        this.state = {
            steps: [],
            startTime: 0,
            endTime: null,
            overallStatus: 'initializing'
        };
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            stepsCount: this.state.steps.length,
            completedCount: this.getCompletedSteps().length,
            failedCount: this.getFailedSteps().length,
            progress: this.getProgress(),
            totalDurationMs: this.getTotalDuration()
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
export const bootstrapStateService = new BootstrapStateService();
export default bootstrapStateService;
//# sourceMappingURL=bootstrap-state-service.js.map