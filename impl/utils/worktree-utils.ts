// @ts-nocheck

/**
 * Worktree Utils Pattern - Worktree工具
 * 
 * Source: Claude Code utils/worktree.ts + utils/worktreeModeEnabled.ts
 * Pattern: worktree utils + git worktree + branch isolation + worktree detection
 */

interface WorktreeInfo {
  path: string
  branch: string
  commit: string
  isMain: boolean
  locked: boolean
}

class WorktreeUtils {
  private worktrees = new Map<string, WorktreeInfo>()
  private mainWorktree: WorktreeInfo | null = null
  private currentWorktree: string | null = null

  /**
   * Create worktree
   */
  async create(branch: string, path?: string): WorktreeInfo {
    // Would use git worktree add
    // For demo, simulate
    const worktreePath = path ?? `../${branch}`

    const info: WorktreeInfo = {
      path: worktreePath,
      branch,
      commit: 'abc123',
      isMain: false,
      locked: false
    }

    this.worktrees.set(worktreePath, info)

    return info
  }

  /**
   * Remove worktree
   */
  async remove(path: string): boolean {
    // Would use git worktree remove
    const info = this.worktrees.get(path)
    if (!info) return false

    if (info.locked) {
      console.warn(`[Worktree] Worktree ${path} is locked`)
      return false
    }

    this.worktrees.delete(path)

    return true
  }

  /**
   * List worktrees
   */
  list(): WorktreeInfo[] {
    return Array.from(this.worktrees.values())
  }

  /**
   * Get worktree info
   */
  get(path: string): WorktreeInfo | undefined {
    return this.worktrees.get(path)
  }

  /**
   * Set main worktree
   */
  setMain(path: string): WorktreeInfo | null {
    const info = this.worktrees.get(path)
    if (!info) return null

    info.isMain = true
    this.mainWorktree = info

    return info
  }

  /**
   * Get main worktree
   */
  getMain(): WorktreeInfo | null {
    return this.mainWorktree
  }

  /**
   * Lock worktree
   */
  lock(path: string): boolean {
    const info = this.worktrees.get(path)
    if (!info) return false

    info.locked = true

    return true
  }

  /**
   * Unlock worktree
   */
  unlock(path: string): boolean {
    const info = this.worktrees.get(path)
    if (!info) return false

    info.locked = false

    return true
  }

  /**
   * Set current worktree
   */
  setCurrent(path: string): void {
    this.currentWorktree = path
  }

  /**
   * Get current worktree
   */
  getCurrent(): WorktreeInfo | null {
    if (!this.currentWorktree) return null
    return this.worktrees.get(this.currentWorktree) ?? null
  }

  /**
   * Prune stale worktrees
   */
  prune(): number {
    // Would use git worktree prune
    let pruned = 0

    for (const [path, info] of this.worktrees) {
      if (!info.isMain && info.commit === 'pruned') {
        this.worktrees.delete(path)
        pruned++
      }
    }

    return pruned
  }

  /**
   * Get stats
   */
  getStats(): {
    worktreesCount: number
    lockedCount: number
    hasMain: boolean
    currentPath: string | null
  } {
    return {
      worktreesCount: this.worktrees.size,
      lockedCount: Array.from(this.worktrees.values()).filter(w => w.locked).length,
      hasMain: this.mainWorktree !== null,
      currentPath: this.currentWorktree
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.worktrees.clear()
    this.mainWorktree = null
    this.currentWorktree = null
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const worktreeUtils = new WorktreeUtils()

export default worktreeUtils