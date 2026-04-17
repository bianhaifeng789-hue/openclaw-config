// @ts-nocheck

/**
 * Session Restore Pattern - 会话恢复
 * 
 * Source: Claude Code utils/sessionRestore.ts
 * Pattern: session restore + checkpoint + recovery + persistence
 */

interface SessionCheckpoint {
  id: string
  sessionId: string
  projectPath: string
  timestamp: number
  state: Record<string, any>
  canRecover: boolean
}

class SessionRestore {
  private checkpoints = new Map<string, SessionCheckpoint>()
  private checkpointCounter = 0

  /**
   * Create checkpoint
   */
  createCheckpoint(sessionId: string, projectPath: string, state: Record<string, any>): SessionCheckpoint {
    const id = `checkpoint-${++this.checkpointCounter}-${Date.now()}`

    const checkpoint: SessionCheckpoint = {
      id,
      sessionId,
      projectPath,
      timestamp: Date.now(),
      state,
      canRecover: true
    }

    this.checkpoints.set(id, checkpoint)

    return checkpoint
  }

  /**
   * Restore from checkpoint
   */
  restore(checkpointId: string): Record<string, any> | null {
    const checkpoint = this.checkpoints.get(checkpointId)
    if (!checkpoint || !checkpoint.canRecover) return null

    return checkpoint.state
  }

  /**
   * Get checkpoint
   */
  getCheckpoint(id: string): SessionCheckpoint | undefined {
    return this.checkpoints.get(id)
  }

  /**
   * Get checkpoints by session
   */
  getBySession(sessionId: string): SessionCheckpoint[] {
    return Array.from(this.checkpoints.values())
      .filter(c => c.sessionId === sessionId)
  }

  /**
   * Get checkpoints by project
   */
  getByProject(projectPath: string): SessionCheckpoint[] {
    return Array.from(this.checkpoints.values())
      .filter(c => c.projectPath === projectPath)
  }

  /**
   * Get latest checkpoint
   */
  getLatest(sessionId?: string): SessionCheckpoint | null {
    let checkpoints = Array.from(this.checkpoints.values())

    if (sessionId) {
      checkpoints = checkpoints.filter(c => c.sessionId === sessionId)
    }

    if (checkpoints.length === 0) return null

    return checkpoints.reduce((latest, c) =>
      c.timestamp > latest.timestamp ? c : latest
    )
  }

  /**
   * Mark checkpoint as unrecoverable
   */
  markUnrecoverable(id: string): boolean {
    const checkpoint = this.checkpoints.get(id)
    if (!checkpoint) return false

    checkpoint.canRecover = false

    return true
  }

  /**
   * Delete checkpoint
   */
  deleteCheckpoint(id: string): boolean {
    return this.checkpoints.delete(id)
  }

  /**
   * Get stats
   */
  getStats(): {
    checkpointsCount: number
    recoverableCount: number
    sessionsCount: number
    projectsCount: number
  } {
    const checkpoints = Array.from(this.checkpoints.values())

    const sessions = new Set(checkpoints.map(c => c.sessionId))
    const projects = new Set(checkpoints.map(c => c.projectPath))

    return {
      checkpointsCount: checkpoints.length,
      recoverableCount: checkpoints.filter(c => c.canRecover).length,
      sessionsCount: sessions.size,
      projectsCount: projects.size
    }
  }

  /**
   * Clear all checkpoints
   */
  clear(): void {
    this.checkpoints.clear()
    this.checkpointCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const sessionRestore = new SessionRestore()

export default sessionRestore