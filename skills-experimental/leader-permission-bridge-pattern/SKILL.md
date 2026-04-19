# Leader Permission Bridge Pattern

## Source
Claude Code: `utils/swarm/leaderPermissionBridge.ts`

## Pattern
Module-level bridge for REPL → in-process teammate permission queue access.

## Code Example
```typescript
export type SetToolUseConfirmQueueFn = (
  updater: (prev: ToolUseConfirm[]) => ToolUseConfirm[],
) => void

export type SetToolPermissionContextFn = (
  context: ToolPermissionContext,
  options?: { preserveMode?: boolean },
) => void

let registeredSetter: SetToolUseConfirmQueueFn | null = null
let registeredPermissionContextSetter: SetToolPermissionContextFn | null = null

export function registerLeaderToolUseConfirmQueue(
  setter: SetToolUseConfirmQueueFn,
): void {
  registeredSetter = setter
}

export function getLeaderToolUseConfirmQueue(): SetToolUseConfirmQueueFn | null {
  return registeredSetter
}

export function unregisterLeaderToolUseConfirmQueue(): void {
  registeredSetter = null
}

export function registerLeaderSetToolPermissionContext(
  setter: SetToolPermissionContextFn,
): void {
  registeredPermissionContextSetter = setter
}

export function getLeaderSetToolPermissionContext(): SetToolPermissionContextFn | null {
  return registeredPermissionContextSetter
}

// Usage in in-process teammate:
const queueSetter = getLeaderToolUseConfirmQueue()
if (queueSetter) {
  queueSetter(prev => [...prev, permissionRequest])
}
```

## Key Concepts
1. **Module-Level Bridge**: let registeredSetter = null
2. **Register/Get/Unregister**: Standard bridge pattern
3. **Updater Pattern**: (prev: ToolUseConfirm[]) => ToolUseConfirm[]
4. **REPL Registration**: REPL registers its queue setter on mount
5. **In-Process Access**: Non-React code accesses via getter

## Benefits
- Non-React code can queue permission prompts
- REPL-controlled UI dialog display
- Clean unregister for session end

## When to Use
- In-process teammate permission prompts
- Cross-context function access
- React → non-React bridge

## Related Patterns
- Permission Sync (permissionSync.ts)
- Tool Use Confirm Queue (PermissionRequest.tsx)
- Teammate Mailbox (teammateMailbox.ts)