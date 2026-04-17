// @ts-nocheck

/**
 * Sleep Tool Pattern - Sleep工具
 * 
 * Source: Claude Code tools/SleepTool/SleepTool.ts + tools/SleepTool/SleepTool.tsx
 * Pattern: sleep tool + delays + timeouts + pauses + waiting
 */

interface SleepResult {
  durationMs: number
  reason?: string
  completed: boolean
  timestamp: number
}

class SleepTool {
  private sleeps: SleepResult[] = []
  private sleepCounter = 0

  /**
   * Sleep
   */
  async sleep(durationMs: number, reason?: string): SleepResult {
    const result: SleepResult = {
      durationMs,
      reason,
      completed: true,
      timestamp: Date.now()
    }

    // Would actually sleep
    // For demo, simulate
    await this.delay(10) // Minimal delay

    this.sleeps.push(result)

    return result
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Sleep seconds
   */
  async sleepSeconds(seconds: number, reason?: string): SleepResult {
    return this.sleep(seconds * 1000, reason)
  }

  /**
   * Sleep minutes
   */
  async sleepMinutes(minutes: number, reason?: string): SleepResult {
    return this.sleep(minutes * 60 * 1000, reason)
  }

  /**
   * Get sleeps
   */
  getSleeps(): SleepResult[] {
    return [...this.sleeps]
  }

  /**
   * Get recent sleeps
   */
  getRecent(count: number = 10): SleepResult[] {
    return this.sleeps.slice(-count)
  }

  /**
   * Get total sleep time
   */
  getTotalSleepTime(): number {
    return this.sleeps.reduce((sum, s) => sum + s.durationMs, 0)
  }

  /**
   * Get stats
   */
  getStats(): {
    sleepsCount: number
    totalDurationMs: number
    averageDurationMs: number
    completedCount: number
  } {
    const avgDuration = this.sleeps.length > 0
      ? this.sleeps.reduce((sum, s) => sum + s.durationMs, 0) / this.sleeps.length
      : 0

    return {
      sleepsCount: this.sleeps.length,
      totalDurationMs: this.getTotalSleepTime(),
      averageDurationMs: avgDuration,
      completedCount: this.sleeps.filter(s => s.completed).length
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.sleeps = []
    this.sleepCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const sleepTool = new SleepTool()

export default sleepTool