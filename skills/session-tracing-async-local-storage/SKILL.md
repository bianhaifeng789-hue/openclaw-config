# Session Tracing AsyncLocalStorage Pattern

## Source
Claude Code: `utils/telemetry/sessionTracing.ts` (interactionContext, toolContext)

## Pattern
AsyncLocalStorage for span context + WeakRef + strongSpans for GC management.

## Code Example
```typescript
interface SpanContext {
  span: Span
  startTime: number
  attributes: Record<string, string | number | boolean>
  ended?: boolean
  perfettoSpanId?: string
}

// ALS stores SpanContext directly (strong reference while span active)
const interactionContext = new AsyncLocalStorage<SpanContext | undefined>()
const toolContext = new AsyncLocalStorage<SpanContext | undefined>()

// With ALS strong ref, activeSpans can use WeakRef
const activeSpans = new Map<string, WeakRef<SpanContext>>()

// Spans NOT in ALS need strong reference (LLM request, blocked-on-user, etc.)
const strongSpans = new Map<string, SpanContext>()

const SPAN_TTL_MS = 30 * 60 * 1000  // 30 minutes

let _cleanupIntervalStarted = false

function ensureCleanupInterval(): void {
  if (_cleanupIntervalStarted) return
  _cleanupIntervalStarted = true

  const interval = setInterval(() => {
    const cutoff = Date.now() - SPAN_TTL_MS

    for (const [spanId, weakRef] of activeSpans) {
      const ctx = weakRef.deref()

      if (ctx === undefined) {
        // GC collected - remove refs
        activeSpans.delete(spanId)
        strongSpans.delete(spanId)
      } else if (ctx.startTime < cutoff) {
        // TTL expired - end span and remove
        if (!ctx.ended) ctx.span.end()  // Flush attributes
        activeSpans.delete(spanId)
        strongSpans.delete(spanId)
      }
    }
  }, 60_000)

  if (typeof interval.unref === 'function') {
    interval.unref()  // Don't block process exit
  }
}

export function startInteractionSpan(userPrompt: string): Span {
  ensureCleanupInterval()

  const perfettoSpanId = isPerfettoTracingEnabled()
    ? startInteractionPerfettoSpan(userPrompt)
    : undefined

  const span = tracer.startSpan('claude_code.interaction', { attributes })

  const spanId = getSpanId(span)
  const spanContextObj: SpanContext = {
    span,
    startTime: Date.now(),
    attributes,
    perfettoSpanId,
  }

  activeSpans.set(spanId, new WeakRef(spanContextObj))

  // Enter ALS context
  interactionContext.enterWith(spanContextObj)

  return span
}

export function endInteractionSpan(): void {
  const spanContext = interactionContext.getStore()
  if (!spanContext || spanContext.ended) return

  // End Perfetto span
  if (spanContext.perfettoSpanId) {
    endInteractionPerfettoSpan(spanContext.perfettoSpanId)
  }

  spanContext.span.end()
  spanContext.ended = true

  // Clear ALS context
  interactionContext.enterWith(undefined)
}
```

## Key Concepts
1. **AsyncLocalStorage**: interactionContext + toolContext for span isolation
2. **WeakRef + strongSpans**: ALS holds strong ref, activeSpans uses WeakRef
3. **SPAN_TTL_MS**: 30 minutes TTL for orphaned spans
4. **ensureCleanupInterval**: Lazy start on first span (not module load)
5. **unref() Timer**: Don't block process exit
6. **deref() Check**: undefined = GC collected, cutoff = TTL expired

## Benefits
- Span context isolated per async flow
- GC can collect when ALS cleared
- Orphaned span safety net

## When to Use
- OTel span lifecycle management
- Async context isolation for tracing
- Long-running session cleanup

## Related Patterns
- Perfetto Stale Span Eviction (perfettoTracing.ts)
- Abort Controller Utils (abortController.ts)
- AsyncLocalStorage Context (teammateContext.ts)