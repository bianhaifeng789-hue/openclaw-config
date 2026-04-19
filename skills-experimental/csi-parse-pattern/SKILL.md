# CSI Parse Pattern Skill

CSI Parse Pattern - parseCSI function + finalByte extraction + privateMode prefix + intermediate bytes + paramStr parsing + params array + p0/p1 defaults + cursor movement cases + erase/insert/delete cases + SGR handling + Action type return。

## 功能概述

从Claude Code的ink/termio/parser.ts提取的CSI解析模式，用于OpenClaw的ANSI序列语义解析。

## 核心机制

### parseCSI Function

```typescript
function parseCSI(rawSequence: string): Action | null {
  const inner = rawSequence.slice(2)  // Remove ESC [
  if (inner.length === 0) return null

  const finalByte = inner.charCodeAt(inner.length - 1)
  const beforeFinal = inner.slice(0, -1)
  // Extract final byte and before-final
  // Returns Action or null
}
```

### finalByte Extraction

```typescript
const finalByte = inner.charCodeAt(inner.length - 1)
// Final byte determines command
// e.g., 'A' (0x41) = Cursor Up
```

### privateMode Prefix

```typescript
if (beforeFinal.length > 0 && '?>='.includes(beforeFinal[0]!)) {
  privateMode = beforeFinal[0]!
  paramStr = beforeFinal.slice(1)
}
// Private mode prefix: ?, >, =
# e.g., CSI ?25l (cursor hide private)
```

### intermediate Bytes

```typescript
const intermediateMatch = paramStr.match(/([^0-9;:]+)$/)
if (intermediateMatch) {
  intermediate = intermediateMatch[1]!
  paramStr = paramStr.slice(0, -intermediate.length)
}
// Intermediate bytes before final
# e.g., CSI 0 SP A (SP = space)
```

### paramStr Parsing

```typescript
const params = parseCSIParams(paramStr)
// Parse parameters (semicolon and colon separated)
# Returns number array
```

### params Array

```typescript
function parseCSIParams(paramStr: string): number[] {
  if (paramStr === '') return []
  return paramStr.split(/[;:]/).map(s => (s === '' ? 0 : parseInt(s, 10)))
}
// Split by ; or :
# Empty → 0, else parseInt
```

### p0/p1 Defaults

```typescript
const p0 = params[0] ?? 1  // Default 1 if missing
const p1 = params[1] ?? 1
// Default values for missing params
# Most CSI commands default to 1
```

### Cursor Movement Cases

```typescript
if (finalByte === CSI.CUU) {
  return {
    type: 'cursor',
    action: { type: 'move', direction: 'up', count: p0 },
  }
}
// CUU (A): Cursor Up
# CUD (B): Down, CUF (C): Forward, CUB (D): Back
# CNL (E): Next Line, CPL (F): Prev Line
# CHA (G): Column, CUP (H): Position, VPA (d): Row
```

### Erase Cases

```typescript
if (finalByte === CSI.ED) {
  return { type: 'erase', region: p0 === 0 ? 'below' : p0 === 1 ? 'above' : 'all' }
}
// ED (J): Erase in Display
# EL (K): Erase in Line
# ECH (X): Erase Character
```

### Insert/Delete Cases

```typescript
if (finalByte === CSI.IL) {
  return { type: 'insert', lines: p0 }
}
if (finalByte === CSI.DL) {
  return { type: 'delete', lines: p0 }
}
// IL (L): Insert Lines
# DL (M): Delete Lines
# ICH (@): Insert Characters
# DCH (P): Delete Characters
```

### SGR Handling

```typescript
if (finalByte === CSI.SGR && privateMode === '') {
  return { type: 'sgr', params: paramStr }
}
// SGR (m): Select Graphic Rendition
# params passed to SGR parser
```

### Action Type Return

```typescript
return {
  type: 'cursor' | 'erase' | 'insert' | 'delete' | 'sgr' | 'scroll' | ...,
  // specific action fields
}
// Semantic action type
# Not raw sequence string
# Structured representation
```

## 实现建议

### OpenClaw适配

1. **parseCSIFunction**: parseCSI function
2. **finalByteExtract**: finalByte extraction pattern
3. **privateModePrefix**: privateMode prefix handling
4. **intermediateBytes**: intermediate bytes extraction
5. **actionTypeReturn**: Action type return pattern

### 状态文件示例

```json
{
  "finalByte": 65,
  "privateMode": "",
  "intermediate": "",
  "params": [5],
  "action": {"type": "cursor", "direction": "up", "count": 5}
}
```

## 关键模式

### finalByte Command Identification

```
finalByte → command identification → 'A'=CUU, 'B'=CUD, 'J'=ED, 'm'=SGR
# final byte决定command
# 不同final byte不同action
```

### privateMode Private Sequences

```
'?>=' prefix → private mode → CSI ?25l (cursor hide) → different from CSI 25l
# private mode prefix: ?, >, =
# 私有sequence不同于标准
```

### intermediate Bytes Before Final

```
paramStr.match(/([^0-9;:]+)$/) → intermediate bytes → between params and final
# intermediate bytes在params和final之间
# regex提取
```

### p0/p1 Default 1

```
params[0] ?? 1 → default 1 → most CSI commands count defaults to 1
# params缺失默认1
# 大多数CSI commands count默认1
```

### Semantic Action Return

```
parseCSI → Action (cursor/erase/insert/delete/sgr) → semantic meaning → not raw string
# parseCSI返回语义Action
# 不是raw sequence string
# 结构化representation
```

## 借用价值

- ⭐⭐⭐⭐⭐ parseCSI semantic parsing pattern
- ⭐⭐⭐⭐⭐ finalByte command identification
- ⭐⭐⭐⭐⭐ privateMode prefix handling
- ⭐⭐⭐⭐⭐ intermediate bytes extraction
- ⭐⭐⭐⭐⭐ Action type semantic return

## 来源

- Claude Code: `ink/termio/parser.ts` (394 lines)
- 分析报告: P51-4