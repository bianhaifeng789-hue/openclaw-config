// @ts-nocheck
class BugReporter {
    reports = new Map();
    reportCounter = 0;
    submittedReports = [];
    config = {
        autoSubmit: false,
        includeContext: true
    };
    /**
     * Create report
     */
    createReport(type, title, description, errorStack, context) {
        const id = `bug-${++this.reportCounter}-${Date.now()}`;
        const report = {
            id,
            type,
            title,
            description,
            errorStack,
            context: this.config.includeContext ? context : undefined,
            createdAt: Date.now(),
            submitted: false
        };
        this.reports.set(id, report);
        if (this.config.autoSubmit) {
            this.submit(id);
        }
        return report;
    }
    /**
     * Create from error
     */
    createFromError(error, context) {
        return this.createReport('error', error.name, error.message, error.stack, context);
    }
    /**
     * Submit report
     */
    async submit(id) {
        const report = this.reports.get(id);
        if (!report)
            return false;
        // Would send to bug tracking service
        // For demo, mark as submitted
        report.submitted = true;
        this.submittedReports.push(id);
        console.log(`[BugReporter] Submitted: ${report.title}`);
        return true;
    }
    /**
     * Submit all pending
     */
    async submitAll() {
        const pending = Array.from(this.reports.values())
            .filter(r => !r.submitted);
        let submitted = 0;
        for (const report of pending) {
            if (await this.submit(report.id)) {
                submitted++;
            }
        }
        return submitted;
    }
    /**
     * Get report
     */
    getReport(id) {
        return this.reports.get(id);
    }
    /**
     * Get pending reports
     */
    getPendingReports() {
        return Array.from(this.reports.values())
            .filter(r => !r.submitted);
    }
    /**
     * Get submitted reports
     */
    getSubmittedReports() {
        return Array.from(this.reports.values())
            .filter(r => r.submitted);
    }
    /**
     * Delete report
     */
    deleteReport(id) {
        return this.reports.delete(id);
    }
    /**
     * Get stats
     */
    getStats() {
        const byType = {
            error: 0,
            crash: 0,
            performance: 0,
            usability: 0
        };
        for (const report of this.reports.values()) {
            byType[report.type]++;
        }
        return {
            totalReports: this.reports.size,
            pendingReports: this.getPendingReports().length,
            submittedReports: this.submittedReports.length,
            byType
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
        this.reports.clear();
        this.submittedReports = [];
        this.reportCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.config = {
            autoSubmit: false,
            includeContext: true
        };
    }
}
// Global singleton
export const bugReporter = new BugReporter();
export default bugReporter;
//# sourceMappingURL=bug-reporter.js.map