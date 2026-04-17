// @ts-nocheck

/**
 * Cross Project Resume Pattern - 跨项目恢复
 * 
 * Source: Claude Code utils/crossProjectResume.ts
 * Pattern: cross project resume + session migration + context transfer
 */

interface CrossProjectContext {
  sourceProject: string
  targetProject: string
  sessionId: string
  transferredAt: number
  contextSnapshot: Record<string, any>
}

class CrossProjectResume {
  private transfers: CrossProjectContext[] = []

  /**
   * Create context snapshot
   */
  createSnapshot(projectPath: string, sessionId: string): Record<string, any> {
    return {
      projectPath,
      sessionId,
      timestamp: Date.now(),
      recentFiles: [],
      recentCommands: [],
      memory: {}
    }
  }

  /**
   * Transfer context
   */
  transfer(sourceProject: string, targetProject: string, sessionId: string): CrossProjectContext {
    const snapshot = this.createSnapshot(sourceProject, sessionId)

    const context: CrossProjectContext = {
      sourceProject,
      targetProject,
      sessionId,
      transferredAt: Date.now(),
      contextSnapshot: snapshot
    }

    this.transfers.push(context)

    return context
  }

  /**
   * Apply context to new project
   */
  applyContext(context: CrossProjectContext): Record<string, any> {
    // Would restore session context in new project
    // For demo, return the snapshot
    return context.contextSnapshot
  }

  /**
   * Get transfers
   */
  getTransfers(): CrossProjectContext[] {
    return [...this.transfers]
  }

  /**
   * Get transfers by project
   */
  getByProject(projectPath: string): CrossProjectContext[] {
    return this.transfers.filter(
      t => t.sourceProject === projectPath || t.targetProject === projectPath
    )
  }

  /**
   * Get last transfer
   */
  getLastTransfer(): CrossProjectContext | null {
    return this.transfers.length > 0
      ? this.transfers[this.transfers.length - 1]
      : null
  }

  /**
   * Get stats
   */
  getStats(): {
    transfersCount: number
    uniqueProjects: number
    lastTransferTime: number | null
  } {
    const projects = new Set(
      this.transfers.flatMap(t => [t.sourceProject, t.targetProject])
    )

    return {
      transfersCount: this.transfers.length,
      uniqueProjects: projects.size,
      lastTransferTime: this.transfers.length > 0
        ? this.transfers[this.transfers.length - 1].transferredAt
        : null
    }
  }

  /**
   * Clear transfers
   */
  clear(): void {
    this.transfers = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const crossProjectResume = new CrossProjectResume()

export default crossProjectResume