// @ts-nocheck

/**
 * Skill Loaded Analytics Event Pattern - Skill加载分析事件
 * 
 * Source: Claude Code utils/telemetry/skillLoadedEvent.ts
 * Pattern: skillLoaded event + loadTimeMs + skillSize + validationState + feature gate check
 */

interface SkillLoadedEvent {
  skillId: string
  skillName: string
  loadTimeMs: number
  skillSize?: number
  validationState: 'valid' | 'invalid' | 'warning'
  warnings?: string[]
  source: string
  timestamp: number
}

class SkillLoadedAnalytics {
  private loadedSkills = new Map<string, SkillLoadedEvent>()
  private loadTimes: number[] = []

  private config = {
    trackLoadTime: true,
    trackSize: true,
    maxLoadTimesHistory: 100
  }

  /**
   * Record skill loaded event
   */
  recordSkillLoaded(
    skillId: string,
    skillName: string,
    loadTimeMs: number,
    options?: {
      skillSize?: number
      validationState?: 'valid' | 'invalid' | 'warning'
      warnings?: string[]
      source?: string
    }
  ): void {
    const event: SkillLoadedEvent = {
      skillId,
      skillName,
      loadTimeMs,
      skillSize: options?.skillSize,
      validationState: options?.validationState ?? 'valid',
      warnings: options?.warnings,
      source: options?.source ?? 'workspace',
      timestamp: Date.now()
    }

    this.loadedSkills.set(skillId, event)

    // Track load time
    if (this.config.trackLoadTime) {
      this.loadTimes.push(loadTimeMs)
      if (this.loadTimes.length > this.config.maxLoadTimesHistory) {
        this.loadTimes.shift()
      }
    }

    // Would send to analytics
    this.sendToAnalytics(event)
  }

  /**
   * Send to analytics (mock)
   */
  private sendToAnalytics(event: SkillLoadedEvent): void {
    // Would integrate with actual analytics service
    console.log(`[SkillAnalytics] Skill loaded: ${event.skillName} (${event.loadTimeMs}ms)`)
  }

  /**
   * Get skill load event
   */
  getSkillEvent(skillId: string): SkillLoadedEvent | undefined {
    return this.loadedSkills.get(skillId)
  }

  /**
   * Get average load time
   */
  getAverageLoadTime(): number {
    if (this.loadTimes.length === 0) return 0
    return this.loadTimes.reduce((a, b) => a + b, 0) / this.loadTimes.length
  }

  /**
   * Get load time statistics
   */
  getLoadTimeStats(): {
    min: number
    max: number
    avg: number
    count: number
  } {
    if (this.loadTimes.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 }
    }

    const sorted = [...this.loadTimes].sort((a, b) => a - b)
    return {
      min: sorted[0] ?? 0,
      max: sorted[sorted.length - 1] ?? 0,
      avg: this.getAverageLoadTime(),
      count: this.loadTimes.length
    }
  }

  /**
   * Get loaded skills count
   */
  getLoadedCount(): number {
    return this.loadedSkills.size
  }

  /**
   * Get validation summary
   */
  getValidationSummary(): {
    valid: number
    invalid: number
    warning: number
  } {
    let valid = 0, invalid = 0, warning = 0

    for (const event of this.loadedSkills.values()) {
      if (event.validationState === 'valid') valid++
      else if (event.validationState === 'invalid') invalid++
      else warning++
    }

    return { valid, invalid, warning }
  }

  /**
   * Check feature gate before recording
   */
  shouldRecord(): boolean {
    // Would check GrowthBook gate
    // For now, always record
    return true
  }

  /**
   * Set config
   */
  setConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.loadedSkills.clear()
    this.loadTimes = []
  }
}

// Global singleton
export const skillLoadedAnalytics = new SkillLoadedAnalytics()

export default skillLoadedAnalytics