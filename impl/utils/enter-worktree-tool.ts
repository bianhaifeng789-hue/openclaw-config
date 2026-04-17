// @ts-nocheck

/**
 * Enter Worktree Tool Pattern - 进入Worktree工具
 * 
 * Source: Claude Code tools/EnterWorktreeTool/EnterWorktreeTool.ts + tools/EnterWorktreeTool/prompt.ts
 * Pattern: enter worktree + git worktree + branch isolation + context switch
 */

interface WorktreeContext {
  id: string
  path: string
  branch: string
  previousPath: string
  enteredAt: number
  exitedAt?: number
}

class EnterWorktreeTool {
  private contexts: WorktreeContext[] = []
  private contextCounter = 0
  private currentContext: WorktreeContext | null = null

  /**
   * Enter worktree
   */
  enter(path: string, branch: string, previousPath?: string): WorktreeContext {
    const id = `worktree-${++this.contextCounter}-${Date.now()}`

    const context: WorktreeContext = {
      id,
      path,
      branch,
      previousPath: previousPath ?? process.cwd(),
      enteredAt: Date.now()
    }

    this.contexts.push(context)
    this.currentContext = context

    return context
  }

  /**
   * Get current context
   */
  getCurrentContext(): WorktreeContext | null {
    return this.currentContext
  }

  /**
   * Get context
   */
  getContext(id: string): WorktreeContext | undefined {
    return this.contexts.find(c => c.id === id)
  }

  /**
   * Get all contexts
   */
  getAllContexts(): WorktreeContext[] {
    return [...this.contexts]
  }

  /**
   * Get active contexts
   */
  getActive(): WorktreeContext[] {
    return this.contexts.filter(c => !c.exitedAt)
  }

  /**
   * Get stats
   */
  getStats(): {
    contextsCount: number
    activeCount: number
    exitedCount: number
    uniqueBranches: number
  } {
    const exited = this.contexts.filter(c => c.exitedAt)
    const branches = new Set(this.contexts.map(c => c.branch))

    return {
      contextsCount: this.contexts.length,
      activeCount: this.contexts.filter(c => !c.exitedAt).length,
      exitedCount: exited.length,
      uniqueBranches: branches.size
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.contexts = []
    this.currentContext = null
    this.contextCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const enterWorktreeTool = new EnterWorktreeTool()

export default enterWorktreeTool