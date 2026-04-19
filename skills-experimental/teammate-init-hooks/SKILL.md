# Teammate Init Hooks Pattern

## Source
Claude Code: `utils/swarm/teammateInit.ts` (initializeTeammateHooks)

## Pattern
Register Stop hook to notify leader when teammate becomes idle + team permissions apply.

## Code Example
```typescript
export function initializeTeammateHooks(
  setAppState: (updater: (prev: AppState) => AppState) => void,
  sessionId: string,
  teamInfo: { teamName: string; agentId: string; agentName: string },
): void {
  const { teamName, agentId, agentName } = teamInfo

  const teamFile = readTeamFile(teamName)
  if (!teamFile) return

  const leadAgentId = teamFile.leadAgentId

  // Apply team-wide allowed paths if any
  if (teamFile.teamAllowedPaths && teamFile.teamAllowedPaths.length > 0) {
    for (const allowedPath of teamFile.teamAllowedPaths) {
      // Absolute paths: prepend / to create //path/** pattern
      const ruleContent = allowedPath.path.startsWith('/')
        ? `/${allowedPath.path}/**`
        : `${allowedPath.path}/**`

      setAppState(prev => ({
        ...prev,
        toolPermissionContext: applyPermissionUpdate(prev.toolPermissionContext, {
          type: 'addRules',
          rules: [{ toolName: allowedPath.toolName, ruleContent }],
          behavior: 'allow',
          destination: 'session',
        })
      }))
    }
  }

  // Find leader's name
  const leadMember = teamFile.members.find(m => m.agentId === leadAgentId)
  const leadAgentName = leadMember?.name || 'team-lead'

  // Don't register if this agent is leader
  if (agentId === leadAgentId) return

  // Register Stop hook to notify leader when teammate stops
  addFunctionHook(
    setAppState,
    sessionId,
    'Stop',
    '',  // No matcher - applies to all Stop events
    async (messages, _signal) => {
      // Mark teammate as idle (fire and forget)
      void setMemberActive(teamName, agentName, false)

      // Send idle notification to leader
      const notification = createIdleNotification(agentName, {
        idleReason: 'available',
        summary: getLastPeerDmSummary(messages),
      })
      await writeToMailbox(leadAgentName, {
        from: agentName,
        text: jsonStringify(notification),
        timestamp: new Date().toISOString(),
        color: getTeammateColor(),
      })
      return true  // Don't block the Stop
    },
    'Failed to send idle notification to team leader',
    { timeout: 10000 }
  )
}
```

## Key Concepts
1. **Team-Wide Allowed Paths**: TeamFile.teamAllowedPaths → permission rules
2. **Absolute Path Convention**: `/path` → `//path/**` (sandbox pattern)
3. **Stop Hook Registration**: addFunctionHook(sessionId, 'Stop', handler)
4. **Idle Notification**: createIdleNotification + writeToMailbox
5. **Leader Skip**: Don't register hook if this agent is leader
6. **getLastPeerDmSummary**: Extract summary from messages for notification

## Benefits
- Team-wide permissions applied automatically
- Leader notified when teammate available
- Hook timeout for graceful shutdown

## When to Use
- Teammate session initialization
- Team-wide permission propagation
- Idle notification to leader

## Related Patterns
- Hook System (hooks/sessionHooks.ts)
- Teammate Mailbox (teammateMailbox.ts)
- Permission Update (PermissionUpdate.ts)