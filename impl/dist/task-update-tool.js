// @ts-nocheck
class TaskUpdateTool {
    updateHistory = [];
    /**
     * Update task
     */
    update(taskId, updates) {
        const task = taskCreateTool.getTask(taskId);
        const result = {
            taskId,
            updated: false,
            changes: {},
            timestamp: Date.now()
        };
        if (!task) {
            this.updateHistory.push(result);
            return result;
        }
        // Apply updates
        for (const [key, value] of Object.entries(updates)) {
            if (key in task && task[key] !== value) {
                result.changes[key] = {
                    old: task[key],
                    new: value
                }(task)[key] = value;
            }
        }
        result.updated = Object.keys(result.changes).length > 0;
        this.updateHistory.push(result);
        return result;
    }
    /**
     * Update priority
     */
    updatePriority(taskId, priority) {
        return this.update(taskId, { priority });
    }
    /**
     * Update name
     */
    updateName(taskId, name) {
        return this.update(taskId, { name });
    }
    /**
     * Update description
     */
    updateDescription(taskId, description) {
        return this.update(taskId, { description });
    }
    /**
     * Update status
     */
    updateStatus(taskId, status) {
        return this.update(taskId, { status });
    }
    /**
     * Set result
     */
    setResult(taskId, result) {
        return this.update(taskId, { result });
    }
    /**
     * Set error
     */
    setError(taskId, error) {
        return this.update(taskId, { error });
    }
    /**
     * Get update history
     */
    getHistory() {
        return [...this.updateHistory];
    }
    /**
     * Get history for task
     */
    getHistoryForTask(taskId) {
        return this.updateHistory.filter(u => u.taskId === taskId);
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.updateHistory = [];
    }
    /**
     * Get stats
     */
    getStats() {
        const successful = this.updateHistory.filter(u => u.updated);
        const totalChanges = successful.reduce((sum, u) => sum + Object.keys(u.changes).length, 0);
        return {
            updatesCount: this.updateHistory.length,
            successfulUpdates: successful.length,
            totalChanges: totalChanges
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const taskUpdateTool = new TaskUpdateTool();
// Import Task type
import { taskCreateTool } from './task-create-tool';
export default taskUpdateTool;
//# sourceMappingURL=task-update-tool.js.map