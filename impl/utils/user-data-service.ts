// @ts-nocheck

/**
 * User Data Pattern - 用户数据
 * 
 * Source: Claude Code utils/user.ts + utils/userData.ts
 * Pattern: user data + preferences + storage + profile
 */

interface UserData {
  userId: string
  name?: string
  email?: string
  preferences: Record<string, any>
  createdAt: number
  updatedAt: number
}

interface UserSession {
  sessionId: string
  userId: string
  startTime: number
  endTime: number | null
  metadata?: Record<string, any>
}

class UserDataService {
  private users = new Map<string, UserData>()
  private sessions = new Map<string, UserSession>()
  private currentUser: string | null = null
  private sessionCounter = 0

  /**
   * Create user
   */
  createUser(userId: string, name?: string, email?: string): UserData {
    const user: UserData = {
      userId,
      name,
      email,
      preferences: {},
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.users.set(userId, user)

    return user
  }

  /**
   * Get user
   */
  getUser(userId: string): UserData | undefined {
    return this.users.get(userId)
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserData | null {
    if (!this.currentUser) return null
    return this.users.get(this.currentUser) ?? null
  }

  /**
   * Set current user
   */
  setCurrentUser(userId: string): void {
    this.currentUser = userId
  }

  /**
   * Update user
   */
  updateUser(userId: string, updates: Partial<UserData>): UserData | null {
    const user = this.users.get(userId)
    if (!user) return null

    Object.assign(user, updates)
    user.updatedAt = Date.now()

    return user
  }

  /**
   * Set preference
   */
  setPreference(userId: string, key: string, value: any): void {
    const user = this.users.get(userId)
    if (!user) return

    user.preferences[key] = value
    user.updatedAt = Date.now()
  }

  /**
   * Get preference
   */
  getPreference(userId: string, key: string): any {
    const user = this.users.get(userId)
    return user?.preferences[key]
  }

  /**
   * Create session
   */
  createSession(userId: string, metadata?: Record<string, any>): UserSession {
    const sessionId = `session-${++this.sessionCounter}-${Date.now()}`

    const session: UserSession = {
      sessionId,
      userId,
      startTime: Date.now(),
      endTime: null,
      metadata
    }

    this.sessions.set(sessionId, session)

    return session
  }

  /**
   * End session
   */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (!session) return false

    session.endTime = Date.now()

    return true
  }

  /**
   * Get session
   */
  getSession(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Get user sessions
   */
  getUserSessions(userId: string): UserSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
  }

  /**
   * Get active sessions
   */
  getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values())
      .filter(s => s.endTime === null)
  }

  /**
   * Get stats
   */
  getStats(): {
    userCount: number
    sessionCount: number
    activeSessions: number
    currentUser: string | null
  } {
    return {
      userCount: this.users.size,
      sessionCount: this.sessions.size,
      activeSessions: this.getActiveSessions().length,
      currentUser: this.currentUser
    }
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): boolean {
    return this.users.delete(userId)
  }

  /**
   * Clear all
   */
  clear(): void {
    this.users.clear()
    this.sessions.clear()
    this.currentUser = null
    this.sessionCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const userDataService = new UserDataService()

export default userDataService