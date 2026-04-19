# Run-Once Gate Check Hook Pattern Skill

Run-Once Gate Check Hook Pattern - bypassPermissionsCheckRan/autoModeCheckRan flags + checkAndDisableBypassPermissionsIfNeeded async gate + useKickOffCheckAndDisable useEffect run-once + reset after /login pattern + mid-turn outrun stale context apply transform to CURRENT + notification queue high priority warning + fastMode/model dependency re-trigger。

## 功能概述

从Claude Code的utils/permissions/bypassPermissionsKillswitch.ts提取的Run-once gate check hook模式，用于OpenClaw的权限门控检查。

## 核心机制

### bypassPermissionsCheckRan/autoModeCheckRan flags

```typescript
let bypassPermissionsCheckRan = false
let autoModeCheckRan = false

export async function checkAndDisableBypassPermissionsIfNeeded(...): Promise<void> {
  if (bypassPermissionsCheckRan) return
  bypassPermissionsCheckRan = true
  // ...
}
// run-once flags
# Module-scope boolean
# Prevent duplicate checks
# Reset after /login
```

### checkAndDisableBypassPermissionsIfNeeded async gate

```typescript
export async function checkAndDisableBypassPermissionsIfNeeded(
  toolPermissionContext: ToolPermissionContext,
  setAppState: (f: (prev: AppState) => AppState) => void,
): Promise<void> {
  if (bypassPermissionsCheckRan) return
  bypassPermissionsCheckRan = true
  
  if (!toolPermissionContext.isBypassPermissionsModeAvailable) return
  
  const shouldDisable = await shouldDisableBypassPermissions()
  if (!shouldDisable) return
  
  setAppState(prev => ({
    ...prev,
    toolPermissionContext: createDisabledBypassPermissionsContext(prev.toolPermissionContext),
  }))
}
// async gate check
# Statsig gate read
# Disable bypassPermissions
# Update AppState
```

### useKickOffCheckAndDisable useEffect run-once

```typescript
export function useKickOffCheckAndDisableBypassPermissionsIfNeeded(): void {
  const toolPermissionContext = useAppState(s => s.toolPermissionContext)
  const setAppState = useSetAppState()
  
  useEffect(() => {
    if (getIsRemoteMode()) return
    void checkAndDisableBypassPermissionsIfNeeded(toolPermissionContext, setAppState)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
// useEffect run-once
# Mount trigger
# Empty deps array
# Kick off async check
```

### reset after /login pattern

```typescript
/**
 * Reset the run-once flag for checkAndDisableBypassPermissionsIfNeeded.
 * Call this after /login so the gate check re-runs with the new org.
 */
export function resetBypassPermissionsCheck(): void {
  bypassPermissionsCheckRan = false
}

export function resetAutoModeGateCheck(): void {
  autoModeCheckRan = false
}
// reset after /login
# Clear run-once flag
# Re-run gate check
# New org context
```

### mid-turn outrun stale context apply transform to CURRENT

```typescript
export async function checkAndDisableAutoModeIfNeeded(...): Promise<void> {
  const { updateContext, notification } = await verifyAutoModeGateAccess(...)
  
  setAppState(prev => {
    // Apply the transform to CURRENT context, not the stale snapshot we
    // passed to verifyAutoModeGateAccess. The async GrowthBook await inside
    // can be outrun by a mid-turn shift-tab; spreading a stale context here
    // would revert the user's mode change.
    const nextCtx = updateContext(prev.toolPermissionContext)
    // ...
  })
}
// mid-turn outrun stale context
# Apply transform to CURRENT
# Not stale snapshot
# Async outrun shift-tab
```

### notification queue high priority warning

```typescript
setAppState(prev => {
  const newState = { ...prev, toolPermissionContext: nextCtx }
  if (!notification) return newState
  return {
    ...newState,
    notifications: {
      ...newState.notifications,
      queue: [
        ...newState.notifications.queue,
        {
          key: 'auto-mode-gate-notification',
          text: notification,
          color: 'warning' as const,
          priority: 'high' as const,
        },
      ],
    },
  }
})
// notification queue
# high priority warning
# color: 'warning'
# push to queue
```

### fastMode/model dependency re-trigger

```typescript
export function useKickOffCheckAndDisableAutoModeIfNeeded(): void {
  const mainLoopModel = useAppState(s => s.mainLoopModel)
  const mainLoopModelForSession = useAppState(s => s.mainLoopModelForSession)
  const fastMode = useAppState(s => s.fastMode)
  const setAppState = useSetAppState()
  const store = useAppStateStore()
  const isFirstRunRef = useRef(true)
  
  useEffect(() => {
    if (getIsRemoteMode()) return
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
    } else {
      resetAutoModeGateCheck()
    }
    void checkAndDisableAutoModeIfNeeded(
      store.getState().toolPermissionContext,
      setAppState,
      fastMode,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mainLoopModel, mainLoopModelForSession, fastMode])
}
// fastMode/model dependency
# useEffect deps
# Re-trigger on change
# Reset + re-check
```

## 实现建议

### OpenClaw适配

1. **runOnceFlag**: let flag + return early pattern
2. **asyncGateCheck**: Statsig/GrowthBook gate check pattern
3. **useKickOffHook**: useEffect run-once pattern
4. **resetAfterLogin**: reset flag after auth change pattern
5. **transformToCurrent**: prev.toolPermissionContext pattern

### 状态文件示例

```json
{
  "checkRan": true,
  "isRemoteMode": false,
  "dependency": ["mainLoopModel", "fastMode"]
}
```

## 关键模式

### Module-Scope Run-Once Flag

```
let checkRan = false → if (checkRan) return → checkRan = true → run-once → reset after /login
# module-scope run-once flag
# let flag + early return
# reset after auth change
```

### useEffect Empty Deps Run-Once

```
useEffect(() => { void check(...) }, []) → mount trigger → empty deps → run-once → kick off
# useEffect empty deps run-once
# mount trigger only
# kick off async check
```

### Reset Flag After /login

```
resetBypassPermissionsCheck() → checkRan = false → after /login → new org → re-run gate check
# reset flag after /login
# clear run-once flag
# re-run with new context
```

### Transform Apply to CURRENT Context

```
updateContext(prev.toolPermissionContext) → apply to CURRENT → not stale snapshot → outrun mid-turn shift-tab
# transform apply to CURRENT context
# prev.toolPermissionContext
# outrun async race
```

### Dependency Array Re-Trigger

```
useEffect(..., [mainLoopModel, fastMode]) → model/fast change → reset + re-check → kick-out/carousel-restore
# dependency array re-trigger
# reset flag on change
# re-run gate check
```

## 借用价值

- ⭐⭐⭐⭐⭐ Module-scope run-once flag pattern
- ⭐⭐⭐⭐⭐ useEffect empty deps run-once pattern
- ⭐⭐⭐⭐⭐ Reset flag after /login pattern
- ⭐⭐⭐⭐⭐ Transform apply to CURRENT context pattern
- ⭐⭐⭐⭐⭐ Dependency array re-trigger pattern

## 来源

- Claude Code: `utils/permissions/bypassPermissionsKillswitch.ts` (118 lines)
- 分析报告: P59-7