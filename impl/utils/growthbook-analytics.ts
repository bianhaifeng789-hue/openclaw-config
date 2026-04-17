// @ts-nocheck

/**
 * GrowthBook Analytics Pattern - GrowthBook分析
 * 
 * Source: Claude Code services/analytics/growthbook.ts + services/analytics/index.ts
 * Pattern: feature flags + A/B testing + analytics + user segmentation
 */

interface FeatureFlag {
  key: string
  enabled: boolean
  value?: any
  conditions?: Record<string, any>
}

interface AnalyticsEvent {
  name: string
  properties: Record<string, any>
  timestamp: number
  userId?: string
}

class GrowthBookAnalytics {
  private featureFlags = new Map<string, FeatureFlag>()
  private events: AnalyticsEvent[] = []
  private userId: string | null = null
  private maxEvents = 500

  /**
   * Set user ID
   */
  setUserId(id: string): void {
    this.userId = id
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.userId
  }

  /**
   * Set feature flag
   */
  setFlag(key: string, enabled: boolean, value?: any, conditions?: Record<string, any>): void {
    this.featureFlags.set(key, {
      key,
      enabled,
      value,
      conditions
    })
  }

  /**
   * Check if feature enabled
   */
  isFeatureEnabled(key: string): boolean {
    const flag = this.featureFlags.get(key)

    if (!flag) return false

    // Check conditions
    if (flag.conditions) {
      return this.evaluateConditions(flag.conditions)
    }

    return flag.enabled
  }

  /**
   * Get feature value
   */
  getFeatureValue(key: string, defaultValue?: any): any {
    const flag = this.featureFlags.get(key)

    if (!flag || !flag.enabled) return defaultValue

    return flag.value ?? defaultValue
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(conditions: Record<string, any>): boolean {
    // Would evaluate against user attributes
    // For demo, return true
    return true
  }

  /**
   * Track event
   */
  track(name: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      userId: this.userId
    }

    this.events.push(event)
    this.ensureCapacity()
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(): void {
    while (this.events.length > this.maxEvents) {
      this.events.shift()
    }
  }

  /**
   * Get events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  /**
   * Get events by name
   */
  getEventsByName(name: string): AnalyticsEvent[] {
    return this.events.filter(e => e.name === name)
  }

  /**
   * Get all flags
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values())
  }

  /**
   * Get enabled flags
   */
  getEnabledFlags(): FeatureFlag[] {
    return Array.from(this.featureFlags.values())
      .filter(f => f.enabled)
  }

  /**
   * Get stats
   */
  getStats(): {
    totalFlags: number
    enabledFlags: number
    totalEvents: number
    uniqueEventNames: number
  } {
    const uniqueEventNames = new Set(this.events.map(e => e.name)).size

    return {
      totalFlags: this.featureFlags.size,
      enabledFlags: this.getEnabledFlags().length,
      totalEvents: this.events.length,
      uniqueEventNames
    }
  }

  /**
   * Clear events
   */
  clearEvents(): void {
    this.events = []
  }

  /**
   * Clear flags
   */
  clearFlags(): void {
    this.featureFlags.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearEvents()
    this.clearFlags()
    this.userId = null
    this.maxEvents = 500
  }
}

// Global singleton
export const growthBookAnalytics = new GrowthBookAnalytics()

// Set default feature flags
growthBookAnalytics.setFlag('memory_maintenance', true)
growthBookAnalytics.setFlag('auto_dream', true)
growthBookAnalytics.setFlag('voice_mode', false)
growthBookAnalytics.setFlag('compact_service', true)
growthBookAnalytics.setFlag('tips_service', true)

export default growthBookAnalytics