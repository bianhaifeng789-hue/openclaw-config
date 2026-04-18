# Auto Mode Circuit Breaker Pattern Skill

Auto Mode Circuit Breaker Pattern - verifyAutoModeGateAccess async check + getDynamicConfig_BLOCKS_ON_INIT enabled/disabled/opt-in + setAutoModeCircuitBroken kick-out + isAutoModeGateEnabled sync check + getAutoModeEnabledStateIfCached cold start + kickOutOfAutoIfNeeded transform function + carouselAvailable vs canEnterAuto + hasAutoModeOptInAnySource + modelSupportsAutoMode + disableFastMode breaker。

## 功能概述

从Claude Code的utils/permissions/permissionSetup.ts提取的Auto mode circuit breaker模式，用于OpenClaw的auto mode门控管理。

## 核心机制

### verifyAutoModeGateAccess async check

```typescript
export async function verifyAutoModeGateAccess(
  currentContext: ToolPermissionContext,
  fastMode?: boolean,
): Promise<AutoModeGateCheckResult> {
  // Fresh read of tengu_auto_mode_config.enabled — this async check runs once
  // after GrowthBook initialization and is the authoritative source
  const autoModeConfig = await getDynamicConfig_BLOCKS_ON_INIT<{
    enabled?: AutoModeEnabledState
    disableFastMode?: boolean
  }>('tengu_auto_mode_config', {})
  
  const enabledState = parseAutoModeEnabledState(autoModeConfig?.enabled)
  // ...
}
// verifyAutoModeGateAccess
# Async check
# GrowthBook fresh read
# Authoritative source
```

### getDynamicConfig_BLOCKS_ON_INIT enabled/disabled/opt-in

```typescript
const autoModeConfig = await getDynamicConfig_BLOCKS_ON_INIT<{
  enabled?: AutoModeEnabledState
  disableFastMode?: boolean
}>('tengu_auto_mode_config', {})

// AutoModeEnabledState: 'enabled' | 'disabled' | 'opt-in'
// 'enabled': available in carousel
// 'disabled': circuit breaker, fully unavailable
// 'opt-in': available only if user opted in
// getDynamicConfig_BLOCKS_ON_INIT
# enabled/disabled/opt-in
# Circuit breaker: 'disabled'
# Opt-in required
```

### setAutoModeCircuitBroken kick-out

```typescript
// Circuit breaker (enabled==='disabled') takes effect here.
autoModeStateModule?.setAutoModeCircuitBroken(
  enabledState === 'disabled' || disabledBySettings,
)
// setAutoModeCircuitBroken
# enabled==='disabled' → true
# disabledBySettings → true
# Kick-out detection
```

### isAutoModeGateEnabled sync check

```typescript
export function isAutoModeGateEnabled(): boolean {
  if (autoModeStateModule?.isAutoModeCircuitBroken() ?? false) return false
  if (isAutoModeDisabledBySettings()) return false
  if (!modelSupportsAutoMode(getMainLoopModel())) return false
  return true
}
// isAutoModeGateEnabled
# Sync check
# Circuit breaker
# Settings disable
# Model support
```

### getAutoModeEnabledStateIfCached cold start

```typescript
/**
 * Like getAutoModeEnabledState but returns undefined when no cached value
 * exists (cold start, before GrowthBook init). Used by the sync
 * circuit-breaker check in initialPermissionModeFromCLI, which must not
 * conflate "not yet fetched" with "fetched and disabled" — the former
 * defers to verifyAutoModeGateAccess, the latter blocks immediately.
 */
export function getAutoModeEnabledStateIfCached(): AutoModeEnabledState | undefined {
  const config = getFeatureValue_CACHED_MAY_BE_STALE<
    { enabled?: AutoModeEnabledState } | typeof NO_CACHED_AUTO_MODE_CONFIG
  >('tengu_auto_mode_config', NO_CACHED_AUTO_MODE_CONFIG)
  if (config === NO_CACHED_AUTO_MODE_CONFIG) return undefined
  return parseAutoModeEnabledState(config?.enabled)
}
// getAutoModeEnabledStateIfCached
# undefined on cold start
# Not conflated with 'disabled'
# defer to async check
```

### kickOutOfAutoIfNeeded transform function

```typescript
/**
 * Unified kick-out transform. Re-checks the FRESH ctx and only fires
 * side effects when the kick-out actually applies.
 */
const kickOutOfAutoIfNeeded = (ctx: ToolPermissionContext): ToolPermissionContext => {
  const inAuto = ctx.mode === 'auto'
  if (!inAuto && !inPlanWithAutoActive) {
    return setAvailable(ctx, false)
  }
  if (inAuto) {
    autoModeStateModule?.setAutoModeActive(false)
    setNeedsAutoModeExitAttachment(true)
    return {
      ...applyPermissionUpdate(restoreDangerousPermissions(ctx), {
        type: 'setMode',
        mode: 'default',
        destination: 'session',
      }),
      isAutoModeAvailable: false,
    }
  }
  // ...
}
// kickOutOfAutoIfNeeded
# Transform function
# Re-check fresh ctx
# Fire side effects
```

