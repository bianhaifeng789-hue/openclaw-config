# Swarm Permission Sync Pattern

## Source
Claude Code: `utils/swarm/permissionSync.ts` (SwarmPermissionRequest, createPermissionRequest)

## Pattern
Worker → leader permission request forwarding + mailbox-based message passing.

## Code Example
```typescript
export const SwarmPermissionRequestSchema = lazySchema(() =>
  z.object({
    id: z.string(),              // Unique request ID
    workerId: z.string(),        // CLAUDE_CODE_AGENT_ID
    workerName: z.string(),      // CLAUDE_CODE_AGENT_NAME
    workerColor: z.string().optional(),
    teamName: z.string(),        // Team for routing
    toolName: z.string(),        // Tool requiring permission
    toolUseId: z.string(),       // Original toolUseID
    description: z.string(),     // Human-readable description
    input: z.record(z.string(), z.unknown()),  // Tool input
    permissionSuggestions: z.array(z.unknown()),
    status: z.enum(['pending', 'approved', 'rejected']),
    resolvedBy: z.enum(['worker', 'leader']).optional(),
    resolvedAt: z.number().optional(),
    feedback: z.string().optional(),  // Rejection feedback
    updatedInput: z.record(z.string(), z.unknown()).optional(),
    permissionUpdates: z.array(z.unknown()).optional(),
    createdAt: z.number(),
  })
)

export function getPermissionDir(teamName: string): string {
  return join(getTeamDir(teamName), 'permissions')
}

function getPendingDir(teamName: string): string {
  return join(getPermissionDir(teamName), 'pending')
}

function getResolvedDir(teamName: string): string {
  return join(getPermissionDir(teamName), 'resolved')
}

export function generateRequestId(): string {
  return `perm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function createPermissionRequest(params: {
  toolName: string
  toolUseId: string
  input: Record<string, unknown>
  description: string
  permissionSuggestions?: unknown[]
}): SwarmPermissionRequest {
  const teamName = getTeamName()
  const workerId = getAgentId()
  const workerName = getAgentName()
  const workerColor = getTeammateColor()

  if (!teamName || !workerId || !workerName) throw new Error('Missing team/worker info')

  return {
    id: generateRequestId(),
    workerId, workerName, workerColor, teamName,
    toolName: params.toolName,
    toolUseId: params.toolUseId,
    description: params.description,
    input: params.input,
    permissionSuggestions: params.permissionSuggestions || [],
    status: 'pending',
    createdAt: Date.now(),
  }
}

// Flow:
// 1. Worker creates request → writes to pending/
// 2. Leader polls pending/ → detects request
// 3. User approves/denies → leader writes to resolved/
// 4. Worker polls resolved/ → continues execution
```

## Key Concepts
1. **Lazy Schema**: lazySchema() for runtime Zod construction
2. **Permission Directories**: pending/ + resolved/ under team/permissions/
3. **Request ID Generation**: perm-{timestamp}-{random}
4. **Status Discriminated**: pending | approved | rejected
5. **Worker → Leader Flow**: Worker writes pending, Leader writes resolved
6. **Resolution Fields**: resolvedBy, feedback, updatedInput, permissionUpdates

## Benefits
- Worker can request leader approval
- Persistent storage across sessions
- Full resolution context for audit

## When to Use
- Worker tool permission forwarding
- Swarm permission coordination
- Mailbox-based request/response

## Related Patterns
- Lazy Schema Pattern (lazySchema.ts)
- Teammate Mailbox (teammateMailbox.ts)
- Team Helpers (teamHelpers.ts)