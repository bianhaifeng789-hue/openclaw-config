# Shift-Tab Cycle Permission Mode Skill

Shift-Tab Cycle Permission Mode - getNextPermissionMode cycle logic + canCycleToAuto cached+live gate check + Ant skip acceptEdits/plan + USER_TYPE==='ant' conditional path + cyclePermissionMode transition + transitionPermissionMode cleanup + dontAsk excluded + bypassPermissions→auto→default + default→acceptEdits→plan→bypassPermissions→auto→default chain。

## 功能概述

从Claude Code的utils/permissions/getNextPermissionMode.ts提取的Shift-Tab cycle permission mode模式，用于OpenClaw的权限模式循环切换。

## 核心机制

### getNextPermissionMode cycle logic

```typescript
export function getNextPermissionMode(
  toolPermissionContext: ToolPermissionContext,
  _teamContext?: { leadAgentId: string },
): PermissionMode {
  switch (toolPermissionContext.mode) {
    case 'default':
      if (process.env.USER_TYPE === 'ant') {
        if (toolPermissionContext.isBypassPermissionsModeAvailable) return 'bypassPermissions'
        if (canCycleToAuto(toolPermissionContext)) return 'auto'
        return 'default'
      }
      return 'acceptEdits'

    case 'acceptEdits':
      return 'plan'

    case 'plan':
      if (toolPermissionContext.isBypassPermissionsModeAvailable) return 'bypassPermissions'
      if (canCycleToAuto(toolPermissionContext)) return 'auto'
      return 'default'

    case 'bypassPermissions':
      if (canCycleToAuto(toolPermissionContext)) return 'auto'
      return 'default'

    case 'dontAsk':
      return 'default'

    case 'auto':
      return 'default'

    default:
      return 'default'
  }
}
// getNextPermissionMode
# switch on current mode
# Return next mode
# Cycle chain
```

### canCycleToAuto cached+live gate check

```typescript
function canCycleToAuto(ctx: ToolPermissionContext): boolean {
  if (feature('TRANSCRIPT_CLASSIFIER')) {
    const gateEnabled = isAutoModeGateEnabled()
    const can = !!ctx.isAutoModeAvailable && gateEnabled
    if (!can) {
      logForDebugging(
        `[auto-mode] canCycleToAuto=false: ctx.isAutoModeAvailable=${ctx.isAutoModeAvailable} isAutoModeGateEnabled=${gateEnabled}`,
      )
    }
    return can
  }
  return false
}
// canCycleToAuto
# cached: ctx.isAutoModeAvailable
# live: isAutoModeGateEnabled()
# Both must be true
# Debug logging
```

### Ant skip acceptEdits/plan

```typescript
case 'default':
  // Ants skip acceptEdits and plan — auto mode replaces them
  if (process.env.USER_TYPE === 'ant') {
    if (toolPermissionContext.isBypassPermissionsModeAvailable) return 'bypassPermissions'
    if (canCycleToAuto(toolPermissionContext)) return 'auto'
    return 'default'  // Stay in default if no bypass/auto
  }
  return 'acceptEdits'  // External users: default → acceptEdits
// Ant skip acceptEdits/plan
# USER_TYPE === 'ant'
# auto mode replaces acceptEdits/plan
# Different cycle chain
```

### USER_TYPE==='ant' conditional path

```typescript
// Ant cycle: default → bypassPermissions → auto → default
// External cycle: default → acceptEdits → plan → bypassPermissions → auto → default

if (process.env.USER_TYPE === 'ant') {
  // Ant-specific cycle
} else {
  // External user cycle
}
// USER_TYPE==='ant' conditional path
# Different cycle chains
# Ant: shorter cycle
# External: full cycle
```

### cyclePermissionMode transition

