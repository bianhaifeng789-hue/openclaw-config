# Classifier Denial Tracking Pattern Skill

Classifier Denial Tracking Pattern - DenialTrackingState consecutiveDenials/totalDenials + DENIAL_LIMITS maxConsecutive:3/maxTotal:20 + recordDenial increment + recordSuccess reset consecutive + shouldFallbackToPrompting limits check + consecutive≥3 OR total≥20 fallback + immutable state update + classifier retry budget。

## 功能概述

从Claude Code的utils/permissions/denialTracking.ts提取的Classifier denial tracking模式，用于OpenClaw的分类器拒绝计数。

## 核心机制

### DenialTrackingState consecutiveDenials/totalDenials

```typescript
export type DenialTrackingState = {
  consecutiveDenials: number
  totalDenials: number
}

export function createDenialTrackingState(): DenialTrackingState {
  return {
    consecutiveDenials: 0,
    totalDenials: 0,
  }
}
// DenialTrackingState
# consecutiveDenials: number
# totalDenials: number
# Immutable state
```

### DENIAL_LIMITS maxConsecutive:3/maxTotal:20

```typescript
export const DENIAL_LIMITS = {
  maxConsecutive: 3,
  maxTotal: 20,
} as const
// DENIAL_LIMITS
# maxConsecutive: 3
# maxTotal: 20
# as const
```

### recordDenial increment

```typescript
export function recordDenial(state: DenialTrackingState): DenialTrackingState {
  return {
    ...state,
    consecutiveDenials: state.consecutiveDenials + 1,
    totalDenials: state.totalDenials + 1,
  }
}
// recordDenial
# consecutive + 1
# total + 1
# Immutable update
```

### recordSuccess reset consecutive

```typescript
export function recordSuccess(state: DenialTrackingState): DenialTrackingState {
  if (state.consecutiveDenials === 0) return state // No change needed
  return {
    ...state,
    consecutiveDenials: 0,
  }
}
// recordSuccess
# consecutive = 0
# No change if already 0
# Reset on success
```

### shouldFallbackToPrompting limits check

```typescript
export function shouldFallbackToPrompting(state: DenialTrackingState): boolean {
  return (
    state.consecutiveDenials >= DENIAL_LIMITS.maxConsecutive ||
    state.totalDenials >= DENIAL_LIMITS.maxTotal
  )
}
// shouldFallbackToPrompting
# consecutive >= 3
# total >= 20
# Fallback to ask
```

### consecutive≥3 OR total≥20 fallback

```typescript
// After 3 consecutive denials or 20 total denials
// the classifier has failed too often → fallback to prompting
if (shouldFallbackToPrompting(state)) {
  // Show permission prompt instead of using classifier
}
// consecutive≥3 OR total≥20
# 3 consecutive = classifier failing repeatedly
# 20 total = classifier unreliable overall
# Fallback to prompt user
```

### immutable state update

```typescript
// All functions return new state objects
// Original state is never mutated
return { ...state, consecutiveDenials: state.consecutiveDenials + 1 }
// immutable state update
# Spread + update
# No mutation
# Functional update
```

### classifier retry budget

```typescript
// Budget pattern:
// - 3 consecutive: tight budget - classifier repeatedly failing on similar operations
// - 20 total: loose budget - classifier unreliable over session lifetime
// Budget exhausted → fallback to explicit user prompts
// classifier retry budget
# 3 consecutive = tight
# 20 total = loose
# Budget exhausted → prompt
```

## 实现建议

### OpenClaw适配

1. **denialState**: DenialTrackingState type pattern
2. **limits**: DENIAL_LIMITS constants pattern
3. **recordDenial**: increment counters pattern
4. **recordSuccess**: reset consecutive pattern
5. **fallback**: shouldFallbackToPrompting pattern

### 状态文件示例

```json
{
  "consecutiveDenials": 2,
  "totalDenials": 8,
  "maxConsecutive": 3,
  "maxTotal": 20,
  "shouldFallback": false
}
```

## 关键模式

### Consecutive/Total Dual Counters

```
consecutiveDenials + totalDenials → dual counters → consecutive = tight budget | total = loose budget → dual counters
# consecutive/total dual counters
# consecutive: repeated failures
# total: overall reliability
```

### 3 Consecutive Tight Budget

```
maxConsecutive: 3 → 3 consecutive denials → classifier failing repeatedly → tight budget → fallback
# 3 consecutive tight budget
# repeated failures
# immediate fallback
```

### 20 Total Loose Budget

```
maxTotal: 20 → 20 total denials → classifier unreliable overall → loose budget → fallback
# 20 total loose budget
# session lifetime budget
# overall reliability
```

### recordSuccess No-Change Optimization

```
if (state.consecutiveDenials === 0) return state → no change needed → ref equality preserved → optimization
# recordSuccess no-change optimization
# early return if 0
# preserve ref equality
```

### Immutable Functional Update

```
{ ...state, consecutiveDenials: state.consecutiveDenials + 1 } → spread + update → immutable → functional → no mutation
# immutable functional update
# spread + increment
# return new object
```

## 倉用价值

- ⭐⭐⭐⭐⭐ Consecutive/total dual counters pattern
- ⭐⭐⭐⭐⭐ 3 consecutive tight budget pattern
- ⭐⭐⭐⭐⭐ 20 total loose budget pattern
- ⭐⭐⭐⭐ recordSuccess no-change optimization pattern
- ⭐⭐⭐⭐⭐ Immutable functional update pattern

## 来源

- Claude Code: `utils/permissions/denialTracking.ts` (43 lines)
- 分析报告: P59-8