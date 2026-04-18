# ExitPlanMode Scanner Stateful Classifier Pattern

## Source
Claude Code: `utils/ultraplan/ccrSession.ts` (ExitPlanModeScanner)

## Pattern
Stateful classifier for CCR event stream - ingest SDKMessage[] batches + precedence order + rescan after rejection.

## Code Example
```typescript
export type ScanResult =
  | { kind: 'approved'; plan: string }
  | { kind: 'teleport'; plan: string }
  | { kind: 'rejected'; id: string }
  | { kind: 'pending' }
  | { kind: 'terminated'; subtype: string }
  | { kind: 'unchanged' }

export type UltraplanPhase = 'running' | 'needs_input' | 'plan_ready'

export class ExitPlanModeScanner {
  private exitPlanCalls: string[] = []
  private results = new Map<string, ToolResultBlockParam>()
  private rejectedIds = new Set<string>()
  private terminated: { subtype: string } | null = null
  private rescanAfterRejection = false
  everSeenPending = false

  get rejectCount(): number {
    return this.rejectedIds.size
  }

  get hasPendingPlan(): boolean {
    const id = this.exitPlanCalls.findLast(c => !this.rejectedIds.has(c))
    return id !== undefined && !this.results.has(id)
  }

  ingest(newEvents: SDKMessage[]): ScanResult {
    // Parse events: assistant→tool_use, user→tool_result, result→terminated
    for (const m of newEvents) {
      if (m.type === 'assistant') {
        for (const block of m.message.content) {
          if (block.type === 'tool_use' && block.name === EXIT_PLAN_MODE_V2_TOOL_NAME) {
            this.exitPlanCalls.push(block.id)
          }
        }
      } else if (m.type === 'user') {
        for (const block of content) {
          if (block.type === 'tool_result') {
            this.results.set(block.tool_use_id, block)
          }
        }
      } else if (m.type === 'result' && m.subtype !== 'success') {
        this.terminated = { subtype: m.subtype }
      }
    }

    // Skip-scan when nothing changed
    const shouldScan = newEvents.length > 0 || this.rescanAfterRejection
    this.rescanAfterRejection = false

    // Scan backwards: newest non-rejected first
    // Precedence: approved > terminated > rejected > pending > unchanged
    if (shouldScan) {
      for (let i = this.exitPlanCalls.length - 1; i >= 0; i--) {
        const id = this.exitPlanCalls[i]!
        if (this.rejectedIds.has(id)) continue
        const tr = this.results.get(id)
        if (!tr) {
          found = { kind: 'pending' }
        } else if (tr.is_error === true) {
          const teleportPlan = extractTeleportPlan(tr.content)
          found = teleportPlan !== null
            ? { kind: 'teleport', plan: teleportPlan }
            : { kind: 'rejected', id }
        } else {
          found = { kind: 'approved', plan: extractApprovedPlan(tr.content) }
        }
        break
      }
    }

    // Bookkeeping
    if (found?.kind === 'rejected') {
      this.rejectedIds.add(found.id)
      this.rescanAfterRejection = true  // Rejection moves target
    }
    if (this.terminated) return { kind: 'terminated', subtype: this.terminated.subtype }
    if (found?.kind === 'approved' || found?.kind === 'teleport') return found
    if (found?.kind === 'rejected') return found
    if (found?.kind === 'pending') {
      this.everSeenPending = true
      return found
    }
    return { kind: 'unchanged' }
  }
}
```

## Key Concepts
1. **Stateful Classifier**: exitPlanCalls array + results Map + rejectedIds Set
2. **Precedence Order**: approved > terminated > rejected > pending > unchanged
3. **rescanAfterRejection**: Rejection moves newest-non-rejected target
4. **Backwards Scan**: findLast from newest to oldest non-rejected
5. **terminated Check**: result(success) ignored, only error subtypes matter
6. **everSeenPending**: Track if ExitPlanMode was ever reached (for timeout message)

## Benefits
- Pure function (no I/O) - unit testable
- Handles batch containing approved + terminated
- Rejection tracking without losing approved plan

## When to Use
- Remote session event stream parsing
- Tool approval state tracking
- Poll-based event classification

## Related Patterns
- Poll Remote Session Events (teleport.ts)
- Remote Agent Task (RemoteAgentTask.ts)
- ExitPlanModeV2Tool (ExitPlanModeV2Tool.ts)