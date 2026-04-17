// @ts-nocheck

/**
 * Prevent Sleep Pattern - 阻止休眠
 * 
 * Source: Claude Code services/preventSleep.ts
 * Pattern: prevent sleep + power management + stay awake + cleanup
 */

interface SleepPrevention {
  id: string
  reason: string
  startTime: number
  active: boolean
}

class PreventSleepService {
  private preventions = new Map<string, SleepPrevention>()
  private preventionCounter = 0
  private systemSleepPrevented = false

  /**
   * Prevent system sleep
   */
  prevent(reason: string): SleepPrevention {
    const id = `prevent-${++this.preventionCounter}`

    const prevention: SleepPrevention = {
      id,
      reason,
      startTime: Date.now(),
      active: true
    }

    this.preventions.set(id, prevention)

    // Would call actual system API to prevent sleep
    // For demo, just set flag
    this.systemSleepPrevented = true

    console.log(`[PreventSleep] Sleep prevented: ${reason}`)

    return prevention
  }

  /**
   * Allow sleep (release prevention)
   */
  allow(id: string): boolean {
    const prevention = this.preventions.get(id)
    if (!prevention) return false

    prevention.active = false
    this.preventions.delete(id)

    // Check if any active preventions remain
    const activeCount = Array.from(this.preventions.values()).filter(p => p.active).length

    if (activeCount === 0) {
      this.systemSleepPrevented = false
      console.log(`[PreventSleep] Sleep allowed`)
    }

    return true
  }

  /**
   * Allow all (release all preventions)
   */
  allowAll(): number {
    const count = this.preventions.size
    this.preventions.clear()
    this.systemSleepPrevented = false

    console.log(`[PreventSleep] All ${count} preventions released`)

    return count
  }

  /**
   * Check if sleep is prevented
   */
  isPrevented(): boolean {
    return this.systemSleepPrevented
  }

  /**
   * Get active preventions
   */
  getActive(): SleepPrevention[] {
    return Array.from(this.preventions.values()).filter(p => p.active)
  }

  /**
   * Get prevention by ID
   */
  getById(id: string): SleepPrevention | undefined {
    return this.preventions.get(id)
  }

  /**
   * Get stats
   */
  getStats(): {
    activeCount: number
    totalCount: number
    systemSleepPrevented: boolean
    longestActive: number | null
  } {
    const active = this.getActive()
    const longestActive = active.length > 0
      ? Math.max(...active.map(p => Date.now() - p.startTime))
      : null

    return {
      activeCount: active.length,
      totalCount: this.preventions.size,
      systemSleepPrevented: this.systemSleepPrevented,
      longestActive
    }
  }

  /**
   * Auto-release preventions after timeout
   */
  async autoReleaseTimeout(timeoutMs: number): Promise<void> {
    const now = Date.now()

    for (const [id, prevention] of this.preventions) {
      if (now - prevention.startTime > timeoutMs) {
        this.allow(id)
      }
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.preventions.clear()
    this.preventionCounter = 0
    this.systemSleepPrevented = false
  }
}

// Global singleton
export const preventSleepService = new PreventSleepService()

export default preventSleepService