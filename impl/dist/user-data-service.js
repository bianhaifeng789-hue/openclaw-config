// @ts-nocheck
class UserDataService {
    users = new Map();
    sessions = new Map();
    currentUser = null;
    sessionCounter = 0;
    /**
     * Create user
     */
    createUser(userId, name, email) {
        const user = {
            userId,
            name,
            email,
            preferences: {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.users.set(userId, user);
        return user;
    }
    /**
     * Get user
     */
    getUser(userId) {
        return this.users.get(userId);
    }
    /**
     * Get current user
     */
    getCurrentUser() {
        if (!this.currentUser)
            return null;
        return this.users.get(this.currentUser) ?? null;
    }
    /**
     * Set current user
     */
    setCurrentUser(userId) {
        this.currentUser = userId;
    }
    /**
     * Update user
     */
    updateUser(userId, updates) {
        const user = this.users.get(userId);
        if (!user)
            return null;
        Object.assign(user, updates);
        user.updatedAt = Date.now();
        return user;
    }
    /**
     * Set preference
     */
    setPreference(userId, key, value) {
        const user = this.users.get(userId);
        if (!user)
            return;
        user.preferences[key] = value;
        user.updatedAt = Date.now();
    }
    /**
     * Get preference
     */
    getPreference(userId, key) {
        const user = this.users.get(userId);
        return user?.preferences[key];
    }
    /**
     * Create session
     */
    createSession(userId, metadata) {
        const sessionId = `session-${++this.sessionCounter}-${Date.now()}`;
        const session = {
            sessionId,
            userId,
            startTime: Date.now(),
            endTime: null,
            metadata
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    /**
     * End session
     */
    endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        session.endTime = Date.now();
        return true;
    }
    /**
     * Get session
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * Get user sessions
     */
    getUserSessions(userId) {
        return Array.from(this.sessions.values())
            .filter(s => s.userId === userId);
    }
    /**
     * Get active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values())
            .filter(s => s.endTime === null);
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            userCount: this.users.size,
            sessionCount: this.sessions.size,
            activeSessions: this.getActiveSessions().length,
            currentUser: this.currentUser
        };
    }
    /**
     * Delete user
     */
    deleteUser(userId) {
        return this.users.delete(userId);
    }
    /**
     * Clear all
     */
    clear() {
        this.users.clear();
        this.sessions.clear();
        this.currentUser = null;
        this.sessionCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const userDataService = new UserDataService();
export default userDataService;
//# sourceMappingURL=user-data-service.js.map