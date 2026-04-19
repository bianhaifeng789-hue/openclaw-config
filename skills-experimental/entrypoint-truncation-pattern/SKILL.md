# Entrypoint Truncation Pattern Skill

Entrypoint Truncation Pattern - MAX_ENTRYPOINT_LINES=200 + MAX_ENTRYPOINT_BYTES=25000 + Line AND Byte caps + truncateEntrypointContent + Line-truncates first + Byte-truncates at newline。

## 功能概述

从Claude Code的memdir/memdir.ts提取的截断模式，用于OpenClaw的文件大小限制。

## 核心机制

### MAX_ENTRYPOINT_LINES

```typescript
export const ENTRYPOINT_NAME = 'MEMORY.md'
export const MAX_ENTRYPOINT_LINES = 200
// ~125 chars/line at 200 lines
// Line cap for entrypoint
```

### MAX_ENTRYPOINT_BYTES

```typescript
export const MAX_ENTRYPOINT_BYTES = 25_000
// ~125 chars/line at 200 lines. At p97 today; catches long-line indexes
// that slip past the line cap (p100 observed: 197KB under 200 lines).
// Byte cap catches long-line indexes
// p97 threshold
// p100: 197KB under 200 lines (long lines)
```

### EntrypointTruncation Type

```typescript
export type EntrypointTruncation = {
  content: string
  lineCount: number
  byteCount: number
  wasLineTruncated: boolean
  wasByteTruncated: boolean
}
// Truncation result with flags
# Track both line and byte truncation
# Report which cap fired
```

### truncateEntrypointContent

```typescript
/**
 * Truncate MEMORY.md content to the line AND byte caps, appending a warning
 * that names which cap fired. Line-truncates first (natural boundary), then
 * byte-truncates at the last newline before the cap so we don't cut mid-line.
 */
export function truncateEntrypointContent(raw: string): EntrypointTruncation {
  const trimmed = raw.trim()
  const contentLines = trimmed.split('\n')
  const lineCount = contentLines.length
  const byteCount = trimmed.length

  const wasLineTruncated = lineCount > MAX_ENTRYPOINT_LINES
  // Check original byte count — long lines are failure mode the byte cap targets
  const wasByteTruncated = byteCount > MAX_ENTRYPOINT_BYTES

  if (!wasLineTruncated && !wasByteTruncated) {
    return {
      content: trimmed,
      lineCount,
      byteCount,
      wasLineTruncated,
      wasByteTruncated,
    }
  }

  let truncated = wasLineTruncated
    ? contentLines.slice(0, MAX_ENTRYPOINT_LINES).join('\n')
    : trimmed

  // Byte truncation at last newline before cap
  if (truncated.length > MAX_ENTRYPOINT_BYTES) {
    const lastNewlineBeforeCap = truncated.lastIndexOf(
      '\n',
      MAX_ENTRYPOINT_BYTES,
    )
    truncated = truncated.slice(0, lastNewlineBeforeCap)
  }

  // Append warning naming which cap fired
  const warning = wasLineTruncated
    ? `\n\n[⚠️ Truncated at ${MAX_ENTRYPOINT_LINES} lines]`
    : `\n\n[⚠️ Truncated at ${MAX_ENTRYPOINT_BYTES / 1000}KB]`

  return {
    content: truncated + warning,
    lineCount: truncated.split('\n').length,
    byteCount: truncated.length,
    wasLineTruncated,
    wasByteTruncated,
  }
}
// Line-truncates first (natural boundary)
// Byte-truncates at last newline before cap
// Don't cut mid-line
// Warning naming which cap fired
```

### Line-First Then Byte

```typescript
// Line-truncates first (natural boundary), then byte-truncates at the
# last newline before the cap so we don't cut mid-line.
// Order: Line → Byte
# Natural boundary first
# Avoid mid-line cut
```

### Last Newline Before Cap

```typescript
const lastNewlineBeforeCap = truncated.lastIndexOf('\n', MAX_ENTRYPOINT_BYTES)
truncated = truncated.slice(0, lastNewlineBeforeCap)
// Find last newline before byte cap
// Slice at newline position
# Complete lines only
```

### Warning Naming Cap

```typescript
const warning = wasLineTruncated
  ? `\n\n[⚠️ Truncated at ${MAX_ENTRYPOINT_LINES} lines]`
  : `\n\n[⚠️ Truncated at ${MAX_ENTRYPOINT_BYTES / 1000}KB]`
// Warning names which cap fired
// Line: "Truncated at 200 lines"
// Byte: "Truncated at 25KB"
```

## 实现建议

### OpenClaw适配

1. **maxEntrypointLines**: MAX_ENTRYPOINT_LINES=200
2. **maxEntrypointBytes**: MAX_ENTRYPOINT_BYTES=25000
3. **truncateEntrypoint**: truncateEntrypointContent
4. **lineFirstByte**: Line-first then Byte pattern
5. **warningNamingCap**: Warning naming cap fired

### 状态文件示例

```json
{
  "maxLines": 200,
  "maxBytes": 25000,
  "lineTruncated": false,
  "byteTruncated": false
}
```

## 关键模式

### Line AND Byte Caps

```
MAX_ENTRYPOINT_LINES=200 + MAX_ENTRYPOINT_BYTES=25000 → both caps enforced
// 双重限制
// Line限制自然边界
// Byte限制长行index
```

### Line-First Order

```
Line-truncates first → natural boundary → then byte-truncates → last newline
// 先Line截断（自然边界）
// 后Byte截断（last newline）
// 不在行中间cut
```

### Last Newline Position

```
lastIndexOf('\n', MAX_ENTRYPOINT_BYTES) → slice at newline → complete lines
// 在byte cap前找最后一个newline
// 在newline位置截断
// 保证完整行
```

### Warning Names Cap

```
[⚠️ Truncated at 200 lines] OR [⚠️ Truncated at 25KB] → user knows which cap
// Warning明确说明哪个cap触发了
// 用户知道原因
```

## 借用价值

- ⭐⭐⭐⭐⭐ Line AND Byte caps pattern
- ⭐⭐⭐⭐⭐ Line-first truncation order
- ⭐⭐⭐⭐⭐ Last newline before byte cap
- ⭐⭐⭐⭐⭐ Warning naming cap fired
- ⭐⭐⭐⭐ EntrypointTruncation type

## 来源

- Claude Code: `memdir/memdir.ts`
- 分析报告: P46-3