// @ts-nocheck
class TaskListTool {
    /**
     * List all tasks
     */
    list() {
        return taskCreateTool.getAll();
    }
    /**
     * List with options
     */
    listWithOptions(options) {
        let tasks = this.list();
        // Filter by status
        if (options.status) {
            tasks = tasks.filter(t => t.status === options.status);
        }
        // Filter by priority
        if (options.priorityMin !== undefined) {
            tasks = tasks.filter(t => t.priority >= options.priorityMin);
        }
        if (options.priorityMax !== undefined) {
            tasks = tasks.filter(t => t.priority <= options.priorityMax);
        }
        // Apply pagination
        if (options.offset !== undefined) {
            tasks = tasks.slice(options.offset);
        }
        if (options.limit !== undefined) {
            tasks = tasks.slice(0, options.limit);
        }
        return tasks;
    }
    /**
     * List pending
     */
    listPending() {
        return taskCreateTool.getPending();
    }
    /**
     * List running
     */
    listRunning() {
        return taskCreateTool.getRunning();
    }
    /**
     * List completed
     */
    listCompleted() {
        return taskCreateTool.getCompleted();
    }
    /**
     * List failed
     */
    listFailed() {
        return this.listWithOptions({ status: 'failed' });
    }
    /**
     * List by priority
     */
    listByPriority(priority) {
        return this.listWithOptions({ priorityMin: priority, priorityMax: priority });
    }
    /**
     * List high priority
     */
    listHighPriority() {
        return this.listWithOptions({ priorityMin: 8 });
    }
    /**
     * List recent
     */
    listRecent(count = 10) {
        return this.list()
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, count);
    }
    /**
     * Count tasks
     */
    count() {
        return this.list().length;
    }
    /**
     * Count by status
     */
    countByStatus(status) {
        return this.listWithOptions({ status }).length;
    }
    /**
     * Get stats
     */
    getStats() {
        const stats = taskCreateTool.getStats();
        return {
            total: stats.tasksCount,
            pending: stats.pendingCount,
            running: stats.runningCount,
            completed: stats.completedCount,
            failed: stats.failedCount,
            cancelled: stats.cancelledCount
        };
    }
}
// Global singleton
export const taskListTool = new TaskListTool();
// Import Task type
import { taskCreateTool } from './task-create-tool';
export default taskListTool;
//# sourceMappingURL=task-list-tool.js.map