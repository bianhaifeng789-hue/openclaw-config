// @ts-nocheck
class WorktreeUtils {
    worktrees = new Map();
    mainWorktree = null;
    currentWorktree = null;
    /**
     * Create worktree
     */
    async create(branch, path) {
        // Would use git worktree add
        // For demo, simulate
        const worktreePath = path ?? `../${branch}`;
        const info = {
            path: worktreePath,
            branch,
            commit: 'abc123',
            isMain: false,
            locked: false
        };
        this.worktrees.set(worktreePath, info);
        return info;
    }
    /**
     * Remove worktree
     */
    async remove(path) {
        // Would use git worktree remove
        const info = this.worktrees.get(path);
        if (!info)
            return false;
        if (info.locked) {
            console.warn(`[Worktree] Worktree ${path} is locked`);
            return false;
        }
        this.worktrees.delete(path);
        return true;
    }
    /**
     * List worktrees
     */
    list() {
        return Array.from(this.worktrees.values());
    }
    /**
     * Get worktree info
     */
    get(path) {
        return this.worktrees.get(path);
    }
    /**
     * Set main worktree
     */
    setMain(path) {
        const info = this.worktrees.get(path);
        if (!info)
            return null;
        info.isMain = true;
        this.mainWorktree = info;
        return info;
    }
    /**
     * Get main worktree
     */
    getMain() {
        return this.mainWorktree;
    }
    /**
     * Lock worktree
     */
    lock(path) {
        const info = this.worktrees.get(path);
        if (!info)
            return false;
        info.locked = true;
        return true;
    }
    /**
     * Unlock worktree
     */
    unlock(path) {
        const info = this.worktrees.get(path);
        if (!info)
            return false;
        info.locked = false;
        return true;
    }
    /**
     * Set current worktree
     */
    setCurrent(path) {
        this.currentWorktree = path;
    }
    /**
     * Get current worktree
     */
    getCurrent() {
        if (!this.currentWorktree)
            return null;
        return this.worktrees.get(this.currentWorktree) ?? null;
    }
    /**
     * Prune stale worktrees
     */
    prune() {
        // Would use git worktree prune
        let pruned = 0;
        for (const [path, info] of this.worktrees) {
            if (!info.isMain && info.commit === 'pruned') {
                this.worktrees.delete(path);
                pruned++;
            }
        }
        return pruned;
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            worktreesCount: this.worktrees.size,
            lockedCount: Array.from(this.worktrees.values()).filter(w => w.locked).length,
            hasMain: this.mainWorktree !== null,
            currentPath: this.currentWorktree
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.worktrees.clear();
        this.mainWorktree = null;
        this.currentWorktree = null;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const worktreeUtils = new WorktreeUtils();
export default worktreeUtils;
//# sourceMappingURL=worktree-utils.js.map