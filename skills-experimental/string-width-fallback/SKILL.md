# stringWidth Fallback Skill

stringWidth Fallback - stringWidthJavaScript fallback + pure ASCII fast-path + ANSI strip + needsSegmentation check + emojiRegex + eastAsianWidth + grapheme segmenter + codePoint width calculation。

## 功能概述

从Claude Code的ink/stringWidth.ts提取的stringWidth fallback模式，用于OpenClaw的字符串宽度计算。

## 核心机制

### stringWidthJavaScript Fallback

```typescript
/**
 * Fallback JavaScript implementation of stringWidth when Bun.stringWidth is not available.
 */
function stringWidthJavaScript(str: string): number {
  // ...
}
// Fallback when Bun.native unavailable
// JavaScript implementation
```

### Pure ASCII Fast-Path

```typescript
// Fast path: pure ASCII string (no ANSI codes, no wide chars)
let isPureAscii = true
for (let i = 0; i < str.length; i++) {
  const code = str.charCodeAt(0)
  // Check for non-ASCII or ANSI escape (0x1b)
  if (code >= 127 || code === 0x1b) {
    isPureAscii = false
    break
  }
}
if (isPureAscii) {
  // Count printable characters (exclude control chars)
  let width = 0
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code > 0x1f) {
      width++
    }
  }
  return width
}
// ASCII check: code < 127 && code !== 0x1b
# Printable: code > 0x1f
# Fast path
```

### ANSI Strip

```typescript
// Strip ANSI if escape character is present
if (str.includes('\x1b')) {
  str = stripAnsi(str)
  if (str.length === 0) {
    return 0
  }
}
// stripAnsi removes escape sequences
# After strip: count visible chars
```

### needsSegmentation Check

```typescript
// Fast path: simple Unicode (no emoji, variation selectors, or joiners)
if (!needsSegmentation(str)) {
  // Simple Unicode: iterate chars, check width
  for (const char of str) {
    const codePoint = char.codePointAt(0)!
    if (!isZeroWidth(codePoint)) {
      // ... width calculation
    }
  }
}
// needsSegmentation: emoji, variation selectors, joiners
# Simple Unicode: fast iteration
```

### emojiRegex

```typescript
const EMOJI_REGEX = emojiRegex()
// Regex for emoji detection
// Emoji: width 2
```

### eastAsianWidth

```typescript
import { eastAsianWidth } from 'get-east-asian-width'
// eastAsianWidth with ambiguousAsWide: false
// Ambiguous-width: narrow (width 1) for Western contexts
// Unicode standard recommendation
```

### Grapheme Segmenter

```typescript
import { getGraphemeSegmenter } from '../utils/intl.js'

// Use Intl.Segmenter for proper grapheme segmentation
for (const { segment } of getGraphemeSegmenter().segment(str)) {
  // Process grapheme cluster (emoji + modifiers)
}
// Intl.Segmenter: proper grapheme clusters
# Emoji + modifiers: one cluster
```

### codePoint Width Calculation

```typescript
function graphemeWidth(grapheme: string): 1 | 2 {
  if (hasMultipleCodepoints(grapheme)) return 2  // Emoji cluster
  const codePoint = grapheme.codePointAt(0)
  if (isEmoji(codePoint) || isEastAsianWide(codePoint)) return 2
  return 1
}
// Multiple codepoints: width 2 (emoji cluster)
// Emoji or EastAsianWide: width 2
# Otherwise: width 1
```

## 实现建议

### OpenClaw适配

1. **stringWidthFallback**: stringWidthJavaScript fallback
2. **asciiFastPath**: Pure ASCII fast-path
3. **ansiStrip**: ANSI strip pattern
4. **graphemeSegmenter**: Grapheme segmenter pattern
5. **codePointWidth**: codePoint width calculation

### 状态文件示例

```json
{
  "asciiString": true,
  "hasANSI": false,
  "hasEmoji": false,
  "width": 50
}
```

## 关键模式

### ASCII Fast-Path Optimization

```
code < 127 && code !== 0x1b → ASCII → count printable chars → O(n)
# ASCII字符串快速路径
# 只需count printable chars
# 无需complex processing
```

### ANSI Strip Before Width

```
str.includes('\x1b') → stripAnsi(str) → count visible chars → correct width
# ANSI codes不计入width
# stripAnsi移除escape sequences
# 计算visible chars width
```

### Grapheme Cluster Segmentation

```
Intl.Segmenter → grapheme clusters → emoji + modifiers as one unit → correct width
# Intl.Segmenter分割grapheme clusters
# emoji + modifiers作为一个unit
# 正确计算width
```

### EastAsianWidth Handling

```
eastAsianWidth(ambiguousAsWide: false) → ambiguous as narrow → Western contexts standard
# ambiguous-width作为narrow (width 1)
# Western contexts standard
# Unicode recommendation
```

## 借用价值

- ⭐⭐⭐⭐⭐ stringWidthJavaScript fallback
- ⭐⭐⭐⭐⭐ Pure ASCII fast-path optimization
- ⭐⭐⭐⭐⭐ ANSI strip before width pattern
- ⭐⭐⭐⭐⭐ Grapheme cluster segmentation
- ⭐⭐⭐⭐ EastAsianWidth handling

## 来源

- Claude Code: `ink/stringWidth.ts` (222 lines)
- 分析报告: P50-3