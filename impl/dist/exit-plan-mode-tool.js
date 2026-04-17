// @ts-nocheck
class ExitPlanModeTool {
    exits = [];
    /**
     * Exit plan mode
     */
    exit() {
        const current = enterPlanModeTool.getCurrentPlan();
        if (!current)
            return null;
        const completed = current.steps.filter(s => s.status === 'completed').length;
        const total = current.steps.length;
        const result = {
            planId: current.id,
            success: completed === total,
            summary: `Completed ${completed}/${total} steps`,
            stepsCompleted: completed,
            stepsTotal: total,
            timestamp: Date.now()
        };
        current.active = false;
        this.exits.push(result);
        enterPlanModeTool.currentPlan = null;
        return result;
    }
    /**
     * Exit with summary
     */
    exitWithSummary(summary) {
        const result = this.exit();
        if (result) {
            result.summary = summary;
        }
        return result;
    }
    /**
     * Force exit
     */
    forceExit() {
        const current = enterPlanModeTool.getCurrentPlan();
        if (!current)
            return null;
        const result = {
            planId: current.id,
            success: false,
            summary: 'Force exited',
            stepsCompleted: current.steps.filter(s => s.status === 'completed').length,
            stepsTotal: current.steps.length,
            timestamp: Date.now()
        };
        current.active = false;
        this.exits.push(result);
        enterPlanModeTool.currentPlan = null;
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
        const successful = this.exits.filter(e => e.success);
        const avgCompletion = this.exits.length > 0
            ? this.exits.reduce((sum, e) => sum + (e.stepsCompleted / e.stepsTotal), 0) / this.exits.length
            : 0;
        return {
            exitsCount: this.exits.length,
            successfulExits: successful.length,
            forceExits: this.exits.filter(e => e.summary === 'Force exited').length,
            averageCompletionRate: avgCompletion
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
export const exitPlanModeTool = new ExitPlanModeTool();
// Import enterPlanModeTool
import { enterPlanModeTool } from './enter-plan-mode-tool';
export default exitPlanModeTool;
//# sourceMappingURL=exit-plan-mode-tool.js.map