```typescript
export function cyclePermissionMode(
  toolPermissionContext: ToolPermissionContext,
  teamContext?: { leadAgentId: string },
): { nextMode: PermissionMode; context: ToolPermissionContext } {
  const nextMode = getNextPermissionMode(toolPermissionContext, teamContext)
  return {
    nextMode,
    context: transitionPermissionMode(
      toolPermissionContext.mode,
      nextMode,
      toolPermissionContext,
    ),
  }
}
// cyclePermissionMode
# Get next mode
# Apply transition
# Return new context
```

### transitionPermissionMode cleanup

```typescript
// transitionPermissionMode handles:
// - Strip dangerous permissions when entering auto
// - Restore dangerous permissions when exiting auto
// - Set/clear autoModeActive flag
// - Set/clear prePlanMode stash
// - Update bypassPermissions available state
// transitionPermissionMode cleanup
# Strip/restore dangerous
# Update state flags
# Stash previous mode
```

### dontAsk excluded

```typescript
case 'dontAsk':
  // Not exposed in UI cycle yet, but return default if somehow reached
  return 'default'
// dontAsk excluded
# Not in cycle chain
# Fallback to default
```

### bypassPermissions→auto→default

```typescript
case 'bypassPermissions':
  if (canCycleToAuto(toolPermissionContext)) return 'auto'
  return 'default'

case 'auto':
  return 'default'
// bypassPermissions→auto→default
# bypassPermissions can go to auto
# auto always goes to default
```

### default→acceptEdits→plan→bypassPermissions→auto→default chain

```typescript
// External user cycle chain:
default → acceptEdits → plan → bypassPermissions → auto → default

// Ant cycle chain:
default → bypassPermissions → auto → default

// Cycle chain
# External: 6 modes
# Ant: 3 modes
# Shift+Tab cycles
```

## 实现建议

### OpenClaw适配

1. **modeCycle**: getNextPermissionMode switch pattern
2. **doubleGate**: cached + live gate check pattern
3. **antPath**: USER_TYPE conditional path pattern
4. **cycleTransition**: cyclePermissionMode pattern
5. **chainLogic**: mode→next mapping pattern

### 状态文件示例

```json
{
  "mode": "default",
  "nextMode": "acceptEdits",
  "isAutoModeAvailable": true,
  "isBypassPermissionsModeAvailable": true,
  "USER_TYPE": "external"
}
```

## 关键模式

### Cached + Live Double Gate Check

```
ctx.isAutoModeAvailable + isAutoModeGateEnabled() → cached + live → both true → canCycleToAuto → double gate
# cached + live double gate check
# cached from startup
# live from current state
```

### Ant Skip acceptEdits/Plan

```
USER_TYPE === 'ant' → skip acceptEdits/plan → auto replaces them → default → bypassPermissions → auto → default
# Ant skip acceptEdits/plan
# shorter cycle chain
# auto replaces intermediate modes
```

### USER_TYPE Conditional Cycle Path

```
USER_TYPE === 'ant' ? ant cycle : external cycle → conditional path → different chains → feature branching
# USER_TYPE conditional cycle path
# different cycle chains
# feature branching
```

### Switch on Current Mode Return Next

```
switch (mode) { case 'default': return nextMode } → current → next → mapping → cycle chain
# switch on current mode return next
# mode → nextMode mapping
```

### transitionPermissionMode Cleanup

```
transitionPermissionMode(from, to, ctx) → strip dangerous | restore dangerous | update flags → cleanup → context change
# transitionPermissionMode cleanup
# strip/restore dangerous
# update state flags
```

## 借用价值

- ⭐⭐⭐⭐⭐ Cached + live double gate check pattern
- ⭐⭐⭐⭐⭐ Ant skip acceptEdits/plan pattern
- ⭐⭐⭐⭐⭐ USER_TYPE conditional cycle path pattern
- ⭐⭐⭐⭐⭐ Switch on current mode return next pattern
- ⭐⭐⭐⭐⭐ transitionPermissionMode cleanup pattern

## 来源

- Claude Code: `utils/permissions/getNextPermissionMode.ts` (76 lines)
- 分析报告: P59-9