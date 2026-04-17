// @ts-nocheck

/**
 * Concurrent Sessions Pattern - 并发会话
 * 
 * Source: Claude Code utils/concurrentSessions.ts
 * Pattern: concurrent sessions + session pool + limits + management
 */

interface SessionInfo {
  id: string
  status: 'active' | 'idle' | 'paused' | 'closed'
  createdAt: number
  lastActiveAt: number
  modelId: string
  projectId: string
}

class ConcurrentSessions {
  private sessions = new Map<string, SessionInfo>()
  private maxSessions = 10
  private sessionCounter = 0

  /**
   * Create session
   */
  create(modelId: string, projectId: string): SessionInfo {
    if (this.sessions.size >= this.maxSessions) {
      // Close oldest idle session
      this.closeOldestIdle()
    }

    const id = `session-${++this.sessionCounter}-${Date.now()}`

    const session: SessionInfo = {
      id,
      status: 'active',
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      modelId,
      projectId
    }

    this.sessions.set(id, session)

    return session
  }

  /**
   * Close oldest idle session
   */
  private closeOldestIdle(): boolean {
    const idle = Array.from(this.sessions.values())
      .filter(s => s.status === 'idle')
      .sort((a, b) => a.lastActiveAt - b.lastActiveAt)

    if (idle.length === 0) return false

    this.close(idle[0].id)

    return true
  }

  /**
   * Get session
   */
  get(id: string): SessionInfo | undefined {
    return this.sessions.get(id)
  }

  /**
   * Update activity
   */
  updateActivity(id: string): boolean {
    const session = this.sessions.get(id)
    if (!session) return false

    session.lastActiveAt = Date.now()

    return true
  }

  /**
   * Set status
   */
  setStatus(id: string, status: SessionInfo['status']): boolean {
    const session = this.sessions.get(id)
    if (!session) return false

    session.status = status

    if (status === 'active') {
      session.lastActiveAt = Date.now()
    }

    return true
  }

  /**
   * Close session
   */
  close(id: string): boolean {
    const session = this.sessions.get(id)
    if (!session) return false

    session.status = 'closed'
    this.sessions.delete(id)

    return true
  }

  /**
   * Get active sessions
   */
  getActive(): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(s => s.status === 'active')
  }

  /**
   * Get idle sessions
   */
  getIdle(): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(s => s.status === 'idle')
  }

  /**
   * Get by project
   */
  getByProject(projectId: string): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(s => s.projectId === projectId)
  }

  /**
   * Get by model
   */
  getByModel(modelId: string): SessionInfo[] {
    return Array.from(this.sessions.values())
      .filter(s => s.modelId === modelId)
  }

  /**
   * Set max sessions
   */
  setMax(max: number): void {
    this.maxSessions = max

    // Close excess idle sessions
    while (this.sessions.size > this.maxSessions) {
      this.closeOldestIdle()
    }
  }

  /**
   * Get max sessions
   */
  getMax(): number {
    return this.maxSessions
  }

  /**
   * Get stats
   */
  getStats(): {
    sessionsCount: number
    activeCount: number
    idleCount: number
    pausedCount: number
    maxSessions: number
  } {
    const sessions = Array.from(this.sessions.values())

    return {
      sessionsCount: sessions.length,
      activeCount: sessions.filter(s => s.status === 'active').length,
      idleCount: sessions.filter(s => s.status === 'idle').length,
      pausedCount: sessions.filter(s => s.status === 'paused').length,
      maxSessions: this.maxSessions
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.sessions.clear()
    this.sessionCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.maxSessions = 10
  }
}

// Global singleton
export const concurrentSessions = new ConcurrentSessions()

export default concurrentSessions