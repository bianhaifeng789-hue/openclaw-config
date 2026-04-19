# Auto Mode Module-Scope State Skill

Auto Mode Module-Scope State - autoModeActive boolean + autoModeFlagCli boolean + autoModeCircuitBroken boolean + setAutoModeActive/isActive + setAutoModeFlagCli/getFlagCli + setAutoModeCircuitBroken/isCircuitBroken + _resetForTesting test helper + feature('TRANSCRIPT_CLASSIFIER') conditional require + circuit breaker disabled state + kick-out detection。

## 功能概述

从Claude Code的utils/permissions/autoModeState.ts提取的Auto mode module-scope state，用于OpenClaw的auto mode状态管理。

## 核心机制

### autoModeActive boolean

```typescript
let autoModeActive = false
export function setAutoModeActive(active: boolean): void {
  autoModeActive = active
}
export function isAutoModeActive(): boolean {
  return autoModeActive
}
// autoModeActive boolean
# Module-scope state
# set/get functions
# No React state
```

### autoModeFlagCli boolean

```typescript
let autoModeFlagCli = false
export function setAutoModeFlagCli(passed: boolean): void {
  autoModeFlagCli = passed
}
export function getAutoModeFlagCli(): boolean {
  return autoModeFlagCli
}
// autoModeFlagCli boolean
# CLI flag intent
# Captured at startup
# Session-scoped
```

### autoModeCircuitBroken boolean

```typescript
// Set by the async verifyAutoModeGateAccess check when it
// reads a fresh tengu_auto_mode_config.enabled === 'disabled' from GrowthBook.
// Used by isAutoModeGateEnabled() to block SDK/explicit re-entry after kick-out.
let autoModeCircuitBroken = false
export function setAutoModeCircuitBroken(broken: boolean): void {
  autoModeCircuitBroken = broken
}
export function isAutoModeCircuitBroken(): boolean {
  return autoModeCircuitBroken
}
// autoModeCircuitBroken
# Circuit breaker
# Kick-out detection
# GrowthBook disabled state
```

### setAutoModeActive/isActive

```typescript
export function setAutoModeActive(active: boolean): void {
  autoModeActive = active
}
export function isAutoModeActive(): boolean {
  return autoModeActive
}
// setAutoModeActive/isActive
# Module-scope setter
# Getter function
# No React setState
```

### setAutoModeFlagCli/getFlagCli

```typescript
export function setAutoModeFlagCli(passed: boolean): void {
  autoModeFlagCli = passed
}
export function getAutoModeFlagCli(): boolean {
  return autoModeFlagCli
}
// setAutoModeFlagCli/getFlagCli
# CLI flag intent
# Captured from --permission-mode auto
```

### setAutoModeCircuitBroken/isCircuitBroken

```typescript
export function setAutoModeCircuitBroken(broken: boolean): void {
  autoModeCircuitBroken = broken
}
export function isAutoModeCircuitBroken(): boolean {
  return autoModeCircuitBroken
}
// setAutoModeCircuitBroken/isCircuitBroken
# Circuit breaker state
# Kick-out detection
# Block re-entry
```

### _resetForTesting test helper

```typescript
export function _resetForTesting(): void {
  autoModeActive = false
  autoModeFlagCli = false
  autoModeCircuitBroken = false
}
// _resetForTesting
# Reset all state
# Test helper
# Clean slate
```

### feature('TRANSCRIPT_CLASSIFIER') conditional require

```typescript
// Auto mode state functions — lives in its own module so callers can
// conditionally require() it on feature('TRANSCRIPT_CLASSIFIER').
const autoModeStateModule = feature('TRANSCRIPT_CLASSIFIER')
  ? (require('./autoModeState.js') as typeof import('./autoModeState.js'))
  : null
// Conditional require
# feature('TRANSCRIPT_CLASSIFIER')
# Dead code elimination
# External builds: null
```

### circuit breaker disabled state

```typescript
// Circuit breaker (enabled==='disabled') takes effect here.
autoModeStateModule?.setAutoModeCircuitBroken(
  enabledState === 'disabled' || disabledBySettings,
)
// Circuit breaker
# enabled==='disabled'
# Kick-out detection
# Block re-entry
```

### kick-out detection

```typescript
// Unified kick-out transform. Re-checks the FRESH ctx and only fires
// side effects when the kick-out actually applies.
const kickOutOfAutoIfNeeded = (ctx: ToolPermissionContext): ToolPermissionContext => {
  const inAuto = ctx.mode === 'auto'
  if (!inAuto && !inPlanWithAutoActive) {
    return setAvailable(ctx, false)
  }
  if (inAuto) {
    autoModeStateModule?.setAutoModeActive(false)
    setNeedsAutoModeExitAttachment(true)
    return { ...restoreDangerousPermissions(ctx), mode: 'default', isAutoModeAvailable: false }
  }
  // ...
}
// kick-out detection
# Re-check fresh ctx
# Fire side effects
# Deactivate classifier
```

## 实现建议

### OpenClaw适配

1. **moduleScopeState**: let + set/get pattern
2. **circuitBreaker**: autoModeCircuitBroken pattern
3. **cliFlagIntent**: autoModeFlagCli pattern
4. **testReset**: _resetForTesting pattern
5. **conditionalRequire**: feature flag DCE pattern

### 状态文件示例

```json
{
  "autoModeActive": true,
  "autoModeFlagCli": true,
  "autoModeCircuitBroken": false
}
```

## 关键模式

### Module-Scope Boolean State

```
let autoModeActive = false + setAutoModeActive(active: boolean) + isAutoModeActive(): boolean → module-scope state → no React setState
# module-scope boolean state
# let + set/get
# no React setState
```

### Circuit Breaker Kick-Out

```
enabled==='disabled' || disabledBySettings → setAutoModeCircuitBroken(true) → isAutoModeCircuitBroken() → block re-entry → kick-out
# circuit breaker kick-out
# GrowthBook disabled
# block re-entry
```

### CLI Flag Intent Capture

```
--permission-mode auto → autoModeFlagCli = true → getAutoModeFlagCli() → CLI flag intent → session-scoped
# CLI flag intent capture
# session-scoped
# startup capture
```

### _resetForTesting Clean Slate

```
_resetForTesting() → autoModeActive=false + autoModeFlagCli=false + autoModeCircuitBroken=false → test helper → clean slate
# _resetForTesting clean slate
# reset all state
# test helper
```

### Conditional Require DCE

```
feature('TRANSCRIPT_CLASSIFIER') ? require('./autoModeState.js') : null → conditional require → DCE → external builds: null
# conditional require DCE
# feature flag
# dead code elimination
```

## 借用价值

- ⭐⭐⭐⭐⭐ Module-scope boolean state pattern
- ⭐⭐⭐⭐⭐ Circuit breaker kick-out pattern
- ⭐⭐⭐⭐⭐ CLI flag intent capture pattern
- ⭐⭐⭐⭐ _resetForTesting clean slate pattern
- ⭐⭐⭐⭐ Conditional require DCE pattern

## 来源

- Claude Code: `utils/permissions/autoModeState.ts` (42 lines)
- 分析报告: P59-1