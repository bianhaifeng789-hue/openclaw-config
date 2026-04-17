// @ts-nocheck
class ConcurrentSessions {
    sessions = new Map();
    maxSessions = 10;
    sessionCounter = 0;
    /**
     * Create session
     */
    create(modelId, projectId) {
        if (this.sessions.size >= this.maxSessions) {
            // Close oldest idle session
            this.closeOldestIdle();
        }
        const id = `session-${++this.sessionCounter}-${Date.now()}`;
        const session = {
            id,
            status: 'active',
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            modelId,
            projectId
        };
        this.sessions.set(id, session);
        return session;
    }
    /**
     * Close oldest idle session
     */
    closeOldestIdle() {
        const idle = Array.from(this.sessions.values())
            .filter(s => s.status === 'idle')
            .sort((a, b) => a.lastActiveAt - b.lastActiveAt);
        if (idle.length === 0)
            return false;
        this.close(idle[0].id);
        return true;
    }
    /**
     * Get session
     */
    get(id) {
        return this.sessions.get(id);
    }
    /**
     * Update activity
     */
    updateActivity(id) {
        const session = this.sessions.get(id);
        if (!session)
            return false;
        session.lastActiveAt = Date.now();
        return true;
    }
    /**
     * Set status
     */
    setStatus(id, status) {
        const session = this.sessions.get(id);
        if (!session)
            return false;
        session.status = status;
        if (status === 'active') {
            session.lastActiveAt = Date.now();
        }
        return true;
    }
    /**
     * Close session
     */
    close(id) {
        const session = this.sessions.get(id);
        if (!session)
            return false;
        session.status = 'closed';
        this.sessions.delete(id);
        return true;
    }
    /**
     * Get active sessions
     */
    getActive() {
        return Array.from(this.sessions.values())
            .filter(s => s.status === 'active');
    }
    /**
     * Get idle sessions
     */
    getIdle() {
        return Array.from(this.sessions.values())
            .filter(s => s.status === 'idle');
    }
    /**
     * Get by project
     */
    getByProject(projectId) {
        return Array.from(this.sessions.values())
            .filter(s => s.projectId === projectId);
    }
    /**
     * Get by model
     */
    getByModel(modelId) {
        return Array.from(this.sessions.values())
            .filter(s => s.modelId === modelId);
    }
    /**
     * Set max sessions
     */
    setMax(max) {
        this.maxSessions = max;
        // Close excess idle sessions
        while (this.sessions.size > this.maxSessions) {
            this.closeOldestIdle();
        }
    }
    /**
     * Get max sessions
     */
    getMax() {
        return this.maxSessions;
    }
    /**
     * Get stats
     */
    getStats() {
        const sessions = Array.from(this.sessions.values());
        return {
            sessionsCount: sessions.length,
            activeCount: sessions.filter(s => s.status === 'active').length,
            idleCount: sessions.filter(s => s.status === 'idle').length,
            pausedCount: sessions.filter(s => s.status === 'paused').length,
            maxSessions: this.maxSessions
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.sessions.clear();
        this.sessionCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.maxSessions = 10;
    }
}
// Global singleton
export const concurrentSessions = new ConcurrentSessions();
export default concurrentSessions;
//# sourceMappingURL=concurrent-sessions.js.map