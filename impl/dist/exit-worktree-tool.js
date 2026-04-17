// @ts-nocheck
class ExitWorktreeTool {
    exits = [];
    /**
     * Exit worktree
     */
    exit() {
        const current = enterWorktreeTool.getCurrentContext();
        if (!current)
            return null;
        const duration = Date.now() - current.enteredAt;
        const result = {
            contextId: current.id,
            returnedToPath: current.previousPath,
            success: true,
            durationMs: duration,
            timestamp: Date.now()
        };
        current.exitedAt = Date.now();
        this.exits.push(result);
        enterWorktreeTool.currentContext = null;
        return result;
    }
    /**
     * Get exits
     */
    getExits() {
        return [...this.exits];
    }
    /**
     * Get recent exits
     */
    getRecent(count = 10) {
        return this.exits.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const avgDuration = this.exits.length > 0
            ? this.exits.reduce((sum, e) => sum + e.durationMs, 0) / this.exits.length
            : 0;
        return {
            exitsCount: this.exits.length,
            successfulExits: this.exits.filter(e => e.success).length,
            averageDurationMs: avgDuration
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.exits = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const exitWorktreeTool = new ExitWorktreeTool();
// Import enterWorktreeTool
import { enterWorktreeTool } from './enter-worktree-tool';
export default exitWorktreeTool;
//# sourceMappingURL=exit-worktree-tool.js.map