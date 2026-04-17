// @ts-nocheck

/**
 * OTel Event Logging Pattern - OTel事件日志
 * 
 * Source: Claude Code utils/telemetry/events.ts
 * Pattern: eventSequence monotonically increasing + promptId correlation + redaction + JSONL append
 */

interface OTelEvent {
  eventSequence: number
  eventName: string
  timestamp: number
  promptId?: string
  sessionId?: string
  attributes: Record<string, string | number | boolean>
  redacted?: boolean
}

class OTelEventLogging {
  private eventSequence = 0
  private events: OTelEvent[] = []
  private promptIdMap = new Map<string, OTelEvent[]>()

  private config = {
    maxEvents: 10000,
    redactPatterns: ['api_key', 'secret', 'password', 'token'],
    outputPath: 'logs/events.jsonl'
  }

  /**
   * Log event with auto-increment sequence
   */
  logEvent(eventName: string, attributes: Record<string, any>, promptId?: string): number {
    const sequence = ++this.eventSequence

    // Redact sensitive attributes
    const redactedAttributes = this.redactAttributes(attributes)

    const event: OTelEvent = {
      eventSequence: sequence,
      eventName,
      timestamp: Date.now(),
      promptId,
      sessionId: this.getCurrentSessionId(),
      attributes: redactedAttributes,
      redacted: this.hasRedactedFields(attributes)
    }

    // Ensure capacity
    this.ensureCapacity()

    this.events.push(event)

    // Track by prompt ID
    if (promptId) {
      const promptEvents = this.promptIdMap.get(promptId) ?? []
      promptEvents.push(event)
      this.promptIdMap.set(promptId, promptEvents)
    }

    return sequence
  }

  /**
   * Get events by prompt ID (correlation)
   */
  getEventsByPromptId(promptId: string): OTelEvent[] {
    return this.promptIdMap.get(promptId) ?? []
  }

  /**
   * Get all events
   */
  getAllEvents(): OTelEvent[] {
    return [...this.events]
  }

  /**
   * Get current session ID
   */
  private getCurrentSessionId(): string {
    // Would integrate with session system
    return `session-${Date.now()}`
  }

  /**
   * Redact sensitive attributes
   */
  private redactAttributes(attributes: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, value] of Object.entries(attributes)) {
      if (this.shouldRedact(key)) {
        result[key] = '[REDACTED]'
      } else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * Check if field should be redacted
   */
  private shouldRedact(key: string): boolean {
    return this.config.redactPatterns.some(p => key.toLowerCase().includes(p))
  }

  /**
   * Check if any field was redacted
   */
  private hasRedactedFields(attributes: Record<string, any>): boolean {
    for (const key of Object.keys(attributes)) {
      if (this.shouldRedact(key)) return true
    }
    return false
  }

  /**
   * Ensure capacity (evict oldest if exceeding max)
   */
  private ensureCapacity(): void {
    if (this.events.length >= this.config.maxEvents) {
      const evictCount = Math.floor(this.config.maxEvents * 0.1)
      this.events = this.events.slice(evictCount)
    }
  }

  /**
   * Export to JSONL
   */
  exportJSONL(): string {
    return this.events.map(e => JSON.stringify(e)).join('\n')
  }

  /**
   * Get event sequence counter
   */
  getEventSequence(): number {
    return this.eventSequence
  }

  /**
   * Get stats
   */
  getStats(): {
    eventCount: number
    maxEvents: number
    promptIdCount: number
    sequence: number
  } {
    return {
      eventCount: this.events.length,
      maxEvents: this.config.maxEvents,
      promptIdCount: this.promptIdMap.size,
      sequence: this.eventSequence
    }
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
    this.eventSequence = 0
    this.events = []
    this.promptIdMap.clear()
  }
}

// Global singleton
export const otelEventLogging = new OTelEventLogging()

export default otelEventLogging