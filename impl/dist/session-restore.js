// @ts-nocheck
class SessionRestore {
    checkpoints = new Map();
    checkpointCounter = 0;
    /**
     * Create checkpoint
     */
    createCheckpoint(sessionId, projectPath, state) {
        const id = `checkpoint-${++this.checkpointCounter}-${Date.now()}`;
        const checkpoint = {
            id,
            sessionId,
            projectPath,
            timestamp: Date.now(),
            state,
            canRecover: true
        };
        this.checkpoints.set(id, checkpoint);
        return checkpoint;
    }
    /**
     * Restore from checkpoint
     */
    restore(checkpointId) {
        const checkpoint = this.checkpoints.get(checkpointId);
        if (!checkpoint || !checkpoint.canRecover)
            return null;
        return checkpoint.state;
    }
    /**
     * Get checkpoint
     */
    getCheckpoint(id) {
        return this.checkpoints.get(id);
    }
    /**
     * Get checkpoints by session
     */
    getBySession(sessionId) {
        return Array.from(this.checkpoints.values())
            .filter(c => c.sessionId === sessionId);
    }
    /**
     * Get checkpoints by project
     */
    getByProject(projectPath) {
        return Array.from(this.checkpoints.values())
            .filter(c => c.projectPath === projectPath);
    }
    /**
     * Get latest checkpoint
     */
    getLatest(sessionId) {
        let checkpoints = Array.from(this.checkpoints.values());
        if (sessionId) {
            checkpoints = checkpoints.filter(c => c.sessionId === sessionId);
        }
        if (checkpoints.length === 0)
            return null;
        return checkpoints.reduce((latest, c) => c.timestamp > latest.timestamp ? c : latest);
    }
    /**
     * Mark checkpoint as unrecoverable
     */
    markUnrecoverable(id) {
        const checkpoint = this.checkpoints.get(id);
        if (!checkpoint)
            return false;
        checkpoint.canRecover = false;
        return true;
    }
    /**
     * Delete checkpoint
     */
    deleteCheckpoint(id) {
        return this.checkpoints.delete(id);
    }
    /**
     * Get stats
     */
    getStats() {
        const checkpoints = Array.from(this.checkpoints.values());
        const sessions = new Set(checkpoints.map(c => c.sessionId));
        const projects = new Set(checkpoints.map(c => c.projectPath));
        return {
            checkpointsCount: checkpoints.length,
            recoverableCount: checkpoints.filter(c => c.canRecover).length,
            sessionsCount: sessions.size,
            projectsCount: projects.size
        };
    }
    /**
     * Clear all checkpoints
     */
    clear() {
        this.checkpoints.clear();
        this.checkpointCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const sessionRestore = new SessionRestore();
export default sessionRestore;
//# sourceMappingURL=session-restore.js.map