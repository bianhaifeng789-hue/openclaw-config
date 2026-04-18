# Teammate Spawn Config Types Pattern

## Source
Claude Code: `utils/swarm/backends/types.ts` (TeammateSpawnConfig, TeammateSpawnResult)

## Pattern
Typed spawn config + discriminated union result + abort controller linking.

## Code Example
```typescript
export type TeammateIdentity = {
  name: string            // Agent name (e.g., "researcher")
  teamName: string        // Team this teammate belongs to
  color?: AgentColorName  // UI differentiation
  planModeRequired?: boolean  // Plan mode approval required
}

export type TeammateSpawnConfig = TeammateIdentity & {
  prompt: string          // Initial task for teammate
  cwd: string             // Working directory
  model?: string          // Model override
  systemPrompt?: string   // Resolved from workflow config
  systemPromptMode?: 'default' | 'replace' | 'append'  // How to apply
  worktreePath?: string   // Optional git worktree
  parentSessionId: string // For transcript correlation
  permissions?: string[]  // Tool permissions to grant
  allowPermissionPrompts?: boolean  // Unlisted tools auto-denied if false
}

export type TeammateSpawnResult = {
  success: boolean
  agentId: string         // Format: agentName@teamName
  error?: string

  // In-process only
  abortController?: AbortController  // Lifecycle management
  taskId?: string                    // AppState.tasks ID

  // Pane-based only
  paneId?: PaneId                   // Terminal pane ID
}

export type TeammateMessage = {
  text: string
  from: string           // Sender agent ID
  color?: string
  timestamp?: string     // ISO string
  summary?: string       // 5-10 word preview
}
```

## Key Concepts
1. **TeammateIdentity**: Shared subset across TeammateContext
2. **systemPromptMode**: default (append) | replace | append
3. **parentSessionId**: Transcript correlation for audit
4. **allowPermissionPrompts**: Unlisted tools auto-denied if false
5. **Result Discriminated**: success + agentId + backend-specific fields

## Benefits
- Type-safe spawn configuration
- Backend-specific result fields
- Abort controller linking for lifecycle

## When to Use
- Teammate spawning across backends
- Permission prompt forwarding
- Transcript correlation

## Related Patterns
- Backend Type Discriminated Union (backends/types.ts)
- In-Process Spawn (spawnInProcess.ts)
- Pane Backend Executor (PaneBackendExecutor.ts)