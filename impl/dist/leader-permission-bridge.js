// @ts-nocheck
class LeaderPermissionBridge {
    requests = new Map();
    requestCounter = 0;
    leaderSessionId = null;
    /**
     * Set leader
     */
    setLeader(sessionId) {
        this.leaderSessionId = sessionId;
    }
    /**
     * Get leader
     */
    getLeader() {
        return this.leaderSessionId;
    }
    /**
     * Request permission
     */
    request(sessionId, action, params) {
        const id = `perm-${++this.requestCounter}-${Date.now()}`;
        const req = {
            id,
            sessionId,
            action,
            params,
            approved: null,
            requestedAt: Date.now(),
            resolvedAt: null
        };
        this.requests.set(id, req);
        return req;
    }
    /**
     * Approve permission
     */
    approve(requestId) {
        const req = this.requests.get(requestId);
        if (!req)
            return false;
        req.approved = true;
        req.resolvedAt = Date.now();
        return true;
    }
    /**
     * Deny permission
     */
    deny(requestId, reason) {
        const req = this.requests.get(requestId);
        if (!req)
            return false;
        req.approved = false;
        req.resolvedAt = Date.now();
        return true;
    }
    /**
     * Check if approved
     */
    isApproved(requestId) {
        const req = this.requests.get(requestId);
        return req?.approved === true;
    }
    /**
     * Get pending requests
     */
    getPending() {
        return Array.from(this.requests.values())
            .filter(r => r.approved === null);
    }
    /**
     * Get request
     */
    getRequest(id) {
        return this.requests.get(id);
    }
    /**
     * Get requests by session
     */
    getBySession(sessionId) {
        return Array.from(this.requests.values())
            .filter(r => r.sessionId === sessionId);
    }
    /**
     * Auto-approve safe actions
     */
    autoApproveSafe(requestId) {
        const req = this.requests.get(requestId);
        if (!req)
            return false;
        const safeActions = ['read', 'list', 'status', 'info'];
        if (safeActions.some(a => req.action.startsWith(a))) {
            req.approved = true;
            req.resolvedAt = Date.now();
            return true;
        }
        return false;
    }
    /**
     * Get stats
     */
    getStats() {
        const requests = Array.from(this.requests.values());
        const approved = requests.filter(r => r.approved === true);
        const denied = requests.filter(r => r.approved === false);
        const pending = requests.filter(r => r.approved === null);
        const resolved = requests.filter(r => r.resolvedAt !== null);
        const avgResponse = resolved.length > 0
            ? resolved.reduce((sum, r) => sum + (r.resolvedAt - r.requestedAt), 0) / resolved.length
            : 0;
        return {
            requestsCount: requests.length,
            approvedCount: approved.length,
            deniedCount: denied.length,
            pendingCount: pending.length,
            averageResponseTimeMs: avgResponse
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.requests.clear();
        this.leaderSessionId = null;
        this.requestCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const leaderPermissionBridge = new LeaderPermissionBridge();
export default leaderPermissionBridge;
//# sourceMappingURL=leader-permission-bridge.js.map