# Backend Type Discriminated Union Pattern

## Source
Claude Code: `utils/swarm/backends/types.ts`

## Pattern
BackendType + PaneBackendType discriminated union + isPaneBackend type guard.

## Code Example
```typescript
export type BackendType = 'tmux' | 'iterm2' | 'in-process'

export type PaneBackendType = 'tmux' | 'iterm2'  // Subset without in-process

export type PaneId = string  // Opaque identifier for pane

export type CreatePaneResult = {
  paneId: PaneId
  isFirstTeammate: boolean  // Affects layout strategy
}

export type PaneBackend = {
  readonly type: BackendType
  readonly displayName: string
  readonly supportsHideShow: boolean

  isAvailable(): Promise<boolean>
  isRunningInside(): Promise<boolean>
  createTeammatePaneInSwarmView(name: string, color: AgentColorName): Promise<CreatePaneResult>
  sendCommandToPane(paneId: PaneId, command: string, useExternalSession?: boolean): Promise<void>
  setPaneBorderColor(paneId: PaneId, color: AgentColorName): Promise<void>
  setPaneTitle(paneId: PaneId, name: string, color: AgentColorName): Promise<void>
  enablePaneBorderStatus(windowTarget?: string): Promise<void>
  rebalancePanes(windowTarget: string, hasLeader: boolean): Promise<void>
  killPane(paneId: PaneId): Promise<boolean>
  hidePane(paneId: PaneId): Promise<boolean>
  showPane(paneId: PaneId, targetWindowOrPane: string): Promise<boolean>
}

export type TeammateExecutor = {
  readonly type: BackendType
  isAvailable(): Promise<boolean>
  spawn(config: TeammateSpawnConfig): Promise<TeammateSpawnResult>
  sendMessage(agentId: string, message: TeammateMessage): Promise<void>
  terminate(agentId: string, reason?: string): Promise<boolean>
  kill(agentId: string): Promise<boolean>
  isActive(agentId: string): Promise<boolean>
}

// Type guard
export function isPaneBackend(type: BackendType): type is 'tmux' | 'iterm2' {
  return type === 'tmux' || type === 'iterm2'
}
```

## Key Concepts
1. **BackendType**: 3 backend types (tmux, iterm2, in-process)
2. **PaneBackendType**: Subset for pane-based only (tmux, iterm2)
3. **PaneBackend**: Low-level pane operations interface
4. **TeammateExecutor**: High-level teammate lifecycle interface
5. **Type Guard**: isPaneBackend() for narrowing

## Benefits
- Clear separation: PaneBackend (low-level) vs TeammateExecutor (high-level)
- Type-safe backend selection
- Subset type for pane-only contexts

## When to Use
- Multi-backend teammate execution
- Pane-based vs in-process distinction
- Backend capability checks

## Related Patterns
- Backend Detection Registry (backends/registry.ts)
- Teammate Spawn Config (backends/types.ts)
- Pane Backend Executor (PaneBackendExecutor.ts)