// @ts-nocheck
class BackgroundTaskService {
    tasks = new Map();
    taskCounter = 0;
    listeners = new Set();
    /**
     * Create background task
     */
    create(name) {
        const id = `bg-${++this.taskCounter}-${Date.now()}`;
        const task = {
            id,
            name,
            progress: 0,
            status: 'running',
            startedAt: Date.now()
        };
        this.tasks.set(id, task);
        this.notifyListeners(task);
        return task;
    }
    /**
     * Update progress
     */
    updateProgress(id, progress) {
        const task = this.tasks.get(id);
        if (!task || task.status !== 'running')
            return false;
        task.progress = Math.min(100, Math.max(0, progress));
        this.notifyListeners(task);
        return true;
    }
    /**
     * Complete task
     */
    complete(id) {
        const task = this.tasks.get(id);
        if (!task || task.status !== 'running')
            return false;
        task.status = 'completed';
        task.progress = 100;
        task.completedAt = Date.now();
        this.notifyListeners(task);
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
        task.error = error;
        task.completedAt = Date.now();
        this.notifyListeners(task);
        return true;
    }
    /**
     * Cancel task
     */
    cancel(id) {
        const task = this.tasks.get(id);
        if (!task || task.status !== 'running')
            return false;
        task.status = 'cancelled';
        task.completedAt = Date.now();
        this.notifyListeners(task);
        return true;
    }
    /**
     * Get task
     */
    getTask(id) {
        return this.tasks.get(id);
    }
    /**
     * Get running tasks
     */
    getRunning() {
        return Array.from(this.tasks.values())
            .filter(t => t.status === 'running');
    }
    /**
     * Get completed tasks
     */
    getCompleted() {
        return Array.from(this.tasks.values())
            .filter(t => t.status === 'completed');
    }
    /**
     * Subscribe
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
    /**
     * Notify listeners
     */
    notifyListeners(task) {
        for (const listener of this.listeners) {
            listener(task);
        }
    }
    /**
     * Get stats
     */
    getStats() {
        const tasks = Array.from(this.tasks.values());
        const running = tasks.filter(t => t.status === 'running');
        const avgProgress = running.length > 0
            ? running.reduce((sum, t) => sum + t.progress, 0) / running.length
            : 0;
        return {
            tasksCount: tasks.length,
            runningCount: running.length,
            completedCount: tasks.filter(t => t.status === 'completed').length,
            failedCount: tasks.filter(t => t.status === 'failed').length,
            cancelledCount: tasks.filter(t => t.status === 'cancelled').length,
            averageProgress: avgProgress
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.tasks.clear();
        this.listeners.clear();
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
export const backgroundTaskService = new BackgroundTaskService();
export default backgroundTaskService;
//# sourceMappingURL=background-task-service.js.map