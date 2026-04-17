// @ts-nocheck

/**
 * Teammate Pattern - Teammate协作
 * 
 * Source: Claude Code utils/teammate.ts + utils/teammateContext.ts
 * Pattern: teammate + collaboration + shared context + peer communication
 */

interface TeammateInfo {
  id: string
  sessionId: string
  projectId: string
  role: string
  connected: boolean
  lastSeen: number
  sharedContext: Record<string, any>
}

class TeammateService {
  private teammates = new Map<string, TeammateInfo>()
  private connections = new Map<string, { from: string; to: string; status: string }>()

  /**
   * Register teammate
   */
  register(id: string, sessionId: string, projectId: string, role: string): TeammateInfo {
    const info: TeammateInfo = {
      id,
      sessionId,
      projectId,
      role,
      connected: true,
      lastSeen: Date.now(),
      sharedContext: {}
    }

    this.teammates.set(id, info)

    return info
  }

  /**
   * Get teammate
   */
  getTeammate(id: string): TeammateInfo | undefined {
    return this.teammates.get(id)
  }

  /**
   * Update shared context
   */
  updateContext(id: string, context: Record<string, any>): boolean {
    const teammate = this.teammates.get(id)
    if (!teammate) return false

    teammate.sharedContext = { ...teammate.sharedContext, ...context }
    teammate.lastSeen = Date.now()

    return true
  }

  /**
   * Get shared context
   */
  getSharedContext(id: string): Record<string, any> | null {
    const teammate = this.teammates.get(id)
    return teammate?.sharedContext ?? null
  }

  /**
   * Connect teammates
   */
  connect(fromId: string, toId: string): boolean {
    const from = this.teammates.get(fromId)
    const to = this.teammates.get(toId)

    if (!from || !to) return false

    const connId = `${fromId}-${toId}`
    this.connections.set(connId, { from: fromId, to: toId, status: 'connected' })

    from.connected = true
    to.connected = true

    return true
  }

  /**
   * Disconnect teammates
   */
  disconnect(fromId: string, toId: string): boolean {
    const connId = `${fromId}-${toId}`
    const conn = this.connections.get(connId)

    if (!conn) return false

    conn.status = 'disconnected'

    return true
  }

  /**
   * Get connections
   */
  getConnections(): Array<{ from: string; to: string; status: string }> {
    return Array.from(this.connections.values())
  }

  /**
   * Get teammates by project
   */
  getByProject(projectId: string): TeammateInfo[] {
    return Array.from(this.teammates.values())
      .filter(t => t.projectId === projectId)
  }

  /**
   * Get connected teammates
   */
  getConnected(): TeammateInfo[] {
    return Array.from(this.teammates.values())
      .filter(t => t.connected)
  }

  /**
   * Update last seen
   */
  updateLastSeen(id: string): boolean {
    const teammate = this.teammates.get(id)
    if (!teammate) return false

    teammate.lastSeen = Date.now()

    return true
  }

  /**
   * Disconnect teammate
   */
  disconnectTeammate(id: string): boolean {
    const teammate = this.teammates.get(id)
    if (!teammate) return false

    teammate.connected = false

    return true
  }

  /**
   * Get stats
   */
  getStats(): {
    teammatesCount: number
    connectedCount: number
    connectionsCount: number
    projectsCount: number
  } {
    const projects = new Set(Array.from(this.teammates.values()).map(t => t.projectId))

    return {
      teammatesCount: this.teammates.size,
      connectedCount: this.getConnected().length,
      connectionsCount: this.connections.size,
      projectsCount: projects.size
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.teammates.clear()
    this.connections.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const teammateService = new TeammateService()

export default teammateService