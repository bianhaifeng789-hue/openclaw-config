// @ts-nocheck
class TeammateService {
    teammates = new Map();
    connections = new Map();
    /**
     * Register teammate
     */
    register(id, sessionId, projectId, role) {
        const info = {
            id,
            sessionId,
            projectId,
            role,
            connected: true,
            lastSeen: Date.now(),
            sharedContext: {}
        };
        this.teammates.set(id, info);
        return info;
    }
    /**
     * Get teammate
     */
    getTeammate(id) {
        return this.teammates.get(id);
    }
    /**
     * Update shared context
     */
    updateContext(id, context) {
        const teammate = this.teammates.get(id);
        if (!teammate)
            return false;
        teammate.sharedContext = { ...teammate.sharedContext, ...context };
        teammate.lastSeen = Date.now();
        return true;
    }
    /**
     * Get shared context
     */
    getSharedContext(id) {
        const teammate = this.teammates.get(id);
        return teammate?.sharedContext ?? null;
    }
    /**
     * Connect teammates
     */
    connect(fromId, toId) {
        const from = this.teammates.get(fromId);
        const to = this.teammates.get(toId);
        if (!from || !to)
            return false;
        const connId = `${fromId}-${toId}`;
        this.connections.set(connId, { from: fromId, to: toId, status: 'connected' });
        from.connected = true;
        to.connected = true;
        return true;
    }
    /**
     * Disconnect teammates
     */
    disconnect(fromId, toId) {
        const connId = `${fromId}-${toId}`;
        const conn = this.connections.get(connId);
        if (!conn)
            return false;
        conn.status = 'disconnected';
        return true;
    }
    /**
     * Get connections
     */
    getConnections() {
        return Array.from(this.connections.values());
    }
    /**
     * Get teammates by project
     */
    getByProject(projectId) {
        return Array.from(this.teammates.values())
            .filter(t => t.projectId === projectId);
    }
    /**
     * Get connected teammates
     */
    getConnected() {
        return Array.from(this.teammates.values())
            .filter(t => t.connected);
    }
    /**
     * Update last seen
     */
    updateLastSeen(id) {
        const teammate = this.teammates.get(id);
        if (!teammate)
            return false;
        teammate.lastSeen = Date.now();
        return true;
    }
    /**
     * Disconnect teammate
     */
    disconnectTeammate(id) {
        const teammate = this.teammates.get(id);
        if (!teammate)
            return false;
        teammate.connected = false;
        return true;
    }
    /**
     * Get stats
     */
    getStats() {
        const projects = new Set(Array.from(this.teammates.values()).map(t => t.projectId));
        return {
            teammatesCount: this.teammates.size,
            connectedCount: this.getConnected().length,
            connectionsCount: this.connections.size,
            projectsCount: projects.size
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.teammates.clear();
        this.connections.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const teammateService = new TeammateService();
export default teammateService;
//# sourceMappingURL=teammate-service.js.map