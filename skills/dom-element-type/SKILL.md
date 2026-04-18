# DOM Element Type Skill

DOM Element Type - DOMElement comprehensive type + Scroll State + Event Handlers + dirty flag + yogaNode LayoutNode + scrollTop/pendingScrollDelta + scrollClamp pattern。

## 功能概述

从Claude Code的ink/dom.ts提取的DOM元素类型定义，用于OpenClaw的终端UI渲染。

## 核心机制

### DOMElement Type

```typescript
export type DOMElement = {
  nodeName: ElementNames
  attributes: Record<string, DOMNodeAttribute>
  childNodes: DOMNode[]
  textStyles?: TextStyles

  // Internal properties
  onComputeLayout?: () => void
  onRender?: () => void
  onImmediateRender?: () => void
  hasRenderedContent?: boolean  // Skip empty renders in React 19 double-invoke

  // When true, this node needs re-rendering
  dirty: boolean
  // Set by reconciler's hideInstance/unhideInstance; survives style updates
  isHidden?: boolean
  // Event handlers stored separately from attributes
  // Handler identity changes don't mark dirty
  _eventHandlers?: Record<string, unknown>

  // Scroll state for overflow: 'scroll' boxes
  scrollTop?: number
  pendingScrollDelta?: number  // Accumulated delta, drained at SCROLL_MAX_PER_FRAME
  scrollClampMin?: number      // Virtual scroll clamp bounds
  scrollClampMax?: number
  scrollHeight?: number
  scrollViewportHeight?: number
  scrollViewportTop?: number
  stickyScroll?: boolean
  // ... more fields
}
// Comprehensive DOM element type
// Scroll state + Event handlers + dirty flag
// yogaNode LayoutNode reference
```

### Scroll State Pattern

```typescript
// ScrollTop: number of rows scrolled down
scrollTop?: number

// pendingScrollDelta: accumulated scroll delta not yet applied
// Drained at SCROLL_MAX_PER_FRAME rows/frame
// Fast flicks show intermediate frames instead of big jump
pendingScrollDelta?: number

// scrollClampMin/Max: virtual scroll clamp bounds
// Prevents blank screen when scrollTo races past React re-render
scrollClampMin?: number
scrollClampMax?: number
// Scroll state for overflow: 'scroll' boxes
// pendingScrollDelta accumulator
// scrollClamp bounds
```

### Event Handlers Separation

```typescript
// Event handlers set by reconciler for capture/bubble dispatcher
// Stored separately from attributes so handler identity changes
// don't mark dirty and defeat blit optimization
_eventHandlers?: Record<string, unknown>
// Separated from attributes
// Identity changes don't trigger dirty
# Blit optimization preserved
```

### dirty Flag Pattern

```typescript
// When true, this node needs re-rendering
dirty: boolean
// Simple boolean flag
// Mark dirty on changes
# Trigger re-render
```

### yogaNode LayoutNode

```typescript
yogaNode?: LayoutNode
// Yoga layout engine node
// Layout computation reference
# Flexbox layout
```

### hasRenderedContent Pattern

```typescript
// Used to skip empty renders during React 19's effect double-invoke in test mode
hasRenderedContent?: boolean
// React 19 test mode optimization
# Skip empty renders
# Double-invoke protection
```

### stickyScroll Pattern

```typescript
stickyScroll?: boolean
// Auto-pins scrollTop to bottom when content grows
// Sticky scroll behavior
```

## 实现建议

### OpenClaw适配

1. **domElementType**: DOMElement comprehensive type
2. **scrollState**: Scroll state pattern
3. **eventHandlers**: Event handlers separation
4. **dirtyFlag**: dirty flag pattern
5. **yogaNode**: LayoutNode reference

### 状态文件示例

```json
{
  "nodeName": "ink-box",
  "dirty": true,
  "scrollTop": 10,
  "pendingScrollDelta": 5,
  "stickyScroll": true
}
```

## 关键模式

### Scroll Accumulator Pattern

```
pendingScrollDelta → SCROLL_MAX_PER_FRAME → intermediate frames → fast flicks
// Scroll delta accumulator
// 每帧drain限制
// 显示intermediate frames
```

### Virtual Scroll Clamp

```
scrollClampMin/Max → prevent blank screen → race condition protection
// Virtual scroll clamp bounds
// 防止blank screen
// scrollTo vs re-render race
```

### Event Handlers Separation

```
_eventHandlers ≠ attributes → identity changes → no dirty → blit optimization
// Event handlers独立存储
// Identity changes不触发dirty
# 保持blit optimization
```

### React 19 Double-Invoke

```
hasRenderedContent → skip empty renders → test mode double-invoke
// React 19 test mode会double-invoke effects
// hasRenderedContent避免empty renders
```

## 借用价值

- ⭐⭐⭐⭐⭐ DOMElement comprehensive type
- ⭐⭐⭐⭐⭐ Scroll accumulator pattern
- ⭐⭐⭐⭐⭐ Virtual scroll clamp bounds
- ⭐⭐⭐⭐ Event handlers separation pattern
- ⭐⭐⭐⭐ dirty flag pattern

## 来源

- Claude Code: `ink/dom.ts` (484 lines)
- 分析报告: P48-1