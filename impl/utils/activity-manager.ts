// @ts-nocheck

/**
 * Activity Manager Pattern - 活动管理
 * 
 * Source: Claude Code utils/activityManager.ts
 * Pattern: activity manager + tracking + idle detection + timeout
 */

interface Activity {
  id: string
  type: string
  description: string
  startedAt: number
  endedAt: number | null
  metadata: Record<string, any>
}

class ActivityManager {
  private activities = new Map<string, Activity>()
  private currentActivity: string | null = null
  private lastActivityTime = Date.now()
  private idleThresholdMs = 30000 // 30 seconds
  private activityCounter = 0

  /**
   * Start activity
   */
  start(type: string, description: string, metadata?: Record<string, any>): Activity {
    // End current activity if exists
    if (this.currentActivity) {
      this.end(this.currentActivity)
    }

    const id = `activity-${++this.activityCounter}-${Date.now()}`

    const activity: Activity = {
      id,
      type,
      description,
      startedAt: Date.now(),
      endedAt: null,
      metadata: metadata ?? {}
    }

    this.activities.set(id, activity)
    this.currentActivity = id
    this.lastActivityTime = Date.now()

    return activity
  }

  /**
   * End activity
   */
  end(id: string): boolean {
    const activity = this.activities.get(id)
    if (!activity) return false

    activity.endedAt = Date.now()

    if (this.currentActivity === id) {
      this.currentActivity = null
    }

    return true
  }

  /**
   * Get activity
   */
  get(id: string): Activity | undefined {
    return this.activities.get(id)
  }

  /**
   * Get current activity
   */
  getCurrent(): Activity | null {
    if (!this.currentActivity) return null

    return this.activities.get(this.currentActivity) ?? null
  }

  /**
   * Record heartbeat
   */
  heartbeat(): void {
    this.lastActivityTime = Date.now()
  }

  /**
   * Check idle
   */
  isIdle(): boolean {
    return Date.now() - this.lastActivityTime > this.idleThresholdMs
  }

  /**
   * Get idle duration
   */
  getIdleDuration(): number {
    return Math.max(0, Date.now() - this.lastActivityTime)
  }

  /**
   * Set idle threshold
   */
  setIdleThreshold(ms: number): void {
    this.idleThresholdMs = ms
  }

  /**
   * Get activities by type
   */
  getByType(type: string): Activity[] {
    return Array.from(this.activities.values())
      .filter(a => a.type === type)
  }

  /**
   * Get activities in range
   */
  getInRange(start: number, end: number): Activity[] {
    return Array.from(this.activities.values())
      .filter(a => a.startedAt >= start && a.startedAt <= end)
  }

  /**
   * Get recent activities
   */
  getRecent(count: number = 10): Activity[] {
    return Array.from(this.activities.values())
      .sort((a, b) => b.startedAt - a.startedAt)
      .slice(0, count)
  }

  /**
   * Get stats
   */
  getStats(): {
    activitiesCount: number
    activeCount: number
    completedCount: number
    isIdle: boolean
    idleDurationMs: number
  } {
    const activities = Array.from(this.activities.values())

    return {
      activitiesCount: activities.length,
      activeCount: activities.filter(a => a.endedAt === null).length,
      completedCount: activities.filter(a => a.endedAt !== null).length,
      isIdle: this.isIdle(),
      idleDurationMs: this.getIdleDuration()
    }
  }

  /**
   * Clear old activities
   */
  clearOld(thresholdMs: number = 3600000): number {
    const threshold = Date.now() - thresholdMs

    let cleared = 0

    for (const [id, activity] of this.activities) {
      if (activity.endedAt !== null && activity.endedAt < threshold) {
        this.activities.delete(id)
        cleared++
      }
    }

    return cleared
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.activities.clear()
    this.currentActivity = null
    this.lastActivityTime = Date.now()
    this.idleThresholdMs = 30000
    this.activityCounter = 0
  }
}

// Global singleton
export const activityManager = new ActivityManager()

export default activityManager