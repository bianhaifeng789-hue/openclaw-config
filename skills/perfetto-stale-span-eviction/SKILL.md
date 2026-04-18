# Perfetto Stale Span Eviction Pattern

## Source
Claude Code: `utils/telemetry/perfettoTracing.ts` (evictStaleSpans, STALE_SPAN_TTL_MS)

## Pattern
TTL-based pending span eviction + emit incomplete end event + cleanup interval.

## Code Example
```typescript
const STALE_SPAN_TTL_MS = 30 * 60 * 1000  // 30 minutes
const STALE_SPAN_CLEANUP_INTERVAL_MS = 60 * 1000  // 1 minute
let staleSpanCleanupId: ReturnType<typeof setInterval> | null = null

type PendingSpan = {
  name: string
  category: string
  startTime: number
  agentInfo: AgentInfo
  args: Record<string, unknown>
}

const pendingSpans = new Map<string, PendingSpan>()

function evictStaleSpans(): void {
  const now = getTimestamp()
  const ttlUs = STALE_SPAN_TTL_MS * 1000  // Convert ms to microseconds

  for (const [spanId, span] of pendingSpans) {
    if (now - span.startTime > ttlUs) {
      // Emit end event so span shows as incomplete in trace
      events.push({
        name: span.name,
        cat: span.category,
        ph: 'E',
        ts: now,
        pid: span.agentInfo.processId,
        tid: span.agentInfo.threadId,
        args: {
          ...span.args,
          evicted: true,
          duration_ms: (now - span.startTime) / 1000,
        },
      })
      pendingSpans.delete(spanId)
    }
  }
}

// Initialize in startPerfettoTracing():
staleSpanCleanupId = setInterval(evictStaleSpans, STALE_SPAN_CLEANUP_INTERVAL_MS)
if (typeof staleSpanCleanupId.unref === 'function') {
  staleSpanCleanupId.unref()  // Don't block process exit
}

// Cleanup in writeTrace():
if (staleSpanCleanupId) {
  clearInterval(staleSpanCleanupId)
  staleSpanCleanupId = null
}
```

## Key Concepts
1. **30-Minute TTL**: STALE_SPAN_TTL_MS = 30 * 60 * 1000
2. **Cleanup Interval**: 60 seconds (STALE_SPAN_CLEANUP_INTERVAL_MS)
3. **Incomplete End Event**: Emit 'E' phase with evicted=true + duration_ms
4. **unref() Timer**: Don't block process exit
5. **Microsecond Conversion**: TTL in ms → ttlUs for timestamp comparison

## Benefits
- Prevents stale span accumulation
- Incomplete spans visible in trace
- Process doesn't hang on cleanup interval

## When to Use
- Long-running session tracing
- Pending span lifecycle management
- Orphaned span cleanup

## Related Patterns
- Perfetto Trace Event Format (perfettoTracing.ts)
- Session Tracing TTL (sessionTracing.ts)
- Cleanup Registry Pattern (cleanupRegistry.ts)