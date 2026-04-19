# In-Process Teammate Spawn Pattern

## Source
Claude Code: `utils/swarm/spawnInProcess.ts` (spawnInProcessTeammate, killInProcessTeammate)

## Pattern
In-process teammate spawn: AsyncLocalStorage context + AbortController + AppState task.

## Code Example
```typescript
export async function spawnInProcessTeammate(
  config: InProcessSpawnConfig,
  context: SpawnContext,
): Promise<InProcessSpawnOutput> {
  const { name, teamName, prompt, color, planModeRequired, model } = config
  const { setAppState } = context

  const agentId = formatAgentId(name, teamName)
  const taskId = generateTaskId('in_process_teammate')

  // Create independent AbortController (NOT linked to leader's query abort)
  const abortController = createAbortController()

  const parentSessionId = getSessionId()

  // Teammate identity for AppState
  const identity: TeammateIdentity = {
    agentId, agentName: name, teamName, color, planModeRequired, parentSessionId
  }

  // Teammate context for AsyncLocalStorage
  const teammateContext = createTeammateContext({
    agentId, agentName: name, teamName, color, planModeRequired,
    parentSessionId, abortController
  })

  // Register Perfetto agent for hierarchy visualization
  if (isPerfettoTracingEnabled()) {
    registerPerfettoAgent(agentId, name, parentSessionId)
  }

  // Create task state
  const taskState: InProcessTeammateTaskState = {
    ...createTaskStateBase(taskId, 'in_process_teammate', description, toolUseId),
    type: 'in_process_teammate',
    status: 'running',
    identity, prompt, model, abortController,
    awaitingPlanApproval: false,
    spinnerVerb: sample(getSpinnerVerbs()),
    pastTenseVerb: sample(TURN_COMPLETION_VERBS),
    permissionMode: planModeRequired ? 'plan' : 'default',
    isIdle: false, shutdownRequested: false,
    messages: [],
  }

  // Register cleanup handler
  const unregisterCleanup = registerCleanup(async () => {
    abortController.abort()
  })
  taskState.unregisterCleanup = unregisterCleanup

  // Register task in AppState
  registerTask(taskState, setAppState)

  return { success: true, agentId, taskId, abortController, teammateContext }
}

export function killInProcessTeammate(taskId: string, setAppState: SetAppStateFn): boolean {
  setAppState((prev: AppState) => {
    const task = prev.tasks[taskId]
    if (!task || task.type !== 'in_process_teammate' || task.status !== 'running') return prev

    const teammateTask = task as InProcessTeammateTaskState

    // Abort controller
    teammateTask.abortController?.abort()
    teammateTask.unregisterCleanup?.()

    // Call pending idle callbacks
    teammateTask.onIdleCallbacks?.forEach(cb => cb())

    // Remove from teamContext.teammates
    let updatedTeamContext = prev.teamContext
    if (prev.teamContext?.teammates && teammateTask.identity.agentId) {
      const { [teammateTask.identity.agentId]: _, ...remaining } = prev.teamContext.teammates
      updatedTeamContext = { ...prev.teamContext, teammates: remaining }
    }

    return {
      ...prev,
      teamContext: updatedTeamContext,
      tasks: {
        ...prev.tasks,
        [taskId]: {
          ...teammateTask,
          status: 'killed',
          notified: true,
          endTime: Date.now(),
          onIdleCallbacks: [],
          abortController: undefined,
        }
      }
    }
  })

  // Remove from team file (outside state updater)
  if (teamName && agentId) removeMemberByAgentId(teamName, agentId)

  // Emit SDK termination
  emitTaskTerminatedSdk(taskId, 'stopped', { toolUseId, summary })

  // Evict after delay
  setTimeout(evictTerminalTask.bind(null, taskId, setAppState), STOPPED_DISPLAY_MS)

  unregisterPerfettoAgent(agentId)

  return killed
}
```

## Key Concepts
1. **Independent AbortController**: NOT linked to leader's query abort
2. **AsyncLocalStorage Context**: teammateContext for identity isolation
3. **AppState Task Registration**: InProcessTeammateTaskState in tasks map
4. **Cleanup Handler**: registerCleanup for graceful shutdown
5. **onIdleCallbacks**: Unblock waiters (engine.waitForIdle) on kill
6. **teamContext.teammates Removal**: Dynamic ES key removal

## Benefits
- In-process execution without subprocess spawn
- Proper lifecycle management via AbortController
- CleanupRegistry integration

## When to Use
- In-process teammate spawning
- Same-process agent execution
- AsyncLocalStorage identity isolation

## Related Patterns
- Cleanup Registry Pattern (cleanupRegistry.ts)
- Abort Controller Utils (abortController.ts)
- Task Framework (task/framework.ts)