### carouselAvailable vs canEnterAuto

```typescript
// Carousel availability: not circuit-broken, not disabled-by-settings,
// model supports it, disableFastMode breaker not firing, and (enabled or opted-in)
let carouselAvailable = false
if (enabledState !== 'disabled' && !disabledBySettings && modelSupported) {
  carouselAvailable = enabledState === 'enabled' || hasAutoModeOptInAnySource()
}

// canEnterAuto gates explicit entry (--permission-mode auto, defaultMode: auto)
// — explicit entry IS an opt-in, so we only block on circuit breaker + settings + model
const canEnterAuto = enabledState !== 'disabled' && !disabledBySettings && modelSupported
// carouselAvailable vs canEnterAuto
# Carousel: enabled OR opt-in
# Explicit entry: always opt-in
# Circuit breaker blocks both
```

### hasAutoModeOptInAnySource

```typescript
export function hasAutoModeOptInAnySource(): boolean {
  if (autoModeStateModule?.getAutoModeFlagCli() ?? false) return true
  return hasAutoModeOptIn()
}
// hasAutoModeOptInAnySource
# CLI flag --enable-auto-mode
# Settings skipAutoPermissionPrompt
# Any source opt-in
```

### modelSupportsAutoModel

```typescript
const mainModel = getMainLoopModel()
const modelSupported = modelSupportsAutoMode(mainModel) && !disableFastModeBreakerFires
// modelSupportsAutoMode
# Model capability check
# disableFastMode breaker
# -fast model substring
```

### disableFastMode breaker

```typescript
// Temp circuit breaker: tengu_auto_mode_config.disableFastMode blocks auto
// mode when fast mode is on. Checks runtime AppState.fastMode (if provided)
// and, for ants, model name '-fast' substring (ant-internal fast models
// like capybara-v2-fast[1m] encode speed in the model ID itself).
const disableFastModeBreakerFires =
  !!autoModeConfig?.disableFastMode &&
  (!!fastMode ||
    (process.env.USER_TYPE === 'ant' &&
      mainModel.toLowerCase().includes('-fast')))
// disableFastMode breaker
# autoConfig.disableFastMode
# AppState.fastMode
# -fast model substring
```

## 实现建议

### OpenClaw适配

1. **asyncGateCheck**: verifyAutoModeGateAccess pattern
2. **circuitBreaker**: enabled==='disabled' pattern
3. **syncGateCheck**: isAutoModeGateEnabled pattern
4. **coldStartUndefined**: getAutoModeEnabledStateIfCached pattern
5. **transformFunction**: kickOutOfAutoIfNeeded pattern

### 状态文件示例

```json
{
  "enabledState": "disabled",
  "circuitBroken": true,
  "canEnterAuto": false,
  "carouselAvailable": false
}
```

## 关键模式

### Async Gate Check Blocks on Init

```
getDynamicConfig_BLOCKS_ON_INIT('tengu_auto_mode_config') → await → fresh read → authoritative → async gate check
# async gate check blocks on init
# fresh read
# authoritative source
```

### enabled/disabled/opt-in Three States

```
'enabled' → carousel available | 'disabled' → circuit breaker | 'opt-in' → opt-in required → three states → enabled/disabled/opt-in
# enabled/disabled/opt-in three states
# 'enabled': carousel
# 'disabled': circuit breaker
# 'opt-in': opt-in required
```

### Circuit Breaker Kick-Out Block Re-Entry

```
enabled==='disabled' || disabledBySettings → setAutoModeCircuitBroken(true) → isAutoModeCircuitBroken() → block re-entry → kick-out
# circuit breaker kick-out block re-entry
# enabled==='disabled'
# block re-entry
```

### Sync Gate Check Multiple Conditions

```
isAutoModeCircuitBroken() || disabledBySettings || !modelSupportsAutoMode → false → sync gate check → multiple conditions
# sync gate check multiple conditions
# circuit breaker
# settings disable
# model support
```

### Cold Start undefined Not Conflated

```
NO_CACHED_AUTO_MODE_CONFIG → undefined → not conflated with 'disabled' → defer to async check → cold start undefined
# cold start undefined not conflated
# undefined ≠ disabled
# defer to async check
```

### Transform Function Re-Check Fresh ctx

```
kickOutOfAutoIfNeeded(ctx) → transform function → re-check fresh ctx → fire side effects → ctx.mode === 'auto' → kick-out
# transform function re-check fresh ctx
# transform function
# re-check ctx
# fire side effects
```

## 借用价值

- ⭐⭐⭐⭐⭐ Async gate check blocks on init pattern
- ⭐⭐⭐⭐⭐ enabled/disabled/opt-in three states pattern
- ⭐⭐⭐⭐⭐ Circuit breaker kick-out block re-entry pattern
- ⭐⭐⭐⭐⭐ Sync gate check multiple conditions pattern
- ⭐⭐⭐⭐⭐ Cold start undefined not conflated pattern
- ⭐⭐⭐⭐⭐ Transform function re-check fresh ctx pattern

## 来源

- Claude Code: `utils/permissions/permissionSetup.ts` (771 lines)
- 分析报告: P59-5