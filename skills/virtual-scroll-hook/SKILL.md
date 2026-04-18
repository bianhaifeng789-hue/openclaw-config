# Virtual Scroll Hook Skill

Virtual Scroll Hook - Scroll quantization + Yoga layout offset + Overscan rows + Slide step bound。

## 功能概述

从Claude Code的useVirtualScroll hook提取的虚拟滚动模式，用于OpenClaw的大列表渲染。

## 核心机制

### Scroll Quantization

```typescript
const SCROLL_QUANTUM = OVERSCAN_ROWS >> 1  // 40 rows
// scrollTop quantization for useSyncExternalStore snapshot
// Every wheel tick (3-5 per notch) triggers React commit + Yoga calculateLayout
// Visual scroll stays smooth: ScrollBox.forceRender fires on every scrollBy
// React only re-renders when mounted range must shift
// 减少React commit频率
// 40-row bin
```

### Yoga Layout Offset

```typescript
offsets[i] = rows above item i; offsets[n] = totalHeight
getItemTop(index) → Yoga computedTop for item
// Yoga layout is scroll-independent (translation happens later)
// Positions stay valid across scrolls without waiting for Ink re-render
// Yoga computedTop
// 不依赖scroll
```

### Overscan Rows

```typescript
const OVERSCAN_ROWS = 80
const DEFAULT_ESTIMATE = 3
// Generous because real heights can be 10x the estimate
// Overestimating causes blank space, underestimating mounts extra items
// Intentionally LOW estimate
// 防止blank space
```

### Cold Start Count

```typescript
const COLD_START_COUNT = 30
// Items rendered before ScrollBox has laid out (viewportHeight=0)
// 初始渲染数量
// viewportHeight未知时
```

### Pessimistic Height

```typescript
const PESSIMISTIC_HEIGHT = 1
// Worst-case height for unmeasured items
// MessageRow can be as small as 1 row
// Guarantees mounted span reaches viewport bottom
// 保守估计
// 防止空白
```

### Max Mounted Items

```typescript
const MAX_MOUNTED_ITEMS = 300
const SLIDE_STEP = 25
// Cap on mounted items to bound fiber allocation
// Max NEW items to mount in a single commit
// Each fresh MessageRow render costs ~1.5ms
// 194 items = ~290ms sync block
// Slide toward target over multiple commits
// 防止一次性mount过多
// 分批mount
```

### Spacer Ref Drift-Free

```typescript
// Attach to topSpacer Box. Its Yoga computedTop IS listOrigin
// Drift-free: no subtraction of offsets, no dependence on item heights
// spacerRef → Yoga computedTop
// 无drift
// 直接读取
```

### Measure Ref Factory

```typescript
measureRef: (key: string) => (el: DOMElement | null) => void
// Callback ref factory. Attach to each rendered item's root Box
// After Yoga layout, computed height is cached
// 每个item的height cache
// Yoga layout后记录
```

## 实现建议

### OpenClaw适配

1. **scrollQuantum**: Scroll quantization
2. **yogaOffset**: Yoga layout offset
3. **overscanRows**: Overscan rows
4. **slideStep**: Slide step bound

### 状态文件示例

```json
{
  "scrollQuantum": 40,
  "overscanRows": 80,
  "coldStartCount": 30,
  "maxMountedItems": 300,
  "slideStep": 25
}
```

## 关键模式

### Scroll Quantization

```
SCROLL_QUANTUM = overscan/2 → React commit只在range shift时
// 减少CPU spike
// 视觉滚动smooth
```

### Yoga ComputedTop

```
getItemTop(index) → Yoga computedTop → 不依赖React re-render
// 实时position
// 不等待layout
```

### Intentionally Low Estimate

```
DEFAULT_ESTIMATE = 3 → underestimating mounts extra (safe), overestimating causes blank (bad)
// 宁可多mount
// 不出现空白
```

### Slide Step Bound

```
SLIDE_STEP = 25 → 分批mount → 每commit bounded cost
// 防止一次性mount 194 items (290ms block)
// 渐进式range shift
```

## 借用价值

- ⭐⭐⭐⭐⭐ Scroll quantization (40-row bin)
- ⭐⭐⭐⭐⭐ Yoga computedTop (scroll-independent)
- ⭐⭐⭐⭐⭐ Intentionally low estimate
- ⭐⭐⭐⭐⭐ Slide step bound (25)
- ⭐⭐⭐⭐ Spacer ref drift-free

## 来源

- Claude Code: `hooks/useVirtualScroll.ts`
- 分析报告: P39-9