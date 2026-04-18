# History Pattern Skill

History Pattern - MAX_HISTORY_ITEMS=100 + PastedContent Reference + parseReferences + expandPastedTextRefs + lockfile + MAX_PASTED_CONTENT_LENGTH=1024。

## 功能概述

从Claude Code的history.ts提取的历史管理模式，用于OpenClaw的输入历史。

## 核心机制

### MAX_HISTORY_ITEMS

```typescript
const MAX_HISTORY_ITEMS = 100
// Bounded history size
// Prevent unbounded growth
// 100 items max
```

### MAX_PASTED_CONTENT_LENGTH

```typescript
const MAX_PASTED_CONTENT_LENGTH = 1024
// Inline content threshold
// Small pastes inline (< 1024 chars)
// Large pastes → hash reference → external store
```

### StoredPastedContent Type

```typescript
type StoredPastedContent = {
  id: number
  type: 'text' | 'image'
  content?: string           // Inline content for small pastes
  contentHash?: string       // Hash reference for large pastes
  mediaType?: string
  filename?: string
}
// Discriminated by content vs contentHash
// Inline vs external storage
// Type + id + metadata
```

### Reference Format

```typescript
// Claude Code parses history for pasted content references:
//   Text: [Pasted text #1 +10 lines]
//   Image: [Image #2]
// Numbers unique within prompt, not across prompts
// Auto-incrementing IDs (user-friendly)

export function formatPastedTextRef(id: number, numLines: number): string {
  if (numLines === 0) return `[Pasted text #${id}]`
  return `[Pasted text #${id} +${numLines} lines]`
}

export function formatImageRef(id: number): string {
  return `[Image #${id}]`
}
// Structured reference format
// Line count display (+N lines)
// Auto-incrementing IDs
```

### parseReferences

```typescript
export function parseReferences(
  input: string,
): Array<{ id: number; match: string; index: number }> {
  const referencePattern =
    /\[(Pasted text|Image|\.\.\.Truncated text) #(\d+)(?: \+\d+ lines)?(\.)*\]/g
  const matches = [...input.matchAll(referencePattern)]
  return matches
    .map(match => ({
      id: parseInt(match[2] || '0'),
      match: match[0],
      index: match.index,
    }))
    .filter(match => match.id > 0)
}
// Regex parse references
// Match id, full match, index
// Filter valid ids (> 0)
```

### expandPastedTextRefs

```typescript
/**
 * Replace [Pasted text #N] placeholders in input with their actual content.
 * Image refs are left alone — they become content blocks, not inlined text.
 */
// Replace text refs with actual content
// Image refs → content blocks
// Not inlined
```

### lockfile Pattern

```typescript
import { lock } from './utils/lockfile.js'

// Lock for history file operations
// Prevent concurrent writes
// Safe file access
```

### readLinesReverse

```typescript
import { readLinesReverse } from './utils/fsOperations.js'

// Read history file from end
// Recent entries first
// Efficient pagination
```

### hashPastedText + storePastedText

```typescript
import {
  hashPastedText,
  retrievePastedText,
  storePastedText,
} from './utils/pasteStore.js'

// hashPastedText: generate hash for large paste
// storePastedText: store large paste externally
// retrievePastedText: retrieve from hash
// External paste storage system
```

## 实现建议

### OpenClaw适配

1. **maxHistoryItems**: MAX_HISTORY_ITEMS=100
2. **pastedContentRef**: Reference格式系统
3. **parseReferences**: 正则解析
4. **inlineThreshold**: 1024 chars threshold
5. **lockfileHistory**: 锁文件保护

### 状态文件示例

```json
{
  "historySize": 50,
  "maxItems": 100,
  "pasteThreshold": 1024,
  "lastEntryId": 42
}
```

## 关键模式

### Inline vs External

```
content < 1024 → inline
content >= 1024 → hash reference → external store
// 小内容inline
// 大内容external存储
```

### Reference Format

```
[Pasted text #N +M lines] → structured reference → parseReferences regex
// 结构化reference格式
// 正则解析提取id
```

### Auto-Incrementing IDs

```
#1, #2, #3 → within prompt unique → not across prompts
// 提示内唯一
// 提示间不唯一
// 用户友好
```

### Lockfile Protection

```
lock() → concurrent write protection → safe file access
// 锁文件防止并发写入
// 安全文件访问
```

## 借用价值

- ⭐⭐⭐⭐⭐ Inline/External threshold pattern
- ⭐⭐⭐⭐⭐ Reference format system
- ⭐⭐⭐⭐⭐ parseReferences regex
- ⭐⭐⭐⭐ MAX_HISTORY_ITEMS bound
- ⭐⭐⭐⭐ lockfile for history

## 来源

- Claude Code: `history.ts`
- 分析报告: P45-4