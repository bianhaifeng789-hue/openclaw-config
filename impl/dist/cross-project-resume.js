// @ts-nocheck
class CrossProjectResume {
    transfers = [];
    /**
     * Create context snapshot
     */
    createSnapshot(projectPath, sessionId) {
        return {
            projectPath,
            sessionId,
            timestamp: Date.now(),
            recentFiles: [],
            recentCommands: [],
            memory: {}
        };
    }
    /**
     * Transfer context
     */
    transfer(sourceProject, targetProject, sessionId) {
        const snapshot = this.createSnapshot(sourceProject, sessionId);
        const context = {
            sourceProject,
            targetProject,
            sessionId,
            transferredAt: Date.now(),
            contextSnapshot: snapshot
        };
        this.transfers.push(context);
        return context;
    }
    /**
     * Apply context to new project
     */
    applyContext(context) {
        // Would restore session context in new project
        // For demo, return the snapshot
        return context.contextSnapshot;
    }
    /**
     * Get transfers
     */
    getTransfers() {
        return [...this.transfers];
    }
    /**
     * Get transfers by project
     */
    getByProject(projectPath) {
        return this.transfers.filter(t => t.sourceProject === projectPath || t.targetProject === projectPath);
    }
    /**
     * Get last transfer
     */
    getLastTransfer() {
        return this.transfers.length > 0
            ? this.transfers[this.transfers.length - 1]
            : null;
    }
    /**
     * Get stats
     */
    getStats() {
        const projects = new Set(this.transfers.flatMap(t => [t.sourceProject, t.targetProject]));
        return {
            transfersCount: this.transfers.length,
            uniqueProjects: projects.size,
            lastTransferTime: this.transfers.length > 0
                ? this.transfers[this.transfers.length - 1].transferredAt
                : null
        };
    }
    /**
     * Clear transfers
     */
    clear() {
        this.transfers = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const crossProjectResume = new CrossProjectResume();
export default crossProjectResume;
//# sourceMappingURL=cross-project-resume.js.map