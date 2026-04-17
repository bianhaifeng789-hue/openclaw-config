// @ts-nocheck
class TodoWriteTool {
    todos = new Map();
    todoCounter = 0;
    pending = [];
    inProgress = [];
    completed = [];
    /**
     * Add todo
     */
    add(content, priority) {
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
        this.pending.push(id);
        this.sortPending();
        return todo;
    }
    /**
     * Sort pending by priority
     */
    sortPending() {
        this.pending.sort((a, b) => {
            const todoA = this.todos.get(a);
            const todoB = this.todos.get(b);
            return todoB.priority - todoA.priority;
        });
    }
    /**
     * Start todo
     */
    start(id) {
        const todo = this.todos.get(id);
        if (!todo || todo.status !== 'pending')
            return false;
        todo.status = 'in_progress';
        todo.updatedAt = Date.now();
        const index = this.pending.indexOf(id);
        if (index !== -1)
            this.pending.splice(index, 1);
        this.inProgress.push(id);
        return true;
    }
    /**
     * Complete todo
     */
    complete(id) {
        const todo = this.todos.get(id);
        if (!todo || todo.status !== 'in_progress')
            return false;
        todo.status = 'completed';
        todo.updatedAt = Date.now();
        const index = this.inProgress.indexOf(id);
        if (index !== -1)
            this.inProgress.splice(index, 1);
        this.completed.push(id);
        return true;
    }
    /**
     * Cancel todo
     */
    cancel(id) {
        const todo = this.todos.get(id);
        if (!todo || todo.status === 'completed')
            return false;
        todo.status = 'cancelled';
        todo.updatedAt = Date.now();
        // Remove from lists
        const pendingIndex = this.pending.indexOf(id);
        if (pendingIndex !== -1)
            this.pending.splice(pendingIndex, 1);
        const inProgressIndex = this.inProgress.indexOf(id);
        if (inProgressIndex !== -1)
            this.inProgress.splice(inProgressIndex, 1);
        return true;
    }
    /**
     * Update todo
     */
    update(id, content, priority) {
        const todo = this.todos.get(id);
        if (!todo)
            return false;
        if (content !== undefined)
            todo.content = content;
        if (priority !== undefined)
            todo.priority = priority;
        todo.updatedAt = Date.now();
        if (priority !== undefined)
            this.sortPending();
        return true;
    }
    /**
     * Get todo
     */
    getTodo(id) {
        return this.todos.get(id);
    }
    /**
     * Get pending
     */
    getPending() {
        return this.pending
            .map(id => this.todos.get(id))
            .filter(t => t !== undefined);
    }
    /**
     * Get in progress
     */
    getInProgress() {
        return this.inProgress
            .map(id => this.todos.get(id))
            .filter(t => t !== undefined);
    }
    /**
     * Get completed
     */
    getCompleted() {
        return this.completed
            .map(id => this.todos.get(id))
            .filter(t => t !== undefined);
    }
    /**
     * Get all todos
     */
    getAll() {
        return Array.from(this.todos.values());
    }
    /**
     * Clear completed
     */
    clearCompleted() {
        const count = this.completed.length;
        for (const id of this.completed) {
            this.todos.delete(id);
        }
        this.completed = [];
        return count;
    }
    /**
     * Clear all
     */
    clear() {
        this.todos.clear();
        this.pending = [];
        this.inProgress = [];
        this.completed = [];
        this.todoCounter = 0;
    }
    /**
     * Get stats
     */
    getStats() {
        const todos = Array.from(this.todos.values());
        return {
            total: todos.length,
            pending: todos.filter(t => t.status === 'pending').length,
            inProgress: todos.filter(t => t.status === 'in_progress').length,
            completed: todos.filter(t => t.status === 'completed').length,
            cancelled: todos.filter(t => t.status === 'cancelled').length
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const todoWriteTool = new TodoWriteTool();
export default todoWriteTool;
//# sourceMappingURL=todo-write-tool.js.map