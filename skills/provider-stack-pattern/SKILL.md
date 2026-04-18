# Provider Stack Pattern Skill

Provider Stack Pattern - 三层嵌套Provider + React Compiler Runtime缓存 + onChangeAppState单一入口。

## 功能概述

从Claude Code的App.tsx提取的Provider嵌套模式，用于OpenClaw的应用架构。

## 核心机制

### 三层Provider嵌套

```typescript
export function App({ getFpsMetrics, stats, initialState, children }: Props) {
  return (
    <FpsMetricsProvider getFpsMetrics={getFpsMetrics}>
      <StatsProvider store={stats}>
        <AppStateProvider initialState={initialState} onChangeAppState={onChangeAppState}>
          {children}
        </AppStateProvider>
      </StatsProvider>
    </FpsMetricsProvider>
  )
}
// FpsMetricsProvider (outer) → StatsProvider (middle) → AppStateProvider (inner)
// Nested context providers
// Each layer adds specific context
```

### React Compiler Runtime

```typescript
const $ = _c(9)  // 9 cache slots

// Cache check pattern
let t1
if ($[0] !== children || $[1] !== initialState) {
  t1 = <AppStateProvider ...>{children}</AppStateProvider>
  $[0] = children
  $[1] = initialState
  $[2] = t1
} else {
  t1 = $[2]
}
// React Compiler automatic memoization
// Cache slots for each conditional
// Symbol.for("react.memo_cache_sentinel") for static values
```

### onChangeAppState Single Entry

```typescript
<AppStateProvider initialState={initialState} onChangeAppState={onChangeAppState}>
// Single onChange hook
// All setAppState calls funnel here
// External metadata sync
```

### FPS Metrics Context

```typescript
type FpsMetrics = {
  fps: number
  frameTime: number
  droppedFrames: number
}

<FpsMetricsProvider getFpsMetrics={getFpsMetrics}>
// Dynamic FPS metrics
// Performance monitoring
// getFpsMetrics callback
```

### Stats Store Context

```typescript
type StatsStore = {
  usage: UsageStats
  costs: CostStats
}

<StatsProvider store={stats}>
// Usage/cost tracking
// Optional store
// Shared across components
```

## 实现建议

### OpenClaw适配

1. **providerStack**: Provider嵌套
2. **compilerRuntime**: React Compiler缓存
3. **onChangeSingle**: onChangeAppState单一入口

### 状态文件示例

```json
{
  "providerStack": ["FpsMetrics", "Stats", "AppState"],
  "cacheSlots": 9,
  "onChangeSingle": true
}
```

## 关键模式

### Provider Order

```
FpsMetrics (outer) → Stats → AppState (inner)
// 从外到内嵌套
// 每层添加特定context
```

### Compiler Cache Check

```
$[n] !== dep → compute → cache, else → reuse
// 条件缓存检查
// 避免重复计算
```

### Static Value Sentinel

```
Symbol.for("react.memo_cache_sentinel") → static, no deps
// 静态值标记
// 无依赖缓存
```

### onChange Funnel

```
setAppState() → onChangeAppState() → external sync
// 所有调用汇聚到单一onChange
// 外部metadata同步
```

## 借用价值

- ⭐⭐⭐⭐⭐ Provider stack pattern
- ⭐⭐⭐⭐⭐ React Compiler Runtime caching
- ⭐⭐⭐⭐ onChangeAppState single entry
- ⭐⭐⭐⭐ FPS metrics context
- ⭐⭐⭐ Stats store context

## 来源

- Claude Code: `components/App.tsx`
- 分析报告: P41-1