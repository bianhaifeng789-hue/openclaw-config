# Fuzzy Picker Skill

Fuzzy Picker - PickerAction + previewPosition + direction (down/up) + CHROME_ROWS + visibleCount动态计算。

## 功能概述

从Claude Code的FuzzyPicker提取的模糊选择器模式，用于OpenClaw的搜索/选择界面。

## 核心机制

### PickerAction Type

```typescript
type PickerAction<T> = {
  /** Hint label shown in the byline, e.g. "mention" → "Tab to mention". */
  action: string
  handler: (item: T) => void
}

onTab?: PickerAction<T>
onShiftTab?: PickerAction<T>
// Action + handler pair
// Hint label for byline
// Tab gets own action, no longer aliases Enter
```

### previewPosition

```typescript
previewPosition?: 'bottom' | 'right'

// 'right' keeps hints stable (no bounce), but needs width
// 'bottom' default position
// Preview placement determines layout
```

### Direction Enum

```typescript
direction?: 'down' | 'up'

/**
 * 'up' puts items[0] at the bottom next to the input (atuin-style).
 * Arrows always match screen direction — ↑ walks visually up regardless.
 */
// 'down': normal layout
// 'up': atuin-style reverse layout
// Arrows match screen direction
```

### CHROME_ROWS Constant

```typescript
const DEFAULT_VISIBLE = 8

// Pane (paddingTop + Divider) + title + 3 gaps + SearchBox (rounded border = 3 rows) + hints
// matchLabel adds +1 when present, accounted for separately.
const CHROME_ROWS = 10
const MIN_VISIBLE = 2
// Fixed UI chrome rows
// Used for visibleCount calculation
```

### visibleCount Dynamic

```typescript
const visibleCount = Math.max(MIN_VISIBLE, Math.min(requestedVisible, rows - CHROME_ROWS - (matchLabel ? 1 : 0)))
// Cap visibleCount so picker never exceeds terminal height
// Overflow causes cursor mis-positioning
// Dynamic calculation based on terminal rows
```

### onFocus Callback

```typescript
/**
 * Fires when focused item changes (via arrows or when items reset).
 * Useful for async preview loading — keeps I/O out of renderPreview.
 */
onFocus?: (item: T | undefined) => void
// Async preview loading hook
// Keeps I/O out of render function
```

### emptyMessage Dynamic

```typescript
emptyMessage?: string | ((query: string) => string)

// Shown when items is empty
// Caller bakes loading/searching state into this
// Can be static string or dynamic function
```

## 实现建议

### OpenClaw适配

1. **pickerAction**: PickerAction类型
2. **previewPosition**: 预览位置
3. **directionEnum**: Direction枚举
4. **chromeRows**: CHROME_ROWS常量
5. **visibleCountDynamic**: visibleCount动态计算

### 状态文件示例

```json
{
  "previewPosition": "right",
  "direction": "down",
  "chromeRows": 10,
  "minVisible": 2,
  "defaultVisible": 8
}
```

## 关键模式

### PickerAction Pair

```
{ action: "mention", handler: (item) => void } → Tab gets own action + hint
// Tab不再alias Enter
// Shift+Tab fallback if onShiftTab unset
```

### Preview Position

```
'right' → stable hints, needs width, 'bottom' → default
// 右侧预览防止bounce
// 需要额外宽度
```

### Atuin-Style Direction

```
'up' → items[0] at bottom, arrows match screen direction
// 反向布局（atuin风格）
// ↑ visually up regardless
```

### Terminal Overflow Guard

```
rows - CHROME_ROWS - matchLabel → visibleCount cap
// overflow会导致cursor mis-positioning
// 动态计算防止溢出
```

### Async Preview Loading

```
onFocus → async preview → keeps I/O out of renderPreview
// 预览加载异步化
// 渲染函数无I/O
```

## 借用价值

- ⭐⭐⭐⭐⭐ PickerAction pattern (Tab/Shift+Tab)
- ⭐⭐⭐⭐⭐ previewPosition (bottom/right)
- ⭐⭐⭐⭐⭐ direction (atuin-style 'up')
- ⭐⭐⭐⭐⭐ CHROME_ROWS overflow guard
- ⭐⭐⭐⭐ onFocus async preview

## 来源

- Claude Code: `components/design-system/FuzzyPicker.tsx`
- 分析报告: P41-4