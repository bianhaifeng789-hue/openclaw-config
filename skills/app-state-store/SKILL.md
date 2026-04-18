# AppState Store Skill

应用状态存储 - Zustand-style store + onChange hook + Selector pattern + External metadata sync。

## 功能概述

从Claude Code的AppState系统提取的状态管理模式，用于OpenClaw的全局状态管理。

## 核心机制

### Zustand-style Store

```typescript
export type Store<T> = {
  getState: () => T
  setState: (updater: (prev: T) => T) => void
  subscribe: (listener: Listener) => () => void
}

export function createStore<T>(initialState: T, onChange?: OnChange<T>): Store<T> {
  let state = initialState
  const listeners = new Set<Listener>()

  return {
    getState: () => state,
    setState: (updater: (prev: T) => T) => {
      const prev = state
      const next = updater(prev)
      if (Object.is(next, prev)) return  // No change → skip
      state = next
      onChange?.({ newState: next, oldState: prev })
      for (const listener of listeners) listener()
    },
    subscribe: (listener: Listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
// Zustand-style minimal store
// updater function pattern
// Object.is compare (no unnecessary notify)
```

### onChange Hook (Single Choke Point)

```typescript
export function onChangeAppState({ newState, oldState }) {
  // toolPermissionContext.mode — single choke point for CCR/SDK mode sync
  const prevMode = oldState.toolPermissionContext.mode
  const newMode = newState.toolPermissionContext.mode
  if (prevMode !== newMode) {
    const prevExternal = toExternalPermissionMode(prevMode)
    const newExternal = toExternalPermissionMode(newMode)
    if (prevExternal !== newExternal) {
      notifySessionMetadataChanged({ permission_mode: newExternal })
    }
    notifyPermissionModeChanged(newMode)
  }
  // Any setAppState call → onChange hook → notify
  // Scattered callsites need zero changes
}
```

### Selector Pattern

```typescript
export function useAppState<T>(selector: (state: AppState) => T): T {
  const store = useAppStore()
  const get = () => selector(store.getState())
  return useSyncExternalStore(store.subscribe, get, get)
}
// useSyncExternalStore for reactivity
// Selector for optimized rendering
// Only re-render when selected value changes
```

### Discriminated Union Selector

```typescript
export type ActiveAgentForInput =
  | { type: 'leader' }
  | { type: 'viewed'; task: InProcessTeammateTaskState }
  | { type: 'named_agent'; task: LocalAgentTaskState }

export function getActiveAgentForInput(appState: AppState): ActiveAgentForInput {
  const viewedTask = getViewedTeammateTask(appState)
  if (viewedTask) return { type: 'viewed', task: viewedTask }
  // Discriminated union for type-safe routing
}
```

### External Metadata Sync

```typescript
// Inverse push/restore for worker restart
export function externalMetadataToAppState(metadata: SessionExternalMetadata): (prev: AppState) => AppState {
  return prev => ({
    ...prev,
    ...(typeof metadata.permission_mode === 'string' ? {
      toolPermissionContext: { ...prev.toolPermissionContext, mode: permissionModeFromString(metadata.permission_mode) }
    } : {}),
  })
}
// Remote state → AppState updater function
// Worker restart restore
```

### useSetAppState (No Subscribe)

```typescript
export function useSetAppState() {
  return useAppStore().setState
}
// Returns stable reference
// Components using only this never re-render
```

### useAppStateMaybeOutsideOfProvider

```typescript
export function useAppStateMaybeOutsideOfProvider<T>(selector): T | undefined {
  const store = useContext(AppStoreContext)
  return useSyncExternalStore(
    store ? store.subscribe : NOOP_SUBSCRIBE,
    () => store ? selector(store.getState()) : undefined
  )
}
// Safe version when AppStateProvider may not be available
```

### DeepImmutable AppState

```typescript
export type AppState = DeepImmutable<{
  settings: SettingsJson
  verbose: boolean
  mainLoopModel: ModelSetting
  // ... all fields deeply immutable
}> & {
  // Excluded from DeepImmutable (function types)
  tasks: { [taskId: string]: TaskState }
  agentNameRegistry: Map<string, AgentId>
}
// DeepImmutable for type safety
// Exceptions for Map/function types
```

### Auth Cache Clear

```typescript
if (newState.settings !== oldState.settings) {
  clearApiKeyHelperCache()
  clearAwsCredentialsCache()
  clearGcpCredentialsCache()
  // Settings change → clear auth caches
}
```

## 实现建议

### OpenClaw适配

1. **zustandStore**: Zustand-style store
2. **onChangeHook**: onChange hook
3. **selectorPattern**: Selector pattern
4. **externalSync**: External metadata sync

### 状态文件示例

```json
{
  "storeType": "zustand",
  "onChangeHook": true,
  "selectorPattern": true,
  "externalSync": true,
  "deepImmutable": true
}
```

## 关键模式

### Zustand Minimal Store

```
getState + setState(updater) + subscribe
// 最小API
// Updater function
```

### Single Choke Point

```
onChange hook → all mutations notify
// 不需要每个callsite单独处理
// 统一sync点
```

### Selector Optimization

```
useSyncExternalStore + selector → only re-render when selected value changes
// 优化渲染
// 不订阅整个state
```

### Discriminated Union

```
type: 'leader' | 'viewed' | 'named_agent' → type-safe routing
// 类型安全
// 编译器检查
```

## 借用价值

- ⭐⭐⭐⭐⭐ Zustand minimal store
- ⭐⭐⭐⭐⭐ onChange single choke point
- ⭐⭐⭐⭐⭐ Selector pattern (useSyncExternalStore)
- ⭐⭐⭐⭐⭐ Discriminated union selector
- ⭐⭐⭐⭐ External metadata sync

## 来源

- Claude Code: `state/AppState.tsx`, `AppStateStore.ts`, `store.ts`, `onChangeAppState.ts`
- 分析报告: P39-1