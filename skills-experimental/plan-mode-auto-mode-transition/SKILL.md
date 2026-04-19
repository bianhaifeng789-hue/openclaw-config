# Plan Mode Auto Mode Transition Skill

Plan Mode Auto Mode Transition - transitionPermissionMode state machine + prepareContextForPlanMode stash prePlanMode + shouldPlanUseAutoMode opt-in + transitionPlanAutoMode mid-plan reconcile + want/have activate/deactivate + prePlanMode restore on exit + bypassPermissions excluded + strippedDangerousRules strip on plan auto + handlePlanModeTransition + handleAutoModeTransition。

## 功能概述

从Claude Code的utils/permissions/permissionSetup.ts提取的Plan mode auto mode transition模式，用于OpenClaw的plan与auto mode切换。

## 核心机制

### transitionPermissionMode state machine

```typescript
export function transitionPermissionMode(
  fromMode: string,
  toMode: string,
  context: ToolPermissionContext,
): ToolPermissionContext {
  // plan→plan (SDK set_permission_mode) would wrongly hit the leave branch below
  if (fromMode === toMode) return context
  
  handlePlanModeTransition(fromMode, toMode)
  handleAutoModeTransition(fromMode, toMode)
  
  if (fromMode === 'plan' && toMode !== 'plan') {
    setHasExitedPlanMode(true)
  }
  
  // ... auto transitions
  return context
}
// transitionPermissionMode
# State machine
# from→to transitions
# Plan/auto handling
```

### prepareContextForPlanMode stash prePlanMode

```typescript
export function prepareContextForPlanMode(context: ToolPermissionContext): ToolPermissionContext {
  const currentMode = context.mode
  if (currentMode === 'plan') return context
  
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    const planAutoMode = shouldPlanUseAutoMode()
    if (currentMode === 'auto') {
      if (planAutoMode) {
        return { ...context, prePlanMode: 'auto' }  // Keep auto active
      }
      setAutoModeActive(false)
      setNeedsAutoModeExitAttachment(true)
      return { ...restoreDangerousPermissions(context), prePlanMode: 'auto' }  // Deactivate but stash
    }
    if (planAutoMode && currentMode !== 'bypassPermissions') {
      setAutoModeActive(true)
      return { ...stripDangerousPermissionsForAutoMode(context), prePlanMode: currentMode }  // Activate and stash
    }
  }
  
  return { ...context, prePlanMode: currentMode }  // Default: stash current
}
// prepareContextForPlanMode
# Stash prePlanMode
# Enter from auto
# Activate/deactivate
```

### shouldPlanUseAutoMode opt-in

```typescript
export function shouldPlanUseAutoMode(): boolean {
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    return (
      hasAutoModeOptIn() &&
      isAutoModeGateEnabled() &&
      getUseAutoModeDuringPlan()
    )
  }
  return false
}
// shouldPlanUseAutoMode
# Opt-in required
# Gate enabled
# settings.useAutoModeDuringPlan
```

### transitionPlanAutoMode mid-plan reconcile

```typescript
/**
 * Reconciles auto-mode state during plan mode after a settings change.
 * Compares desired state (shouldPlanUseAutoMode) against actual state
 * (isAutoModeActive) and activates/deactivates auto accordingly.
 * No-op when not in plan mode. Called from applySettingsChange.
 */
export function transitionPlanAutoMode(context: ToolPermissionContext): ToolPermissionContext {
  if (!feature('TRANSCRIPT_CLASSIFIER')) return context
  if (context.mode !== 'plan') return context
  // Mirror prepareContextForPlanMode's entry-time exclusion — never activate
  // auto mid-plan when the user entered from a dangerous mode.
  if (context.prePlanMode === 'bypassPermissions') return context
  
  const want = shouldPlanUseAutoMode()
  const have = autoModeStateModule?.isAutoModeActive() ?? false
  
  if (want && have) {
    // Re-strip so classifier isn't bypassed by prefix-rule allow matches
    return stripDangerousPermissionsForAutoMode(context)
  }
  if (!want && !have) return context
  
  if (want) {
    autoModeStateModule?.setAutoModeActive(true)
    setNeedsAutoModeExitAttachment(false)
    return stripDangerousPermissionsForAutoMode(context)
  }
  autoModeStateModule?.setAutoModeActive(false)
  setNeedsAutoModeExitAttachment(true)
  return restoreDangerousPermissions(context)
}
// transitionPlanAutoMode
# Mid-plan reconcile
# Settings change trigger
# want vs have
# Activate/deactivate
```

### want/have activate/deactivate

