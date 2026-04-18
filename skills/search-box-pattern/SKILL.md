# Search Box Pattern Skill

Search Box Pattern - cursorOffset + isFocused/isTerminalFocused + prefix default ⌕ + borderless + inverse cursor。

## 功能概述

从Claude Code的SearchBox.tsx提取的搜索框模式，用于OpenClaw的搜索输入。

## 核心机制

### cursorOffset

```typescript
const offset = cursorOffset ?? query.length
// Default: end of query
// Allow custom cursor position
// For typeahead scenarios
```

### isFocused vs isTerminalFocused

```typescript
isFocused: boolean       // SearchBox has focus
isTerminalFocused: boolean  // Terminal window has focus

// isFocused + isTerminalFocused → show inverse cursor
// isFocused + !isTerminalFocused → show query without cursor
// !isFocused → show dim placeholder
// Two-level focus state
```

### prefix Default

```typescript
const prefix = t2 === undefined ? "\u2315" : t2  // ⌕ default
// Unicode ⌕ (search icon)
// Custom prefix allowed
// Visual search indicator
```

### borderless Option

```typescript
const borderless = t3 === undefined ? false : t3

<Box
  borderStyle={borderless ? undefined : 'round'}
  borderColor={isFocused ? 'suggestion' : undefined}
  borderDimColor={!isFocused}
  paddingX={borderless ? 0 : 1}
>
// borderless: no border, paddingX=0
// bordered: round border, paddingX=1
```

### inverse Cursor

```typescript
isFocused && isTerminalFocused ? (
  <>
    <Text>{query.slice(0, offset)}</Text>
    <Text inverse={true}>{offset < query.length ? query[offset] : " "}</Text>
    {offset < query.length && <Text>{query.slice(offset + 1)}</Text>}
  </>
) : ...
// inverse cursor at offset position
// Space if offset at end
// Slice query around cursor
```

### Placeholder Cursor

```typescript
isFocused && !isTerminalFocused && !query ? (
  <>
    <Text inverse={true}>{placeholder.charAt(0)}</Text>
    <Text dimColor={true}>{placeholder.slice(1)}</Text>
  </>
) : ...
// First char inverse as cursor
// Rest dim
// Placeholder focus indicator
```

### Width Control

```typescript
width?: number | string
<Box width={width} flexShrink={0}>
// Fixed or percentage width
// flexShrink={0} prevents collapse
```

## 实现建议

### OpenClaw适配

1. **cursorOffset**: cursorOffset
2. **dualFocus**: isFocused/isTerminalFocused
3. **prefixDefault**: prefix default ⌕
4. **inverseCursor**: inverse cursor

### 状态文件示例

```json
{
  "cursorOffset": 5,
  "isFocused": true,
  "isTerminalFocused": true,
  "prefix": "⌕",
  "borderless": false
}
```

## 关键模式

### Two-Level Focus

```
isFocused (component) + isTerminalFocused (window) → inverse cursor
// 两层focus状态
// 组件focus + 窗口focus
```

### Cursor Offset

```
cursorOffset ?? query.length → custom or end
// 自定义cursor位置
// 默认末尾
```

### Unicode Prefix

``<arg_value>⌕` (\u2315) default prefix → search icon
// Unicode搜索图标
// 默认prefix
```

### inverse Cursor Display

```
<Text inverse>{char}</Text> → visual cursor
// inverse属性显示cursor
// Space if at end
```

## 借用价值

- ⭐⭐⭐⭐⭐ cursorOffset pattern
- ⭐⭐⭐⭐⭐ isFocused/isTerminalFocused dual state
- ⭐⭐⭐⭐⭐ inverse cursor display
- ⭐⭐⭐⭐ prefix default ⌕
- ⭐⭐⭐⭐ borderless option

## 来源

- Claude Code: `components/SearchBox.tsx`
- 分析报告: P42-5