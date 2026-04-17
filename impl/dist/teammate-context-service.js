// @ts-nocheck
class TeammateContextService {
    contexts = new Map();
    /**
     * Create context
     */
    create(sessionId, projectId, inheritedFlags) {
        const context = {
            sessionId,
            projectId,
            inheritedFlags,
            sharedState: {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.contexts.set(sessionId, context);
        return context;
    }
    /**
     * Get context
     */
    getContext(sessionId) {
        return this.contexts.get(sessionId);
    }
    /**
     * Update shared state
     */
    updateState(sessionId, state) {
        const context = this.contexts.get(sessionId);
        if (!context)
            return false;
        context.sharedState = { ...context.sharedState, ...state };
        context.updatedAt = Date.now();
        return true;
    }
    /**
     * Set parent context
     */
    setParent(sessionId, parentSessionId) {
        const context = this.contexts.get(sessionId);
        if (!context)
            return false;
        context.parentContext = parentSessionId;
        return true;
    }
    /**
     * Get inherited flags
     */
    getInheritedFlags(sessionId) {
        const context = this.contexts.get(sessionId);
        return context?.inheritedFlags ?? null;
    }
    /**
     * Check inherited flag
     */
    checkFlag(sessionId, flag) {
        const context = this.contexts.get(sessionId);
        return context?.inheritedFlags[flag] ?? false;
    }
    /**
     * Set inherited flag
     */
    setFlag(sessionId, flag, value) {
        const context = this.contexts.get(sessionId);
        if (!context)
            return false;
        context.inheritedFlags[flag] = value;
        context.updatedAt = Date.now();
        return true;
    }
    /**
     * Get contexts by project
     */
    getByProject(projectId) {
        return Array.from(this.contexts.values())
            .filter(c => c.projectId === projectId);
    }
    /**
     * Get child contexts
     */
    getChildren(parentSessionId) {
        return Array.from(this.contexts.values())
            .filter(c => c.parentContext === parentSessionId);
    }
    /**
     * Delete context
     */
    deleteContext(sessionId) {
        return this.contexts.delete(sessionId);
    }
    /**
     * Get stats
     */
    getStats() {
        const contexts = Array.from(this.contexts.values());
        const projects = new Set(contexts.map(c => c.projectId));
        const withParents = contexts.filter(c => c.parentContext).length;
        const avgFlags = contexts.length > 0
            ? contexts.reduce((sum, c) => sum + Object.keys(c.inheritedFlags).length, 0) / contexts.length
            : 0;
        return {
            contextsCount: contexts.length,
            projectsCount: projects.size,
            withParentsCount: withParents,
            averageFlags: avgFlags
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.contexts.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const teammateContextService = new TeammateContextService();
export default teammateContextService;
//# sourceMappingURL=teammate-context-service.js.map