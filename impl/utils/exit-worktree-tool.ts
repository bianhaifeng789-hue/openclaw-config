// @ts-nocheck

/**
 * Exit Worktree Tool Pattern - 退出Worktree工具
 * 
 * Source: Claude Code tools/ExitWorktreeTool/ExitWorktreeTool.ts
 * Pattern: exit worktree + context restore + return + cleanup
 */

interface ExitWorktreeResult {
  contextId: string
  returnedToPath: string
  success: boolean
  durationMs: number
  timestamp: number
}

class ExitWorktreeTool {
  private exits: ExitWorktreeResult[] = []

  /**
   * Exit worktree
   */
  exit(): ExitWorktreeResult | null {
    const current = enterWorktreeTool.getCurrentContext()

    if (!current) return null

    const duration = Date.now() - current.enteredAt

    const result: ExitWorktreeResult = {
      contextId: current.id,
      returnedToPath: current.previousPath,
      success: true,
      durationMs: duration,
      timestamp: Date.now()
    }

    current.exitedAt = Date.now()
    this.exits.push(result)

    enterWorktreeTool.currentContext = null

    return result
  }

  /**
   * Get exits
   */
  getExits(): ExitWorktreeResult[] {
    return [...this.exits]
  }

  /**
   * Get recent exits
   */
  getRecent(count: number = 10): ExitWorktreeResult[] {
    return this.exits.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    exitsCount: number
    successfulExits: number
    averageDurationMs: number
  } {
    const avgDuration = this.exits.length > 0
      ? this.exits.reduce((sum, e) => sum + e.durationMs, 0) / this.exits.length
      : 0

    return {
      exitsCount: this.exits.length,
      successfulExits: this.exits.filter(e => e.success).length,
      averageDurationMs: avgDuration
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.exits = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const exitWorktreeTool = new ExitWorktreeTool()

// Import enterWorktreeTool
import { enterWorktreeTool } from './enter-worktree-tool'

export default exitWorktreeTool