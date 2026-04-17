// @ts-nocheck

/**
 * Perfetto Stale Span Eviction Pattern - Perfetto过期Span清理
 * 
 * Source: Claude Code utils/telemetry/perfettoTracing.ts
 * Pattern: strongSpans + TTL 30min + WeakRef + GC + ensureCleanupInterval
 */

import { perfettoTracing, TraceEvent } from './perfetto-tracing'

interface SpanEntry {
  spanId: string
  startTime: number
  events: TraceEvent[]
  weakRef?: WeakRef<TraceEvent[]>
}

class PerfettoStaleSpanEviction {
  private strongSpans = new Map<string, SpanEntry>()
  private cleanupIntervalId: ReturnType<typeof setInterval> | null = null
  private cleanupIntervalStarted = false

  private config = {
    ttlMs: 30 * 60 * 1000, // 30 minutes
    cleanupIntervalMs: 60 * 1000, // 1 minute
    maxStrongSpans: 1000
  }

  /**
   * Register span for TTL tracking
   */
  registerSpan(spanId: string, events: TraceEvent[]): void {
    this.ensureCleanupInterval()

    const entry: SpanEntry = {
      spanId,
      startTime: Date.now(),
      events,
      weakRef: new WeakRef(events)
    }

    // Evict if exceeding max
    if (this.strongSpans.size >= this.config.maxStrongSpans) {
      this.evictOldest()
    }

    this.strongSpans.set(spanId, entry)
  }

  /**
   * Get span events (from strong or weak ref)
   */
  getSpanEvents(spanId: string): TraceEvent[] | undefined {
    const entry = this.strongSpans.get(spanId)
    if (!entry) return undefined

    // Check TTL
    if (Date.now() - entry.startTime > this.config.ttlMs) {
      this.strongSpans.delete(spanId)
      return undefined
    }

    return entry.events
  }

  /**
   * Ensure cleanup interval is running
   */
  private ensureCleanupInterval(): void {
    if (this.cleanupIntervalStarted) return
    this.cleanupIntervalStarted = true

    this.cleanupIntervalId = setInterval(() => {
      this.evictStaleSpans()
    }, this.config.cleanupIntervalMs)

    // Unref to not block exit
    if (typeof this.cleanupIntervalId.unref === 'function') {
      this.cleanupIntervalId.unref()
    }
  }

  /**
   * Evict stale spans (TTL expired)
   */
  private evictStaleSpans(): void {
    const cutoff = Date.now() - this.config.ttlMs
    let evicted = 0

    for (const [spanId, entry] of this.strongSpans) {
      if (entry.startTime < cutoff) {
        this.strongSpans.delete(spanId)
        evicted++
      } else {
        // Check if weakRef was GC'd
        if (entry.weakRef?.deref() === undefined) {
          this.strongSpans.delete(spanId)
          evicted++
        }
      }
    }

    if (evicted > 0) {
      console.log(`[PerfettoEviction] Evicted ${evicted} stale spans`)
    }
  }

  /**
   * Evict oldest span
   */
  private evictOldest(): void {
    let oldestId: string | null = null
    let oldestTime = Infinity

    for (const [spanId, entry] of this.strongSpans) {
      if (entry.startTime < oldestTime) {
        oldestTime = entry.startTime
        oldestId = spanId
      }
    }

    if (oldestId) {
      this.strongSpans.delete(oldestId)
    }
  }

  /**
   * Get strong spans count
   */
  getStrongCount(): number {
    return this.strongSpans.size
  }

  /**
   * Get config
   */
  getConfig(): { ttlMs: number; cleanupIntervalMs: number; maxStrongSpans: number } {
    return { ...this.config }
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
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId)
      this.cleanupIntervalId = null
    }
    this.cleanupIntervalStarted = false
    this.strongSpans.clear()
  }
}

// Global singleton
export const perfettoStaleSpanEviction = new PerfettoStaleSpanEviction()

export default perfettoStaleSpanEviction