# Teammate Reconnection Session Pattern

## Source
Claude Code: `utils/swarm/reconnection.ts` (computeInitialTeamContext, initializeTeammateContextFromSession)

## Pattern
Compute teamContext synchronously before first render + resume from transcript.

## Code Example
```typescript
/**
 * Computes initial teamContext BEFORE first render (eliminates useEffect workaround).
 */
export function computeInitialTeamContext(): AppState['teamContext'] | undefined {
  const context = getDynamicTeamContext()  // Set in main.tsx from CLI args

  if (!context?.teamName || !context?.agentName) return undefined

  const { teamName, agentId, agentName } = context

  const teamFile = readTeamFile(teamName)
  if (!teamFile) return undefined

  const teamFilePath = getTeamFilePath(teamName)
  const isLeader = !agentId

  return {
    teamName,
    teamFilePath,
    leadAgentId: teamFile.leadAgentId,
    selfAgentId: agentId,
    selfAgentName: agentName,
    isLeader,
    teammates: {},
  }
}

/**
 * Initialize teammate context from resumed session.
 * Called when resuming session with teamName/agentName in transcript.
 */
export function initializeTeammateContextFromSession(
  setAppState: (updater: (prev: AppState) => AppState) => void,
  teamName: string,
  agentName: string,
): void {
  const teamFile = readTeamFile(teamName)
  if (!teamFile) return

  // Find member in team file to get agentId
  const member = teamFile.members.find(m => m.name === agentName)
  const agentId = member?.agentId

  const teamFilePath = getTeamFilePath(teamName)

  setAppState(prev => ({
    ...prev,
    teamContext: {
      teamName,
      teamFilePath,
      leadAgentId: teamFile.leadAgentId,
      selfAgentId: agentId,
      selfAgentName: agentName,
      isLeader: false,
      teammates: {},
    }
  }))
}

// Usage in main.tsx:
const initialState = {
  ...otherInitialState,
  teamContext: computeInitialTeamContext(),  // Sync before render
}
```

## Key Concepts
1. **Sync Compute**: computeInitialTeamContext() called in main.tsx before render
2. **Dynamic Team Context**: getDynamicTeamContext() from CLI args
3. **Resume Support**: initializeTeammateContextFromSession() from transcript
4. **Team File Lookup**: readTeamFile() for leader ID
5. **Member Find**: Find agentId from member name (may have been removed)

## Benefits
- No useEffect workaround for teamContext
- Works for fresh spawn and resumed sessions
- Teammate identity available from first render

## When to Use
- Session startup initialization
- Resumed session reconnection
- React state initialization

## Related Patterns
- Dynamic Team Context (teammate.ts)
- Team Helpers (teamHelpers.ts)
- AppState Provider (state/AppStateStore.ts)