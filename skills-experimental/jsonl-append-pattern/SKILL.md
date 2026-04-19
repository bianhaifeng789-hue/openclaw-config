# JSONL Append Pattern Skill

JSONL Append Pattern - sessionStorage + JSONL format + appendFile async + tail sync read + sessionFile pointer + transcript entry types + resetSessionFilePointer + adoptResumedSessionFile + reAppendSessionMetadata + parseJSONL + entry types: message/fileHistory/attribution/contextCollapse/contentReplacement/worktree。

## 功能概述

从Claude Code的utils/sessionStorage.ts提取的JSONL append模式，用于OpenClaw的会话存储。

## 核心机制

### JSONL Format

```typescript
// JSONL: JSON Lines format
// Each line is a separate JSON object
// Newline-separated JSON entries
# Append-friendly
# Line-based parsing
```

### appendFile async

```typescript
import { appendFile as fsAppendFile } from 'fs/promises'
// Async append to JSONL file
# Non-blocking writes
# Stream-friendly
```

### tail sync read

```typescript
import { closeSync, fstatSync, openSync, readSync } from 'fs'
// Sync read for tail operations
// readFileTailSync
# Must be sync for certain operations
```

### sessionFile pointer

```typescript
let sessionFile: string | null = null
// Pointer to current session JSONL file
# Lazy materialize
# Null until first write
```

### transcript entry types

```typescript
type Entry =
  | { type: 'message'; ... }
  | { type: 'fileHistory'; ... }
  | { type: 'attribution'; ... }
  | { type: 'contextCollapse'; ... }
  | { type: 'contentReplacement'; ... }
  | { type: 'worktree'; ... }
// Multiple entry types
# Each line has type field
```

### resetSessionFilePointer

```typescript
export async function resetSessionFilePointer(): Promise<void> {
  sessionFile = null
  // Null sessionFile pointer
  // Block reAppendSessionMetadata
}
// Reset session file pointer
# Used on resume
```

### adoptResumedSessionFile

```typescript
export function adoptResumedSessionFile(): void {
  // Point sessionFile at the resumed transcript
  // reAppendSessionMetadata now runs
}
// Adopt resumed session file
# Used on resume
```

### reAppendSessionMetadata

```typescript
export async function reAppendSessionMetadata(): Promise<void> {
  if (!sessionFile) return  // Bail on null

  // Re-append metadata to session file
  // Update session metadata on exit
}
// Re-append session metadata
# Called on exit cleanup
```

### parseJSONL

```typescript
export function parseJSONL(content: string): Entry[] {
  const lines = content.split('\n')
  const entries: Entry[] = []
  for (const line of lines) {
    if (line.trim() === '') continue
    try {
      const entry = JSON.parse(line) as Entry
      entries.push(entry)
    } catch {}
  }
  return entries
}
// Parse JSONL content
# Split by newline
# JSON.parse each line
```

### entry types: message/fileHistory/attribution/contextCollapse/contentReplacement/worktree

```typescript
// Entry types in JSONL:
// - message: transcript messages
// - fileHistory: file history snapshots
// - attribution: attribution snapshots
// - contextCollapse: context collapse entries
// - contentReplacement: content replacement records
// - worktree: worktree state
// Multiple entry types
# Discriminated union
# type field discriminant
```

## 实现建议

### OpenClaw适配

1. **jsonlAppend**: JSONL append pattern
2. **tailSync**: tail sync read pattern
3. **entryTypes**: Entry types discriminated union
4. **sessionPointer**: sessionFile pointer pattern
5. **parseJSONL**: parseJSONL pattern

### 状态文件示例

```json
{
  "sessionFile": "/home/.claude/sessions/abc.jsonl",
  "entryTypes": ["message", "fileHistory", "attribution"],
  "lines": 1000
}
```

## 关键模式

### JSONL Line-Based

```
JSON Lines → newline-separated → append-friendly → line-based parsing → each line JSON
# JSONL format
# newline-separated
# append-friendly
# line-based parsing
```

### Async Append + Sync Tail

```
appendFile async → non-blocking writes | tail readSync → must be sync → different paths
# async append写入
# sync tail读取
# 不同路径
```

### Entry Type Discriminant

```
type field → message | fileHistory | attribution | contextCollapse | ... → discriminated union
# Entry type discriminant
# discriminated union
# type field区分
```

### sessionFile Null Pointer

```
sessionFile = null → lazy materialize → adoptResumedSessionFile → set pointer
# sessionFile null pointer
# lazy materialize
# adopt时set pointer
```

### parseJSONL Split + JSON.parse

```
content.split('\n') → for each line → JSON.parse → Entry → entries array
# parseJSONL pattern
# split('\n')
# JSON.parse each line
```

## 借用价值

- ⭐⭐⭐⭐⭐ JSONL line-based pattern
- ⭐⭐⭐⭐⭐ Async append + sync tail pattern
- ⭐⭐⭐⭐⭐ Entry type discriminant pattern
- ⭐⭐⭐⭐⭐ sessionFile null pointer pattern
- ⭐⭐⭐⭐⭐ parseJSONL pattern

## 来源

- Claude Code: `utils/sessionStorage.ts` (5105 lines)
- 分析报告: P54-6