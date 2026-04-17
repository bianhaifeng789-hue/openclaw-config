// @ts-nocheck

/**
 * Perfetto Trace Event Format Pattern - Perfetto追踪事件格式
 * 
 * Source: Claude Code utils/telemetry/perfettoTracing.ts
 * Pattern: Chrome Trace Event format + agent hierarchy + MAX_EVENTS cap + flow events
 */

interface TraceEvent {
  name: string
  ph: 'b' | 'e' | 'B' | 'E' | 'X' | 'i' | 's' | 't' | 'f' // Phase
  ts: number // Timestamp in microseconds
  dur?: number // Duration (for complete events)
  pid?: number
  tid?: number
  id?: string // Flow event id
  cat?: string // Category
  args?: Record<string, any> // Arguments
}

interface PerfettoConfig {
  maxEvents: number // 100k default
  flushIntervalMs: number
  outputPath?: string
}

class PerfettoTracing {
  private events: TraceEvent[] = []
  private eventSequence = 0
  private config: PerfettoConfig = {
    maxEvents: 100000,
    flushIntervalMs: 5000
  }
  private flushIntervalId: ReturnType<typeof setInterval> | null = null

  /**
   * Start a span (BEGIN phase)
   */
  beginSpan(name: string, args?: Record<string, any>, parentId?: string): string {
    this.ensureCapacity()

    const spanId = `span-${this.eventSequence++}`
    const ts = Date.now() * 1000 // Convert to microseconds

    this.events.push({
      name,
      ph: 'B', // BEGIN
      ts,
      pid: 1,
      tid: process.pid,
      id: spanId,
      cat: 'agent',
      args: { ...args, parentId }
    })

    // Flow event linking to parent
    if (parentId) {
      this.events.push({
        name: 'flow',
        ph: 'f', // FLOW_END
        ts,
        pid: 1,
        id: parentId,
        cat: 'flow',
        args: { to: spanId }
      })
    }

    return spanId
  }

  /**
   * End a span (END phase)
   */
  endSpan(spanId: string, args?: Record<string, any>): void {
    this.ensureCapacity()

    const ts = Date.now() * 1000

    this.events.push({
      name: 'span-end',
      ph: 'E', // END
      ts,
      pid: 1,
      tid: process.pid,
      id: spanId,
      cat: 'agent',
      args
    })
  }

  /**
   * Complete event (instant with duration)
   */
  completeEvent(name: string, durationUs: number, args?: Record<string, any>): void {
    this.ensureCapacity()

    const ts = Date.now() * 1000 - durationUs

    this.events.push({
      name,
      ph: 'X', // COMPLETE
      ts,
      dur: durationUs,
      pid: 1,
      tid: process.pid,
      cat: 'agent',
      args
    })
  }

  /**
   * Instant event (marker)
   */
  instantEvent(name: string, args?: Record<string, any>): void {
    this.ensureCapacity()

    this.events.push({
      name,
      ph: 'i', // INSTANT
      ts: Date.now() * 1000,
      pid: 1,
      tid: process.pid,
      cat: 'marker',
      args,
      s: 'g' // Global scope
    })
  }

  /**
   * Ensure capacity (evict oldest if exceeding MAX_EVENTS)
   */
  private ensureCapacity(): void {
    if (this.events.length >= this.config.maxEvents) {
      // Evict 10% oldest events
      const evictCount = Math.floor(this.config.maxEvents * 0.1)
      this.events = this.events.slice(evictCount)
      console.warn(`[Perfetto] Evicted ${evictCount} events (cap reached)`)
    }
  }

  /**
   * Get events for export
   */
  getEvents(): TraceEvent[] {
    return [...this.events]
  }

  /**
   * Export to Chrome Trace Event format (JSON)
   */
  export(): string {
    return JSON.stringify({
      traceEvents: this.events,
      metadata: {
        producerName: 'openclaw-agent',
        timestamp: Date.now()
      }
    }, null, 2)
  }

  /**
   * Clear events
   */
  clear(): void {
    this.events = []
    this.eventSequence = 0
  }

  /**
   * Get stats
   */
  getStats(): { eventCount: number; maxEvents: number; utilization: number } {
    return {
      eventCount: this.events.length,
      maxEvents: this.config.maxEvents,
      utilization: this.events.length / this.config.maxEvents
    }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<PerfettoConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    if (this.flushIntervalId) {
      clearInterval(this.flushIntervalId)
      this.flushIntervalId = null
    }
    this.clear()
  }
}

// Global singleton
export const perfettoTracing = new PerfettoTracing()

export default perfettoTracing