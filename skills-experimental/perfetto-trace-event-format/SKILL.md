# Perfetto Trace Event Format Pattern

## Source
Claude Code: `utils/telemetry/perfettoTracing.ts`

## Pattern
Chrome Trace Event format for ui.perfetto.dev visualization + agent hierarchy + bounded event array.

## Code Example
```typescript
export type TraceEventPhase =
  | 'B'  // Begin duration event
  | 'E'  // End duration event
  | 'X'  // Complete event (with duration)
  | 'i'  // Instant event
  | 'C'  // Counter event
  | 'b'  // Async begin
  | 'n'  // Async instant
  | 'e'  // Async end
  | 'M'  // Metadata event

export type TraceEvent = {
  name: string
  cat: string
  ph: TraceEventPhase
  ts: number      // Timestamp in microseconds
  pid: number     // Process ID (1 for main, agent IDs for subagents)
  tid: number     // Thread ID (numeric hash of agent name)
  dur?: number    // Duration in microseconds (for 'X' events)
  args?: Record<string, unknown>
  id?: string     // For async events
}

type AgentInfo = {
  agentId: string
  agentName: string
  parentAgentId?: string
  processId: number
  threadId: number
}

// Global state
const metadataEvents: TraceEvent[] = []  // Process/thread names survive eviction
const events: TraceEvent[] = []          // Bounded by MAX_EVENTS
const MAX_EVENTS = 100_000               // ~30MB, enough for any debugging session

const pendingSpans = new Map<string, PendingSpan>()
const agentRegistry = new Map<string, AgentInfo>()
let processIdCounter = 1
const agentIdToProcessId = new Map<string, number>()

function stringToNumericHash(str: string): number {
  return Math.abs(djb2Hash(str)) || 1
}

function getProcessIdForAgent(agentId: string): number {
  const existing = agentIdToProcessId.get(agentId)
  if (existing !== undefined) return existing
  processIdCounter++
  agentIdToProcessId.set(agentId, processIdCounter)
  return processIdCounter
}

function getTimestamp(): number {
  return (Date.now() - startTimeMs) * 1000  // Microseconds from start
}

function evictOldestEvents(): void {
  if (events.length < MAX_EVENTS) return
  const dropped = events.splice(0, MAX_EVENTS / 2)  // Half-batch splice
  events.unshift({
    name: 'trace_truncated',
    cat: '__metadata',
    ph: 'i',
    ts: dropped[dropped.length - 1]?.ts ?? 0,
    pid: 1,
    tid: 0,
    args: { dropped_events: dropped.length },
  })
}

function buildTraceDocument(): string {
  return jsonStringify({
    traceEvents: [...metadataEvents, ...events],
    metadata: {
      session_id: getSessionId(),
      trace_start_time: new Date(startTimeMs).toISOString(),
      agent_count: totalAgentCount,
    },
  })
}
```

## Key Concepts
1. **Chrome Trace Event Format**: B/E/X/i phases + ts/pid/tid/dur
2. **Agent Hierarchy**: processId for agents (1 for main), threadId = djb2Hash(agentName)
3. **Metadata Events**: Process/thread names separate (survive eviction)
4. **MAX_EVENTS Cap**: 100,000 (~30MB) + half-batch splice eviction
5. **trace_truncated Marker**: Synthetic event shows gap in ui.perfetto.dev
6. **Timestamp Offset**: Microseconds from startTimeMs (relative)

## Benefits
- Visualizable in ui.perfetto.dev and chrome://tracing
- Agent hierarchy with parent-child relationships
- Bounded memory with visible truncation gaps

## When to Use
- Debugging session visualization
- Agent swarm hierarchy tracking
- Performance trace analysis

## Related Patterns
- Session Tracing (sessionTracing.ts)
- DJB2 Hash Pattern (hash.ts)
- Cleanup Registry (cleanupRegistry.ts)