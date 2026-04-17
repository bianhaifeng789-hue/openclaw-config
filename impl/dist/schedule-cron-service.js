// @ts-nocheck
class ScheduleCronService {
    jobs = new Map();
    jobCounter = 0;
    /**
     * Create cron job
     */
    create(name, expression, command) {
        const id = `cron-${++this.jobCounter}-${Date.now()}`;
        const job = {
            id,
            name,
            expression,
            command,
            active: true,
            runsCount: 0,
            createdAt: Date.now()
        };
        this.jobs.set(id, job);
        return job;
    }
    /**
     * Run job
     */
    run(id) {
        const job = this.jobs.get(id);
        if (!job || !job.active)
            return false;
        job.lastRun = Date.now();
        job.runsCount++;
        return true;
    }
    /**
     * Pause job
     */
    pause(id) {
        const job = this.jobs.get(id);
        if (!job)
            return false;
        job.active = false;
        return true;
    }
    /**
     * Resume job
     */
    resume(id) {
        const job = this.jobs.get(id);
        if (!job)
            return false;
        job.active = true;
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
     * Get active jobs
     */
    getActive() {
        return Array.from(this.jobs.values())
            .filter(j => j.active);
    }
    /**
     * Get all jobs
     */
    getAll() {
        return Array.from(this.jobs.values());
    }
    /**
     * Get stats
     */
    getStats() {
        const jobs = Array.from(this.jobs.values());
        return {
            jobsCount: jobs.length,
            activeCount: jobs.filter(j => j.active).length,
            pausedCount: jobs.filter(j => !j.active).length,
            totalRuns: jobs.reduce((sum, j) => sum + j.runsCount, 0)
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.jobs.clear();
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
export const scheduleCronService = new ScheduleCronService();
export default scheduleCronService;
//# sourceMappingURL=schedule-cron-service.js.map