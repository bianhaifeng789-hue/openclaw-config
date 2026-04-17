// @ts-nocheck
/**
 * Task Get Tool Pattern - 任务获取工具
 *
 * Source: Claude Code tools/TaskGetTool/TaskGetTool.ts
 * Pattern: task retrieval + task info + status check + result fetch
 */
class TaskGetTool {
    /**
     * Get task
     */
    get(taskId) {
        // Would fetch from task store
        // For now, use taskCreateTool
        return taskCreateTool.getTask(taskId) ?? null;
    }
    /**
     * Get task status
     */
    getStatus(taskId) {
        const task = this.get(taskId);
        return task?.status ?? null;
    }
    /**
     * Get task result
     */
    getResult(taskId) {
        const task = this.get(taskId);
        return task?.result ?? null;
    }
    /**
     * Get task error
     */
    getError(taskId) {
        const task = this.get(taskId);
        return task?.error ?? null;
    }
    /**
     * Is task completed
     */
    isCompleted(taskId) {
        const task = this.get(taskId);
        return task?.status === 'completed';
    }
    /**
     * Is task running
     */
    isRunning(taskId) {
        const task = this.get(taskId);
        return task?.status === 'running';
    }
    /**
     * Is task failed
     */
    isFailed(taskId) {
        const task = this.get(taskId);
        return task?.status === 'failed';
    }
    /**
     * Get duration
     */
    getDuration(taskId) {
        const task = this.get(taskId);
        if (!task || !task.startedAt)
            return null;
        const endTime = task.completedAt ?? Date.now();
        return endTime - task.startedAt;
    }
    /**
     * Wait for completion
     */
    async waitForCompletion(taskId, timeoutMs) {
        const timeout = timeoutMs ?? 60000;
        const startTime = Date.now();
        while (Date.now() - startTime < timeout) {
            const task = this.get(taskId);
            if (!task)
                return null;
            if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
                return task;
            }
            await this.delay(100);
        }
        return null;
    }
    /**
     * Delay helper
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
// Global singleton
export const taskGetTool = new TaskGetTool();
// Import Task type
import { taskCreateTool } from './task-create-tool';
export default taskGetTool;
//# sourceMappingURL=task-get-tool.js.map