```typescript
const want = shouldPlanUseAutoMode()
const have = autoModeStateModule?.isAutoModeActive() ?? false

if (want && have) return stripDangerousPermissionsForAutoMode(context)  // Already active, re-strip
if (!want && !have) return context  // No change

if (want) {
  setAutoModeActive(true)  // Activate
  return stripDangerousPermissionsForAutoMode(context)
}
setAutoModeActive(false)  // Deactivate
return restoreDangerousPermissions(context)
// want/have
# Desired vs actual
# Activate if want && !have
# Deactivate if !want && have
```

### prePlanMode restore on exit

```typescript
// In transitionPermissionMode when exiting plan
if (fromMode === 'plan' && toMode !== 'plan' && context.prePlanMode) {
  // Only spread if there's something to clear (preserves ref equality)
  return { ...context, prePlanMode: undefined }  // Restore on exit
}
// prePlanMode restore
# Clear on exit
# Restore previous mode
# prePlanMode undefined
```

### bypassPermissions excluded

```typescript
// In prepareContextForPlanMode
if (planAutoMode && currentMode !== 'bypassPermissions') {
  // Never activate auto when entering plan from bypass
  setAutoModeActive(true)
  return { ...stripDangerousPermissionsForAutoMode(context), prePlanMode: currentMode }
}

// In transitionPlanAutoMode
if (context.prePlanMode === 'bypassPermissions') return context  // Never activate mid-plan from bypass
// bypassPermissions excluded
# Dangerous mode
# Never activate auto
# Exclusion
```

### strippedDangerousRules strip on plan auto

```typescript
// In prepareContextForPlanMode when activating auto during plan
return { ...stripDangerousPermissionsForAutoMode(context), prePlanMode: currentMode }

// In transitionPlanAutoMode when want && have
return stripDangerousPermissionsForAutoMode(context)  // Re-strip
// strippedDangerousRules
# Strip on plan auto
# Re-strip on reconcile
# Dangerous rules removed
```

### handlePlanModeTransition

```typescript
handlePlanModeTransition(fromMode, toMode)
// handlePlanModeTransition
# Bootstrap state
# Plan attachments
# Exit/enter handling
```

### handleAutoModeTransition

```typescript
handleAutoModeTransition(fromMode, toMode)
// handleAutoModeTransition
# Bootstrap state
# Auto attachments
# Activation tracking
```

## 实现建议

### OpenClaw适配

1. **modeStateMachine**: transitionPermissionMode pattern
2. **planModePrep**: prepareContextForPlanMode pattern
3. **midPlanReconcile**: transitionPlanAutoMode pattern
4. **wantHaveActivate**: want/have activate/deactivate pattern
5. **prePlanModeStash**: prePlanMode stash/restore pattern

### 状态文件示例

```json
{
  "mode": "plan",
  "prePlanMode": "auto",
  "want": true,
  "have": true,
  "strippedDangerousRules": {"userSettings": ["Bash(npm:*)"]}
}
```

## 关键模式

### State Machine from→to Transitions

```
fromMode === toMode → return | from≠to → handle transitions → strip/restore → state machine → transitionPermissionMode
# state machine from→to transitions
# from === to → return
# handle transitions
```

### prePlanMode Stash on Enter

```
prepareContextForPlanMode → prePlanMode = currentMode → stash previous → restore on exit → prePlanMode stash on enter
# prePlanMode stash on enter
# stash previous mode
# restore on exit
```

### want/have Reconcile Mid-Plan

```
want = shouldPlanUseAutoMode() | have = isAutoModeActive() → want && !have → activate | !want && have → deactivate → want/have reconcile
# want/have reconcile mid-plan
# activate if want && !have
# deactivate if !want && have
```

### bypassPermissions Never Activate Auto

```
prePlanMode === 'bypassPermissions' → excluded → never activate auto → dangerous mode exclusion → bypassPermissions never activate
# bypassPermissions never activate auto
# dangerous mode exclusion
# never activate from bypass
```

### Re-strip on want && have

```
want && have → stripDangerousPermissionsForAutoMode(context) → re-strip → prefix-rule allow matches bypassed → re-strip on want && have
# re-strip on want && have
# already active
# re-strip dangerous
```

## 借用价值

- ⭐⭐⭐⭐⭐ State machine from→to transitions pattern
- ⭐⭐⭐⭐⭐ prePlanMode stash on enter pattern
- ⭐⭐⭐⭐⭐ want/have reconcile mid-plan pattern
- ⭐⭐⭐⭐⭐ bypassPermissions never activate auto pattern
- ⭐⭐⭐⭐⭐ Re-strip on want && have pattern

## 来源

- Claude Code: `utils/permissions/permissionSetup.ts` (771 lines)
- 分析报告: P59-6