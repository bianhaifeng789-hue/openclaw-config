# Ultraplan Poll Network Retry Pattern

## Source
Claude Code: `utils/ultraplan/ccrSession.ts` (pollForApprovedExitPlanMode)

## Pattern
Transient network error retry with MAX_CONSECUTIVE_FAILURES + sleep interval.

## Code Example
```typescript
const POLL_INTERVAL_MS = 3000
const MAX_CONSECUTIVE_FAILURES = 5

export async function pollForApprovedExitPlanMode(
  sessionId: string,
  timeoutMs: number,
  onPhaseChange?: (phase: UltraplanPhase) => void,
  shouldStop?: () => boolean,
): Promise<PollResult> {
  const deadline = Date.now() + timeoutMs
  const scanner = new ExitPlanModeScanner()
  let cursor: string | null = null
  let failures = 0

  while (Date.now() < deadline) {
    if (shouldStop?.()) {
      throw new UltraplanPollError('poll stopped', 'stopped', scanner.rejectCount)
    }

    try {
      const resp = await pollRemoteSessionEvents(sessionId, cursor)
      newEvents = resp.newEvents
      cursor = resp.lastEventId
      failures = 0  // Reset on success
    } catch (e) {
      const transient = isTransientNetworkError(e)
      if (!transient || ++failures >= MAX_CONSECUTIVE_FAILURES) {
        throw new UltraplanPollError(e.message, 'network_or_unknown', scanner.rejectCount, { cause: e })
      }
      await sleep(POLL_INTERVAL_MS)
      continue  // Retry after transient error
    }

    // Process events...
    await sleep(POLL_INTERVAL_MS)
  }

  throw new UltraplanPollError('timeout', 'timeout_pending', scanner.rejectCount)
}
```

## Key Concepts
1. **Transient Detection**: isTransientNetworkError(e) check
2. **Failure Counter**: ++failures, reset to 0 on success
3. **MAX_FAILURES**: 5 consecutive failures before abort
4. **Sleep Interval**: POLL_INTERVAL_MS 3000ms between polls
5. **Deadline Check**: Date.now() < timeoutMs loop condition
6. **shouldStop Callback**: External cancellation check

## Benefits
- Resilient to brief network blips
- Failure counter prevents infinite retry
- External cancellation support

## When to Use
- Long-running poll operations
- Network resilience patterns
- External cancellation hooks

## Related Patterns
- ExitPlanMode Scanner (ccrSession.ts)
- Remote Agent Task (RemoteAgentTask.ts)
- Sleep Utils (sleep.ts)