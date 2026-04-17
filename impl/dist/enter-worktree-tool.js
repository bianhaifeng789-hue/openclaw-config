// @ts-nocheck
class EnterWorktreeTool {
    contexts = [];
    contextCounter = 0;
    currentContext = null;
    /**
     * Enter worktree
     */
    enter(path, branch, previousPath) {
        const id = `worktree-${++this.contextCounter}-${Date.now()}`;
        const context = {
            id,
            path,
            branch,
            previousPath: previousPath ?? process.cwd(),
            enteredAt: Date.now()
        };
        this.contexts.push(context);
        this.currentContext = context;
        return context;
    }
    /**
     * Get current context
     */
    getCurrentContext() {
        return this.currentContext;
    }
    /**
     * Get context
     */
    getContext(id) {
        return this.contexts.find(c => c.id === id);
    }
    /**
     * Get all contexts
     */
    getAllContexts() {
        return [...this.contexts];
    }
    /**
     * Get active contexts
     */
    getActive() {
        return this.contexts.filter(c => !c.exitedAt);
    }
    /**
     * Get stats
     */
    getStats() {
        const exited = this.contexts.filter(c => c.exitedAt);
        const branches = new Set(this.contexts.map(c => c.branch));
        return {
            contextsCount: this.contexts.length,
            activeCount: this.contexts.filter(c => !c.exitedAt).length,
            exitedCount: exited.length,
            uniqueBranches: branches.size
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.contexts = [];
        this.currentContext = null;
        this.contextCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const enterWorktreeTool = new EnterWorktreeTool();
export default enterWorktreeTool;
//# sourceMappingURL=enter-worktree-tool.js.map