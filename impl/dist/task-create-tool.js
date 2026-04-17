// @ts-nocheck
class TaskCreateTool {
    tasks = new Map();
    taskCounter = 0;
    pendingQueue = [];
    runningTasks = [];
    /**
     * Create task
     */
    create(name, description, priority) {
        const id = `task-${++this.taskCounter}-${Date.now()}`;
        const task = {
            id,
            name,
            description,
            status: 'pending',
            priority: priority ?? 0,
            createdAt: Date.now(),
            startedAt: null,
            completedAt: null
        };
        this.tasks.set(id, task);
        this.pendingQueue.push(id);
        this.pendingQueue.sort((a, b) => {
            const taskA = this.tasks.get(a);
            const taskB = this.tasks.get(b);
            return taskB.priority - taskA.priority;
        });
        return task;
    }
    /**
     * Start task
     */
    start(id) {
        const task = this.tasks.get(id);
        if (!task || task.status !== 'pending')
            return false;
        task.status = 'running';
        task.startedAt = Date.now();
        const index = this.pendingQueue.indexOf(id);
        if (index !== -1)
            this.pendingQueue.splice(index, 1);
        this.runningTasks.push(id);
        return true;
    }
    /**
     * Complete task
     */
    complete(id, result) {
        const task = this.tasks.get(id);
        if (!task || task.status !== 'running')
            return false;
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = result;
        const index = this.runningTasks.indexOf(id);
        if (index !== -1)
            this.runningTasks.splice(index, 1);
        return true;
    }
    /**
     * Fail task
     */
    fail(id, error) {
        const task = this.tasks.get(id);
        if (!task || task.status !== 'running')
            return false;
        task.status = 'failed';
        task.completedAt = Date.now();
        task.error = error;
        const index = this.runningTasks.indexOf(id);
        if (index !== -1)
            this.runningTasks.splice(index, 1);
        return true;
    }
    /**
     * Cancel task
     */
    cancel(id) {
        const task = this.tasks.get(id);
        if (!task || task.status === 'completed' || task.status === 'failed')
            return false;
        task.status = 'cancelled';
        task.completedAt = Date.now();
        // Remove from queues
        const pendingIndex = this.pendingQueue.indexOf(id);
        if (pendingIndex !== -1)
            this.pendingQueue.splice(pendingIndex, 1);
        const runningIndex = this.runningTasks.indexOf(id);
        if (runningIndex !== -1)
            this.runningTasks.splice(runningIndex, 1);
        return true;
    }
    /**
     * Get task
     */
    getTask(id) {
        return this.tasks.get(id);
    }
    /**
     * Get pending tasks
     */
    getPending() {
        return this.pendingQueue
            .map(id => this.tasks.get(id))
            .filter(t => t !== undefined);
    }
    /**
     * Get running tasks
     */
    getRunning() {
        return this.runningTasks
            .map(id => this.tasks.get(id))
            .filter(t => t !== undefined);
    }
    /**
     * Get completed tasks
     */
    getCompleted() {
        return Array.from(this.tasks.values())
            .filter(t => t.status === 'completed');
    }
    /**
     * Get stats
     */
    getStats() {
        const tasks = Array.from(this.tasks.values());
        return {
            tasksCount: tasks.length,
            pendingCount: tasks.filter(t => t.status === 'pending').length,
            runningCount: tasks.filter(t => t.status === 'running').length,
            completedCount: tasks.filter(t => t.status === 'completed').length,
            failedCount: tasks.filter(t => t.status === 'failed').length,
            cancelledCount: tasks.filter(t => t.status === 'cancelled').length
        };
    }
    /**
     * Clear completed
     */
    clearCompleted() {
        const completed = Array.from(this.tasks.values())
            .filter(t => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled');
        for (const task of completed) {
            this.tasks.delete(task.id);
        }
        return completed.length;
    }
    /**
     * Clear all
     */
    clear() {
        this.tasks.clear();
        this.pendingQueue = [];
        this.runningTasks = [];
        this.taskCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const taskCreateTool = new TaskCreateTool();
export default taskCreateTool;
//# sourceMappingURL=task-create-tool.js.map