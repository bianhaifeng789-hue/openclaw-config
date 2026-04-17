// @ts-nocheck
class TaskStopTool {
    stopHistory = [];
    /**
     * Stop task
     */
    stop(taskId, reason) {
        const task = taskCreateTool.getTask(taskId);
        const result = {
            taskId,
            stopped: false,
            reason: reason ?? 'User requested stop',
            timestamp: Date.now()
        };
        if (!task) {
            result.reason = 'Task not found';
            this.stopHistory.push(result);
            return result;
        }
        if (task.status === 'completed' || task.status === 'failed') {
            result.reason = 'Task already finished';
            this.stopHistory.push(result);
            return result;
        }
        // Cancel task
        const cancelled = taskCreateTool.cancel(taskId);
        result.stopped = cancelled;
        this.stopHistory.push(result);
        return result;
    }
    /**
     * Stop all running
     */
    stopAllRunning(reason) {
        const running = taskCreateTool.getRunning();
        const results = [];
        for (const task of running) {
            results.push(this.stop(task.id, reason ?? 'Bulk stop'));
        }
        return results;
    }
    /**
     * Force stop
     */
    forceStop(taskId) {
        // Would force terminate task process
        // For demo, just cancel
        return this.stop(taskId, 'Force stop');
    }
    /**
     * Get stop history
     */
    getStopHistory() {
        return [...this.stopHistory];
    }
    /**
     * Get stop history for task
     */
    getStopHistoryForTask(taskId) {
        return this.stopHistory.filter(s => s.taskId === taskId);
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.stopHistory = [];
    }
    /**
     * Get stats
     */
    getStats() {
        const successful = this.stopHistory.filter(s => s.stopped);
        const failed = this.stopHistory.filter(s => !s.stopped);
        return {
            stopsCount: this.stopHistory.length,
            successfulStops: successful.length,
            failedStops: failed.length
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
export const taskStopTool = new TaskStopTool();
// Import taskCreateTool
import { taskCreateTool } from './task-create-tool';
export default taskStopTool;
//# sourceMappingURL=task-stop-tool.js.map