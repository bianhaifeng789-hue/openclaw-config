// @ts-nocheck

/**
 * Session Storage Utils Pattern - 会话存储工具
 * 
 * Source: Claude Code utils/sessionStorage.ts + utils/sessionStoragePortable.ts
 * Pattern: session data storage + portable format + serialization + compression
 */

interface SessionData {
  id: string
  data: Record<string, any>
  createdAt: number
  updatedAt: number
  size: number
}

class SessionStorageUtils {
  private sessions = new Map<string, SessionData>()
  private storagePath = '/tmp/sessions'
  private maxSessionSize = 1024 * 1024 // 1MB
  private compressionThreshold = 10240 // 10KB

  /**
   * Save session data
   */
  save(id: string, data: Record<string, any>): SessionData {
    const serialized = JSON.stringify(data)
    const size = serialized.length

    if (size > this.maxSessionSize) {
      throw new Error(`Session data too large: ${size} bytes`)
    }

    const session: SessionData = {
      id,
      data,
      createdAt: this.sessions.get(id)?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      size
    }

    this.sessions.set(id, session)

    return session
  }

  /**
   * Load session data
   */
  load(id: string): Record<string, any> | undefined {
    const session = this.sessions.get(id)
    if (!session) return undefined

    return session.data
  }

  /**
   * Delete session data
   */
  delete(id: string): boolean {
    return this.sessions.delete(id)
  }

  /**
   * Check if session exists
   */
  exists(id: string): boolean {
    return this.sessions.has(id)
  }

  /**
   * Export session to portable format
   */
  exportPortable(id: string): string | null {
    const session = this.sessions.get(id)
    if (!session) return null

    const portable = {
      version: 1,
      id: session.id,
      data: session.data,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }

    const serialized = JSON.stringify(portable)

    // Would compress if over threshold
    // For demo, just return serialized
    return serialized
  }

  /**
   * Import session from portable format
   */
  importPortable(portableStr: string): SessionData {
    const portable = JSON.parse(portableStr)

    // Validate format
    if (!portable.version || !portable.id || !portable.data) {
      throw new Error('Invalid portable format')
    }

    const session: SessionData = {
      id: portable.id,
      data: portable.data,
      createdAt: portable.createdAt ?? Date.now(),
      updatedAt: portable.updatedAt ?? Date.now(),
      size: portableStr.length
    }

    this.sessions.set(session.id, session)

    return session
  }

  /**
   * Get session metadata
   */
  getMetadata(id: string): SessionData | undefined {
    const session = this.sessions.get(id)
    if (!session) return undefined

    return {
      ...session,
      data: {} // Exclude actual data
    }
  }

  /**
   * Get all session IDs
   */
  getAllIds(): string[] {
    return Array.from(this.sessions.keys())
  }

  /**
   * Get storage stats
   */
  getStats(): {
    totalSessions: number
    totalSize: number
    averageSize: number
    maxSessionSize: number
  } {
    const sessions = Array.from(this.sessions.values())
    const totalSize = sessions.reduce((sum, s) => sum + s.size, 0)

    return {
      totalSessions: sessions.length,
      totalSize,
      averageSize: sessions.length > 0 ? totalSize / sessions.length : 0,
      maxSessionSize: this.maxSessionSize
    }
  }

  /**
   * Clear all sessions
   */
  clear(): void {
    this.sessions.clear()
  }

  /**
   * Set storage path
   */
  setStoragePath(path: string): void {
    this.storagePath = path
  }

  /**
   * Set max session size
   */
  setMaxSessionSize(size: number): void {
    this.maxSessionSize = size
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.sessions.clear()
    this.storagePath = '/tmp/sessions'
    this.maxSessionSize = 1024 * 1024
    this.compressionThreshold = 10240
  }
}

// Global singleton
export const sessionStorageUtils = new SessionStorageUtils()

export default sessionStorageUtils