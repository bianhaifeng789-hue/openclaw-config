// @ts-nocheck
class ScheduleCronTool {
    jobs = new Map();
    jobCounter = 0;
    executions = [];
    /**
     * Create job
     */
    create(name, expression, handler) {
        const id = `cron-${++this.jobCounter}-${Date.now()}`;
        const job = {
            id,
            name,
            expression,
            handler,
            enabled: true,
            lastRun: null,
            nextRun: this.calculateNextRun(expression),
            runsCount: 0
        };
        this.jobs.set(id, job);
        return job;
    }
    /**
     * Calculate next run
     */
    calculateNextRun(expression) {
        // Would parse cron expression
        // For demo, simulate
        return Date.now() + 60000; // 1 minute
    }
    /**
     * Enable job
     */
    enable(id) {
        const job = this.jobs.get(id);
        if (!job)
            return false;
        job.enabled = true;
        job.nextRun = this.calculateNextRun(job.expression);
        return true;
    }
    /**
     * Disable job
     */
    disable(id) {
        const job = this.jobs.get(id);
        if (!job)
            return false;
        job.enabled = false;
        job.nextRun = null;
        return true;
    }
    /**
     * Run job
     */
    run(id) {
        const job = this.jobs.get(id);
        if (!job || !job.enabled)
            return false;
        // Would execute handler
        job.lastRun = Date.now();
        job.nextRun = this.calculateNextRun(job.expression);
        job.runsCount++;
        this.executions.push({ jobId: id, success: true, timestamp: Date.now() });
        return true;
    }
    /**
     * Delete job
     */
    delete(id) {
        return this.jobs.delete(id);
    }
    /**
     * Get job
     */
    getJob(id) {
        return this.jobs.get(id);
    }
    /**
     * Get all jobs
     */
    getAllJobs() {
        return Array.from(this.jobs.values());
    }
    /**
     * Get enabled jobs
     */
    getEnabled() {
        return Array.from(this.jobs.values())
            .filter(j => j.enabled);
    }
    /**
     * Get due jobs
     */
    getDueJobs() {
        const now = Date.now();
        return Array.from(this.jobs.values())
            .filter(j => j.enabled && j.nextRun !== null && j.nextRun <= now);
    }
    /**
     * Get executions
     */
    getExecutions() {
        return [...this.executions];
    }
    /**
     * Get stats
     */
    getStats() {
        const jobs = Array.from(this.jobs.values());
        const executions = this.executions;
        const successful = executions.filter(e => e.success).length;
        return {
            jobsCount: jobs.length,
            enabledCount: jobs.filter(j => j.enabled).length,
            dueCount: this.getDueJobs().length,
            executionsCount: executions.length,
            successRate: executions.length > 0 ? successful / executions.length : 0
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.jobs.clear();
        this.executions = [];
        this.jobCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const scheduleCronTool = new ScheduleCronTool();
export default scheduleCronTool;
//# sourceMappingURL=schedule-cron-tool.js.map