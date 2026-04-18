# Spinner Verb Pattern Skill

Spinner Verb Pattern - SpinnerWithVerb + Rules of Hooks split + BriefSpinner + SHIMMER_INTERVAL_MS + computeGlimmerIndex。

## 功能概述

从Claude Code的Spinner.tsx提取的spinner模式，用于OpenClaw的加载指示器。

## 核心机制

### Rules of Hooks Split

```typescript
// Thin wrapper: branches on isBriefOnly so the two variants have independent
// hook call chains. Without this split, toggling /brief mid-render would
// violate Rules of Hooks (the inner variant calls ~10 more hooks).

export function SpinnerWithVerb(props: Props): React.ReactNode {
  const isBriefOnly = useAppState(s => s.isBriefOnly)
  const viewingAgentTaskId = useAppState(s_0 => s_0.viewingAgentTaskId)
  
  // Hoisted to mount-time — this component re-renders at animation framerate
  const briefEnvEnabled = useMemo(() => isEnvTruthy(process.env.CLAUDE_CODE_BRIEF), [])
  
  if (isBriefOnly && !viewingAgentTaskId) {
    return <BriefSpinner mode={props.mode} overrideMessage={props.overrideMessage} />
  }
  return <SpinnerWithVerbInner {...props} />
}
// SpinnerWithVerb + SpinnerWithVerbInner split
// Different hook counts
// BriefSpinner has fewer hooks
```

### BriefSpinner Variant

```typescript
// Brief-only mode: minimal spinner
// Shows brief message only
// No animation framerate hooks
// Separate component for Rules of Hooks
```

### SHIMMER_INTERVAL_MS

```typescript
import { computeGlimmerIndex, computeShimmerSegments, SHIMMER_INTERVAL_MS } from '../bridge/bridgeStatusUtil.js'
// Shimmer animation interval
// Glimmer index computation
// Shimmer segments calculation
```

### animationFrame Re-render

```typescript
// Hoisted to mount-time — this component re-renders at animation framerate
const briefEnvEnabled = useMemo(() => isEnvTruthy(process.env.CLAUDE_CODE_BRIEF), [])
// useMemo for mount-time computation
// Avoid recomputation on animation frames
// Performance optimization
```

### Spinner Verbs

```typescript
import { getSpinnerVerbs } from '../constants/spinnerVerbs.js'
// Spinner verb text variants
// "Thinking", "Analyzing", "Processing", etc.
// Dynamic verb selection
```

### Spinner Frames

```typescript
const DEFAULT_CHARACTERS = getDefaultCharacters()
const SPINNER_FRAMES = [...DEFAULT_CHARACTERS, ...[...DEFAULT_CHARACTERS].reverse()]
// Spinner animation frames
// Forward + reverse for smooth animation
```

## 实现建议

### OpenClaw适配

1. **hooksSplit**: Rules of Hooks split
2. **briefSpinner**: BriefSpinner variant
3. **shimmerInterval**: SHIMMER_INTERVAL_MS
4. **spinnerVerbs**: Spinner verbs

### 状态文件示例

```json
{
  "shimmerIntervalMs": 100,
  "spinnerVerbs": ["Thinking", "Analyzing", "Processing"],
  "isBriefOnly": false
}
```

## 关键模式

### Hook Count Split

```
SpinnerWithVerb (outer) → isBriefOnly check → BriefSpinner (few hooks) or SpinnerWithVerbInner (many hooks)
// Brief mode用BriefSpinner（少hooks）
// 非Brief用Inner（多hooks）
// 防止Rules of Hooks违规
```

### Mount-Time Hoist

```
useMemo(() => isEnvTruthy(...)) → mount-time computation → no recomputation on animation frames
// useMemo hoist
// 避免animation frame时重复计算
```

### Animation Framerate

```
Component re-renders at animation framerate → hooks must be unconditional
// Animation频繁重渲染
// Hooks必须无条件调用
```

### Shimmer Animation

```
SHIMMER_INTERVAL_MS + computeGlimmerIndex + computeShimmerSegments → shimmer effect
// Shimmer动画参数
// Glimmer index + segments
```

## 借用价值

- ⭐⭐⭐⭐⭐ Rules of Hooks split pattern
- ⭐⭐⭐⭐⭐ BriefSpinner variant
- ⭐⭐⭐⭐⭐ Mount-time useMemo hoist
- ⭐⭐⭐⭐ SHIMMER_INTERVAL_MS shimmer
- ⭐⭐⭐⭐ Spinner verbs dynamic

## 来源

- Claude Code: `components/Spinner.tsx`
- 分析报告: P42-3