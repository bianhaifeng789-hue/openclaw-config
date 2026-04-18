# Width-Aware Truncate Pattern Skill

Width-Aware Truncate Pattern - truncatePathMiddle + stringWidth measurement + grapheme segmenter + maxLength check + filename preserve + truncateToWidth + truncateStartToWidth + truncateToWidthNoEllipsis + wrapText + terminal columns + CJK/emoji safe。

## 功能概述

从Claude Code的utils/truncate.ts提取的Width-aware truncate模式，用于OpenClaw的宽度截断。

## 核心机制

### truncatePathMiddle

```typescript
export function truncatePathMiddle(path: string, maxLength: number): string {
  if (stringWidth(path) <= maxLength) {
    return path
  }

  if (maxLength <= 0) return '…'
  if (maxLength < 5) return truncateToWidth(path, maxLength)

  const lastSlash = path.lastIndexOf('/')
  const filename = lastSlash >= 0 ? path.slice(lastSlash) : path
  const directory = lastSlash >= 0 ? path.slice(0, lastSlash) : ''
  const filenameWidth = stringWidth(filename)

  if (filenameWidth >= maxLength - 1) {
    return truncateStartToWidth(path, maxLength)
  }

  const availableForDir = maxLength - 1 - filenameWidth
  if (availableForDir <= 0) {
    return truncateStartToWidth(filename, maxLength)
  }

  const truncatedDir = truncateToWidthNoEllipsis(directory, availableForDir)
  return truncatedDir + '…' + filename
}
// Truncate path in middle
# Preserve filename
# Truncate directory
# stringWidth for CJK/emoji
```

### stringWidth Measurement

```typescript
import { stringWidth } from '../ink/stringWidth.js'
// Width in terminal columns
# CJK chars = 2 columns
# Emoji = 2 columns
# ASCII = 1 column
```

### grapheme segmenter

```typescript
import { getGraphemeSegmenter } from './intl.js'

for (const { segment } of getGraphemeSegmenter().segment(text)) {
  const segWidth = stringWidth(segment)
  // ...
}
// Split on grapheme boundaries
# Avoid breaking emoji/surrogate pairs
# Intl.Segmenter proper segmentation
```

### maxLength Check

```typescript
if (stringWidth(path) <= maxLength) {
  return path  // No truncation needed
}
// Width check before truncation
# Avoid unnecessary work
```

### filename Preserve

```typescript
const lastSlash = path.lastIndexOf('/')
const filename = lastSlash >= 0 ? path.slice(lastSlash) : path
// Preserve filename (last segment)
# Important for display
# /MyComponent.tsx
```

### truncateToWidth

```typescript
export function truncateToWidth(text: string, maxWidth: number): string {
  if (stringWidth(text) <= maxWidth) return text
  if (maxWidth <= 1) return '…'
  let width = 0
  let result = ''
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    const segWidth = stringWidth(segment)
    if (width + segWidth > maxWidth - 1) break
    result += segment
    width += segWidth
  }
  return result + '…'
}
// Truncate to width with ellipsis
# Grapheme-safe
# width + segWidth > maxWidth - 1
```

### truncateStartToWidth

```typescript
export function truncateStartToWidth(text: string, maxWidth: number): string {
  if (stringWidth(text) <= maxWidth) return text
  if (maxWidth <= 1) return '…'
  const segments = [...getGraphemeSegmenter().segment(text)]
  let width = 0
  let startIdx = segments.length
  for (let i = segments.length - 1; i >= 0; i--) {
    const segWidth = stringWidth(segments[i]!.segment)
    if (width + segWidth > maxWidth - 1) break
    width += segWidth
    startIdx = i
  }
  return '…' + segments.slice(startIdx).map(s => s.segment).join('')
}
// Truncate from start, keep tail
# Reverse iteration
# Keep end of string
```

### truncateToWidthNoEllipsis

```typescript
export function truncateToWidthNoEllipsis(text: string, maxWidth: number): string {
  if (stringWidth(text) <= maxWidth) return text
  if (maxWidth <= 0) return ''
  let width = 0
  let result = ''
  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    const segWidth = stringWidth(segment)
    if (width + segWidth > maxWidth) break
    result += segment
    width += segWidth
  }
  return result
}
// Truncate without ellipsis
# For middle-truncation
# Caller adds own separator
```

### wrapText

```typescript
export function wrapText(text: string, width: number): string[] {
  const lines: string[] = []
  let currentLine = ''
  let currentWidth = 0

  for (const { segment } of getGraphemeSegmenter().segment(text)) {
    const segWidth = stringWidth(segment)
    if (currentWidth + segWidth <= width) {
      currentLine += segment
      currentWidth += segWidth
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = segment
      currentWidth = segWidth
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}
// Wrap text to width
# Grapheme-safe wrapping
# Line-by-line output
```

### terminal columns

```typescript
// Terminal columns (character width)
# Not char count
# CJK/emoji = 2 columns
# Width-aware
```

### CJK/emoji safe

```typescript
// Avoid breaking emoji or surrogate pairs
# Grapheme boundaries
# Proper segmentation
# Intl.Segmenter
```

## 实现建议

### OpenClaw适配

1. **widthTruncate**: truncateToWidth pattern
2. **pathMiddle**: truncatePathMiddle pattern
3. **graphemeSegment**: grapheme segmenter pattern
4. **noEllipsis**: truncateToWidthNoEllipsis pattern
5. **wrapWidth**: wrapText pattern

### 状态文件示例

```json
{
  "path": "src/components/MyComponent.tsx",
  "maxLength": 30,
  "truncated": "src/…/MyComponent.tsx",
  "width": 20
}
```

## 关键模式

### Middle Path Truncation

```
path → lastSlash → filename + directory → truncate directory → '…' + filename → preserve filename
# middle path truncation
# 保留filename
# 截断directory
```

### Grapheme Boundary Iteration

```
getGraphemeSegmenter().segment(text) → for each segment → segWidth → width + segWidth > maxWidth → break
# grapheme boundary iteration
# 不破坏emoji/surrogate pairs
# proper segmentation
```

### truncateStartToWidth Reverse

```
segments.reverse() → for i from length-1 → width + segWidth > maxWidth → startIdx → '…' + segments.slice(startIdx)
# reverse iteration from end
# keep tail
# truncate from start
```

### Width vs Char Count

```
stringWidth(text) ≠ text.length → CJK 2 columns, emoji 2 columns → terminal columns → not char count
# width ≠ char count
# CJK/emoji = 2 columns
# terminal columns
```

### maxWidth - 1 for Ellipsis

```
width + segWidth > maxWidth - 1 → reserve 1 for '…' → result + '…' → ellipsis space
# maxWidth - 1预留ellipsis
# 确保ellipsis空间
```

## 借用价值

- ⭐⭐⭐⭐⭐ Middle path truncation pattern
- ⭐⭐⭐⭐⭐ Grapheme boundary iteration pattern
- ⭐⭐⭐⭐⭐ truncateStartToWidth reverse pattern
- ⭐⭐⭐⭐⭐ Width vs char count pattern
- ⭐⭐⭐⭐⭐ maxWidth - 1 for ellipsis pattern

## 来源

- Claude Code: `utils/truncate.ts` (179 lines)
- 分析报告: P55-5