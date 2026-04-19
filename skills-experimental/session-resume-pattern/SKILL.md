# Session Resume Pattern Skill

Session Resume Pattern - restoreSessionStateFromLog + extractTodosFromTranscript reverse scan + mode matching warning + agent restoration + refreshAgentDefinitionsForModeSwitch + processResumedConversation + restoreWorktreeForResume + exitRestoredWorktree + forkSession handling + contentReplacement seed。

## 功能概述

从Claude Code的utils/sessionRestore.ts提取的Session resume模式，用于OpenClaw的会话恢复。

## 核心机制

### restoreSessionStateFromLog

```typescript
export function restoreSessionStateFromLog(
  result: ResumeResult,
  setAppState: (f: (prev: AppState) => AppState) => void,
): void {
  // Restore file history state
  if (result.fileHistorySnapshots && result.fileHistorySnapshots.length > 0) {
    fileHistoryRestoreStateFromLog(result.fileHistorySnapshots, newState => {
      setAppState(prev => ({ ...prev, fileHistory: newState }))
    })
  }

  // Restore attribution state (ant-only feature)
  if (feature('COMMIT_ATTRIBUTION') && result.attributionSnapshots) {
    attributionRestoreStateFromLog(result.attributionSnapshots, newState => {
      setAppState(prev => ({ ...prev, attribution: newState }))
    })
  }

  // Restore context-collapse commit log + staged snapshot
  if (feature('CONTEXT_COLLAPSE')) {
    require('../services/contextCollapse/persist.js').restoreFromEntries(...)
  }

  // Restore TodoWrite state from transcript
  if (!isTodoV2Enabled() && result.messages) {
    const todos = extractTodosFromTranscript(result.messages)
    if (todos.length > 0) {
      setAppState(prev => ({ ...prev, todos: {...prev.todos, [agentId]: todos} }))
    }
  }
}
// Restore session state from log
# Multiple state restores
```

### extractTodosFromTranscript reverse scan

```typescript
function extractTodosFromTranscript(messages: Message[]): TodoList {
  for (let i = messages.length - 1; i >= 0; i--) {  // Reverse scan
    const msg = messages[i]
    if (msg?.type !== 'assistant') continue
    const toolUse = msg.message.content.find(
      block => block.type === 'tool_use' && block.name === TODO_WRITE_TOOL_NAME,
    )
    if (!toolUse) continue
    const input = toolUse.input
    const parsed = TodoListSchema().safeParse(input.todos)
    return parsed.success ? parsed.data : []
  }
  return []
}
// Reverse scan for last TodoWrite
# Find last tool_use TodoWrite
```

### mode matching warning

```typescript
// Match coordinator/normal mode to the resumed session
let modeWarning: string | undefined
if (feature('COORDINATOR_MODE')) {
  modeWarning = context.modeApi?.matchSessionMode(result.mode)
  if (modeWarning) {
    result.messages.push(createSystemMessage(modeWarning, 'warning'))
  }
}
// Mode matching on resume
# matchSessionMode → warning message
```

### agent restoration

```typescript
export function restoreAgentFromSession(
  agentSetting: string | undefined,
  currentAgentDefinition: AgentDefinition | undefined,
  agentDefinitions: AgentDefinitionsResult,
): { agentDefinition: AgentDefinition | undefined; agentType: string | undefined } {
  // If user already specified --agent on CLI, keep that definition
  if (currentAgentDefinition) {
    return { agentDefinition: currentAgentDefinition, agentType: undefined }
  }

  // If session had no agent, clear any stale bootstrap state
  if (!agentSetting) {
    setMainThreadAgentType(undefined)
    return { agentDefinition: undefined, agentType: undefined }
  }

  const resumedAgent = agentDefinitions.activeAgents.find(
    agent => agent.agentType === agentSetting,
  )
  if (!resumedAgent) {
    logForDebugging(...)
    setMainThreadAgentType(undefined)
    return { agentDefinition: undefined, agentType: undefined }
  }

  setMainThreadAgentType(resumedAgent.agentType)

  // Apply agent's model if user didn't specify one
  if (!getMainLoopModelOverride() && resumedAgent.model && resumedAgent.model !== 'inherit') {
    setMainLoopModelOverride(parseUserSpecifiedModel(resumedAgent.model))
  }

  return { agentDefinition: resumedAgent, agentType: resumedAgent.agentType }
}
// Restore agent from resumed session
# CLI agent > session agent > default
```

### refreshAgentDefinitionsForModeSwitch

```typescript
export async function refreshAgentDefinitionsForModeSwitch(
  modeWasSwitched: boolean,
  currentCwd: string,
  cliAgents: AgentDefinition[],
  currentAgentDefinitions: AgentDefinitionsResult,
): Promise<AgentDefinitionsResult> {
  if (!feature('COORDINATOR_MODE') || !modeWasSwitched) {
    return currentAgentDefinitions
  }

  // Re-derive agent definitions after mode switch
  getAgentDefinitionsWithOverrides.cache.clear?.()
  const freshAgentDefs = await getAgentDefinitionsWithOverrides(currentCwd)
  const freshAllAgents = [...freshAgentDefs.allAgents, ...cliAgents]
  return {
    ...freshAgentDefs,
    allAgents: freshAllAgents,
    activeAgents: getActiveAgentsFromList(freshAllAgents),
  }
}
// Refresh agent definitions after mode switch
# cache.clear + re-derive
```

