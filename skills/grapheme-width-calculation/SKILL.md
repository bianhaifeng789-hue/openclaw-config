# Grapheme Width Calculation Skill

Grapheme Width Calculation - graphemeWidth function + hasMultipleCodepoints check + isEmoji detection + isEastAsianWide detection + codePoint extraction + width 1 or 2 return + segmentGraphemes generator + Intl.Segmenter usage。

## 功能概述

从Claude Code的ink/termio/parser.ts提取的Grapheme宽度计算模式，用于OpenClaw的终端字符宽度计算。

## 核心机制

### graphemeWidth Function

```typescript
function graphemeWidth(grapheme: string): 1 | 2 {
  if (hasMultipleCodepoints(grapheme)) return 2  // Emoji cluster
  const codePoint = grapheme.codePointAt(0)
  if (codePoint === undefined) return 1
  if (isEmoji(codePoint) || isEastAsianWide(codePoint)) return 2
  return 1
}
// Returns 1 or 2
# Multiple codepoints: width 2
# Emoji or EastAsianWide: width 2
# Otherwise: width 1
```

### hasMultipleCodepoints Check

```typescript
function hasMultipleCodepoints(str: string): boolean {
  let count = 0
  for (const _ of str) {
    count++
    if (count > 1) return true  // More than one codepoint
  }
  return false
}
// Check if grapheme has multiple codepoints
# Emoji cluster: multiple codepoints
# Returns true if count > 1
```

### isEmoji Detection

```typescript
function isEmoji(codePoint: number): boolean {
  return (
    (codePoint >= 0x2600 && codePoint <= 0x26ff) ||  // Misc symbols
    (codePoint >= 0x2700 && codePoint <= 0x27bf) ||  // Dingbats
    (codePoint >= 0x1f300 && codePoint <= 0x1f9ff) ||  // Emoji
    (codePoint >= 0x1fa00 && codePoint <= 0x1faff) ||  // Extended emoji
    (codePoint >= 0x1f1e0 && codePoint <= 0x1f1ff)     // Flags
  )
}
// Emoji codepoint ranges
# Misc symbols, Dingbats, Emoji ranges
```

### isEastAsianWide Detection

```typescript
function isEastAsianWide(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||  // Hangul Jamo
    (codePoint >= 0x2e80 && codePoint <= 0x9fff) ||  // CJK
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||  // Hangul
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||  // CJK compat
    (codePoint >= 0xfe10 && codePoint <= 0xfe1f) ||  // Vertical forms
    (codePoint >= 0xfe30 && codePoint <= 0xfe6f) ||  // CJK compat forms
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||  // Half/fullwidth
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||  // Fullwidth symbols
    (codePoint >= 0x20000 && codePoint <= 0x2fffd) || // CJK Ext B
    (codePoint >= 0x30000 && codePoint <= 0x3fffd)    // CJK Ext G
  )
}
// East Asian Wide codepoint ranges
# CJK, Hangul, Fullwidth chars
```

### codePoint Extraction

```typescript
const codePoint = grapheme.codePointAt(0)
if (codePoint === undefined) return 1  // Fallback for empty
// Extract first codepoint
# codePointAt(0) for first char
```

### width 1 or 2 Return

```typescript
return 1 | 2
// Width 1: narrow/single-width chars
// Width 2: wide/double-width chars (emoji, CJK)
// Terminal display width
```

### segmentGraphemes Generator

```typescript
function* segmentGraphemes(str: string): Generator<Grapheme> {
  for (const { segment } of getGraphemeSegmenter().segment(str)) {
    yield { value: segment, width: graphemeWidth(segment) }
  }
}
// Yield grapheme clusters with width
# Intl.Segmenter for proper segmentation
```

### Intl.Segmenter Usage

```typescript
import { getGraphemeSegmenter } from '../../utils/intl.js'

for (const { segment } of getGraphemeSegmenter().segment(str)) {
  // Process grapheme cluster
}
// Intl.Segmenter for grapheme segmentation
# Handles emoji + modifiers correctly
```

## 实现建议

### OpenClaw适配

1. **graphemeWidthFunction**: graphemeWidth function
2. **hasMultipleCodepoints**: hasMultipleCodepoints check
3. **isEmojiDetection**: isEmoji detection
4. **isEastAsianWide**: isEastAsianWide detection
5. **segmentGraphemes**: segmentGraphemes generator

### 状态文件示例

```json
{
  "grapheme": "👨‍👩‍👧‍👦",
  "codepoints": 7,
  "width": 2
}
```

## 关键模式

### Multiple Codepoints → Width 2

```
hasMultipleCodepoints(grapheme) → true → width 2 → emoji cluster handling
# 多codepoints grapheme
# emoji cluster（emoji + modifiers）
# width 2
```

### Emoji Codepoint Ranges

```
0x2600-0x26ff (Misc symbols) + 0x1f300-0x1f9ff (Emoji) → emoji detection
# Emoji codepoint ranges
# Misc symbols + Emoji blocks
```

### EastAsianWide Codepoint Ranges

```
CJK (0x2e80-0x9fff) + Hangul (0xac00-0xd7a3) + Fullwidth (0xff00-0xff60) → wide
# East Asian Wide ranges
# CJK, Hangul, Fullwidth
```

### Intl.Segmenter Grapheme Segmentation

```
Intl.Segmenter → grapheme clusters → emoji + modifiers as one unit → correct width
# Intl.Segmenter分割grapheme
# emoji + modifiers作为一个cluster
# 正确计算width
```

### 1 or 2 Binary Width

```
graphemeWidth → 1 | 2 → binary return → no complex width values
# 只返回1或2
# terminal width binary
# 无中间值
```

## 借用价值

- ⭐⭐⭐⭐⭐ graphemeWidth function pattern
- ⭐⭐⭐⭐⭐ hasMultipleCodepoints emoji cluster detection
- ⭐⭐⭐⭐⭐ isEmoji/isEastAsianWide codepoint ranges
- ⭐⭐⭐⭐⭐ Intl.Segmenter grapheme segmentation
- ⭐⭐⭐⭐⭐ 1 or 2 binary width return

## 来源

- Claude Code: `ink/termio/parser.ts` (394 lines)
- 分析报告: P51-5