// @ts-nocheck

/**
 * Todo Write Tool Pattern - Todo写入工具
 * 
 * Source: Claude Code tools/TodoWriteTool/TodoWriteTool.ts + tools/TodoWriteTool/prompt.ts
 * Pattern: todo write + task list + todo management + progress tracking
 */

interface TodoItem {
  id: string
  content: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: number
  createdAt: number
  updatedAt: number
}

class TodoWriteTool {
  private todos = new Map<string, TodoItem>()
  private todoCounter = 0
  private pending: string[] = []
  private inProgress: string[] = []
  private completed: string[] = []

  /**
   * Add todo
   */
  add(content: string, priority?: number): TodoItem {
    const id = `todo-${++this.todoCounter}-${Date.now()}`

    const todo: TodoItem = {
      id,
      content,
      status: 'pending',
      priority: priority ?? 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.todos.set(id, todo)
    this.pending.push(id)
    this.sortPending()

    return todo
  }

  /**
   * Sort pending by priority
   */
  private sortPending(): void {
    this.pending.sort((a, b) => {
      const todoA = this.todos.get(a)!
      const todoB = this.todos.get(b)!
      return todoB.priority - todoA.priority
    })
  }

  /**
   * Start todo
   */
  start(id: string): boolean {
    const todo = this.todos.get(id)
    if (!todo || todo.status !== 'pending') return false

    todo.status = 'in_progress'
    todo.updatedAt = Date.now()

    const index = this.pending.indexOf(id)
    if (index !== -1) this.pending.splice(index, 1)

    this.inProgress.push(id)

    return true
  }

  /**
   * Complete todo
   */
  complete(id: string): boolean {
    const todo = this.todos.get(id)
    if (!todo || todo.status !== 'in_progress') return false

    todo.status = 'completed'
    todo.updatedAt = Date.now()

    const index = this.inProgress.indexOf(id)
    if (index !== -1) this.inProgress.splice(index, 1)

    this.completed.push(id)

    return true
  }

  /**
   * Cancel todo
   */
  cancel(id: string): boolean {
    const todo = this.todos.get(id)
    if (!todo || todo.status === 'completed') return false

    todo.status = 'cancelled'
    todo.updatedAt = Date.now()

    // Remove from lists
    const pendingIndex = this.pending.indexOf(id)
    if (pendingIndex !== -1) this.pending.splice(pendingIndex, 1)

    const inProgressIndex = this.inProgress.indexOf(id)
    if (inProgressIndex !== -1) this.inProgress.splice(inProgressIndex, 1)

    return true
  }

  /**
   * Update todo
   */
  update(id: string, content?: string, priority?: number): boolean {
    const todo = this.todos.get(id)
    if (!todo) return false

    if (content !== undefined) todo.content = content
    if (priority !== undefined) todo.priority = priority
    todo.updatedAt = Date.now()

    if (priority !== undefined) this.sortPending()

    return true
  }

  /**
   * Get todo
   */
  getTodo(id: string): TodoItem | undefined {
    return this.todos.get(id)
  }

  /**
   * Get pending
   */
  getPending(): TodoItem[] {
    return this.pending
      .map(id => this.todos.get(id))
      .filter(t => t !== undefined) as TodoItem[]
  }

  /**
   * Get in progress
   */
  getInProgress(): TodoItem[] {
    return this.inProgress
      .map(id => this.todos.get(id))
      .filter(t => t !== undefined) as TodoItem[]
  }

  /**
   * Get completed
   */
  getCompleted(): TodoItem[] {
    return this.completed
      .map(id => this.todos.get(id))
      .filter(t => t !== undefined) as TodoItem[]
  }

  /**
   * Get all todos
   */
  getAll(): TodoItem[] {
    return Array.from(this.todos.values())
  }

  /**
   * Clear completed
   */
  clearCompleted(): number {
    const count = this.completed.length

    for (const id of this.completed) {
      this.todos.delete(id)
    }

    this.completed = []

    return count
  }

  /**
   * Clear all
   */
  clear(): void {
    this.todos.clear()
    this.pending = []
    this.inProgress = []
    this.completed = []
    this.todoCounter = 0
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number
    pending: number
    inProgress: number
    completed: number
    cancelled: number
  } {
    const todos = Array.from(this.todos.values())

    return {
      total: todos.length,
      pending: todos.filter(t => t.status === 'pending').length,
      inProgress: todos.filter(t => t.status === 'in_progress').length,
      completed: todos.filter(t => t.status === 'completed').length,
      cancelled: todos.filter(t => t.status === 'cancelled').length
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const todoWriteTool = new TodoWriteTool()

export default todoWriteTool