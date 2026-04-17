// @ts-nocheck
class TodoWriteService {
    todos = new Map();
    todoCounter = 0;
    /**
     * Create todo
     */
    create(content, priority) {
        const id = `todo-${++this.todoCounter}-${Date.now()}`;
        const todo = {
            id,
            content,
            status: 'pending',
            priority: priority ?? 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.todos.set(id, todo);
        return todo;
    }
    /**
     * Update status
     */
    updateStatus(id, status) {
        const todo = this.todos.get(id);
        if (!todo)
            return false;
        todo.status = status;
        todo.updatedAt = Date.now();
        return true;
    }
    /**
     * Start todo
     */
    start(id) {
        return this.updateStatus(id, 'in_progress');
    }
    /**
     * Complete todo
     */
    complete(id) {
        return this.updateStatus(id, 'completed');
    }
    /**
     * Delete todo
     */
    delete(id) {
        return this.todos.delete(id);
    }
    /**
     * Get todo
     */
    getTodo(id) {
        return this.todos.get(id);
    }
    /**
     * Get pending todos
     */
    getPending() {
        return Array.from(this.todos.values())
            .filter(t => t.status === 'pending')
            .sort((a, b) => b.priority - a.priority);
    }
    /**
     * Get in progress todos
     */
    getInProgress() {
        return Array.from(this.todos.values())
            .filter(t => t.status === 'in_progress');
    }
    /**
     * Get completed todos
     */
    getCompleted() {
        return Array.from(this.todos.values())
            .filter(t => t.status === 'completed');
    }
    /**
     * Get all todos
     */
    getAll() {
        return Array.from(this.todos.values())
            .sort((a, b) => b.priority - a.priority);
    }
    /**
     * Get stats
     */
    getStats() {
        const todos = Array.from(this.todos.values());
        const completed = todos.filter(t => t.status === 'completed');
        return {
            todosCount: todos.length,
            pendingCount: todos.filter(t => t.status === 'pending').length,
            inProgressCount: todos.filter(t => t.status === 'in_progress').length,
            completedCount: completed.length,
            completionRate: todos.length > 0 ? completed.length / todos.length : 0
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.todos.clear();
        this.todoCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const todoWriteService = new TodoWriteService();
export default todoWriteService;
//# sourceMappingURL=todo-write-service.js.map