### processResumedConversation

```typescript
export async function processResumedConversation(
  result: ResumeLoadResult,
  opts: { forkSession: boolean, sessionIdOverride?: string, ... },
  context: { modeApi, mainThreadAgentDefinition, agentDefinitions, ... },
): Promise<ProcessedResume> {
  // Mode matching
  // Session ID setup (fork vs reuse)
  // Restore session metadata
  // Restore worktree
  // Restore agent setting
  // Persist mode
  // Compute initial state
}
// Process resumed conversation
# Multiple restore steps
```

### restoreWorktreeForResume

```typescript
export function restoreWorktreeForResume(
  worktreeSession: PersistedWorktreeSession | null | undefined,
): void {
  const fresh = getCurrentWorktreeSession()
  if (fresh) {
    saveWorktreeState(fresh)  // Fresh worktree takes precedence
    return
  }
  if (!worktreeSession) return

  try {
    process.chdir(worktreeSession.worktreePath)  // TOCTOU-safe existence check
  } catch {
    saveWorktreeState(null)  // Directory gone → override stale cache
    return
  }

  setCwd(worktreeSession.worktreePath)
  setOriginalCwd(getCwd())
  restoreWorktreeSession(worktreeSession)
  clearMemoryFileCaches()
  clearSystemPromptSections()
  getPlansDirectory.cache.clear?.()
}
// Restore worktree on resume
# process.chdir is TOCTOU-safe
```

### exitRestoredWorktree

```typescript
export function exitRestoredWorktree(): void {
  const current = getCurrentWorktreeSession()
  if (!current) return

  restoreWorktreeSession(null)
  clearMemoryFileCaches()
  clearSystemPromptSections()
  getPlansDirectory.cache.clear?.()

  try {
    process.chdir(current.originalCwd)
  } catch {
    return  // Original dir gone, stay put
  }
  setCwd(current.originalCwd)
  setOriginalCwd(getCwd())
}
// Exit restored worktree before /resume to another session
# Clear caches + chdir back
```

### forkSession handling

```typescript
if (!opts.forkSession) {
  const sid = opts.sessionIdOverride ?? result.sessionId
  if (sid) {
    switchSession(asSessionId(sid), opts.transcriptPath ? dirname(opts.transcriptPath) : null)
    await renameRecordingForSession()
    await resetSessionFilePointer()
    restoreCostStateForSession(sid)
  }
} else if (result.contentReplacements?.length) {
  await recordContentReplacement(result.contentReplacements)
  // Fork keeps fresh startup session ID
  // Seed content replacements for fresh session
}
// forkSession vs reuse session
# Fork: keep fresh ID + seed replacements
```

### contentReplacement seed

```typescript
// --fork-session keeps the fresh startup session ID. useLogMessages will
// copy source messages into the new JSONL via recordTranscript, but
// content-replacement entries are a separate entry type only written by
// recordContentReplacement. Without this seed, `claude -r {newSessionId}`
// finds source tool_use_ids in messages but no matching replacement records
// → they're classified as FROZEN → full content sent (cache miss).
await recordContentReplacement(result.contentReplacements)
// Seed content replacements for fork
# Prevent FROZEN classification
```

## 实现建议

### OpenClaw适配

1. **sessionResume**: restoreSessionStateFromLog pattern
2. **reverseScan**: extractTodosFromTranscript reverse scan
3. **agentRestoration**: restoreAgentFromSession pattern
4. **worktreeRestore**: restoreWorktreeForResume + exitRestoredWorktree
5. **forkHandling**: forkSession + contentReplacement seed

### 状态文件示例

```json
{
  "messages": [...],
  "fileHistorySnapshots": [...],
  "sessionId": "abc123",
  "forkSession": false
}
```

## 关键模式

### Reverse Scan Last TodoWrite

```
for (i = messages.length - 1; i >= 0; i--) → reverse scan → last TodoWrite → restore todos
# reverse scan找last TodoWrite
# 最后的tool_use TodoWrite
# restore todos
```

### CLI Agent > Session Agent

```
currentAgentDefinition (CLI) → use CLI | agentSetting (session) → restore session agent | else → default
# CLI agent优先级最高
# session agent次之
# default最后
```

### process.chdir TOCTOU-Safe

```
process.chdir(path) throws ENOENT → directory gone → override cache → TOCTOU-safe
# process.chdir是TOCTOU-safe existence check
# 抛ENOENT=目录不存在
# override stale cache
```

### Fork Seed Content Replacements

```
forkSession → keep fresh ID + recordContentReplacement → seed replacements → prevent FROZEN classification
# fork保持fresh session ID
# seed content replacements
# 防止FROZEN classification
```

### Mode Switch Cache Clear

```
modeWasSwitched → cache.clear + re-derive → fresh agent definitions → coordinator vs normal
# mode switch时cache.clear
# re-derive agent definitions
# coordinator vs normal模式
```

## 借用价值

- ⭐⭐⭐⭐⭐ restoreSessionStateFromLog pattern
- ⭐⭐⭐⭐⭐ Reverse scan last TodoWrite pattern
- ⭐⭐⭐⭐⭐ CLI agent > session agent pattern
- ⭐⭐⭐⭐⭐ process.chdir TOCTOU-safe pattern
- ⭐⭐⭐⭐⭐ Fork seed content replacements pattern

## 来源

- Claude Code: `utils/sessionRestore.ts` (551 lines)
- 分析报告: P54-2