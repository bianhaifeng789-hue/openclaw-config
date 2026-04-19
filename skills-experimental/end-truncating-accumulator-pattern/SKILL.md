# End-Truncating Accumulator Pattern Skill

End-Truncating Accumulator Pattern - EndTruncatingAccumulator class + maxSize limit + append truncation from end + isTruncated flag + totalBytesReceived tracking + toString truncation marker + truncation marker KB + MAX_STRING_LENGTH 2^25 + safeJoinLines + firstLineOf indexOf + countCharInString indexOf jumps。

## 功能概述

从Claude Code的utils/stringUtils.ts提取的End-truncating accumulator模式，用于OpenClaw的大字符串处理。

## 核心机制

### EndTruncatingAccumulator Class

```typescript
export class EndTruncatingAccumulator {
  private content: string = ''
  private isTruncated = false
  private totalBytesReceived = 0

  constructor(private readonly maxSize: number = MAX_STRING_LENGTH) {}

  append(data: string | Buffer): void {
    const str = typeof data === 'string' ? data : data.toString()
    this.totalBytesReceived += str.length

    if (this.isTruncated && this.content.length >= this.maxSize) {
      return  // Already at capacity
    }

    if (this.content.length + str.length > this.maxSize) {
      const remainingSpace = this.maxSize - this.content.length
      if (remainingSpace > 0) {
        this.content += str.slice(0, remainingSpace)
      }
      this.isTruncated = true
    } else {
      this.content += str
    }
  }

  toString(): string {
    if (!this.isTruncated) {
      return this.content
    }

    const truncatedBytes = this.totalBytesReceived - this.maxSize
    const truncatedKB = Math.round(truncatedBytes / 1024)
    return this.content + `\n... [output truncated - ${truncatedKB}KB removed]`
  }
}
// Accumulator with truncation from end
# maxSize limit
# totalBytesReceived tracking
# truncation marker with KB
```

### maxSize Limit

```typescript
private readonly maxSize: number = MAX_STRING_LENGTH
// Max size limit
# Default: 2^25 = 33MB
# Prevent RangeError
```

### append Truncation from End

```typescript
append(data: string | Buffer): void {
  const str = typeof data === 'string' ? data : data.toString()
  this.totalBytesReceived += str.length

  if (this.content.length + str.length > this.maxSize) {
    const remainingSpace = this.maxSize - this.content.length
    if (remainingSpace > 0) {
      this.content += str.slice(0, remainingSpace)
    }
    this.isTruncated = true
  } else {
    this.content += str
  }
}
// Append with truncation
# Truncate from end (preserve beginning)
# Prevents RangeError crashes
```

### isTruncated Flag

```typescript
private isTruncated = false
// Track truncation state
# true when exceeded maxSize
# Used in toString()
```

### totalBytesReceived Tracking

```typescript
private totalBytesReceived = 0
// Total bytes before truncation
# Track all received data
# Calculate truncated amount
```

### toString Truncation Marker

```typescript
toString(): string {
  if (!this.isTruncated) {
    return this.content
  }

  const truncatedBytes = this.totalBytesReceived - this.maxSize
  const truncatedKB = Math.round(truncatedBytes / 1024)
  return this.content + `\n... [output truncated - ${truncatedKB}KB removed]`
}
// toString with marker
# Show truncated KB amount
# '... [output truncated - 50KB removed]'
```

### truncation marker KB

```typescript
const truncatedKB = Math.round(truncatedBytes / 1024)
`\n... [output truncated - ${truncatedKB}KB removed]`
// Show KB amount truncated
# User-friendly
# Actual bytes removed
```

### MAX_STRING_LENGTH 2^25

```typescript
const MAX_STRING_LENGTH = 2 ** 25
// 33MB max string length
# Prevent RangeError
# Keep RSS modest
# Overflow to disk
```

### safeJoinLines

```typescript
export function safeJoinLines(
  lines: string[],
  delimiter: string = ',',
  maxSize: number = MAX_STRING_LENGTH,
): string {
  const truncationMarker = '...[truncated]'
  let result = ''

  for (const line of lines) {
    const delimiterToAdd = result ? delimiter : ''
    const fullAddition = delimiterToAdd + line

    if (result.length + fullAddition.length <= maxSize) {
      result += fullAddition
    } else {
      const remainingSpace = maxSize - result.length - delimiterToAdd.length - truncationMarker.length

      if (remainingSpace > 0) {
        result += delimiterToAdd + line.slice(0, remainingSpace) + truncationMarker
      } else {
        result += truncationMarker
      }
      return result
    }
  }
  return result
}
// Safe join with truncation
# Truncate when exceeds maxSize
# Preserve beginning
```

### firstLineOf indexOf

```typescript
export function firstLineOf(s: string): string {
  const nl = s.indexOf('\n')
  return nl === -1 ? s : s.slice(0, nl)
}
// First line without split allocation
# indexOf('\n') → slice
# No split('\n') array
# Shebang detection
```

### countCharInString indexOf Jumps

```typescript
export function countCharInString(
  str: { indexOf(search: string, start?: number): number },
  char: string,
  start = 0,
): number {
  let count = 0
  let i = str.indexOf(char, start)
  while (i !== -1) {
    count++
    i = str.indexOf(char, i + 1)
  }
  return count
}
// Count chars with indexOf jumps
# indexOf loop
# Not per-character iteration
# Structurally typed (Buffer works)
```

## 实现建议

### OpenClaw适配

1. **endTruncatingAcc**: EndTruncatingAccumulator pattern
2. **truncationMarkerKB**: Truncation marker with KB pattern
3. **safeJoinLines**: safeJoinLines pattern
4. **firstLineIndexOf**: firstLineOf indexOf pattern
5. **countCharIndexOf**: countCharInString indexOf jumps pattern

### 状态文件示例

```json
{
  "content": "first 33MB...",
  "isTruncated": true,
  "totalBytesReceived": 50000000,
  "maxSize": 33554432,
  "truncatedKB": 16384
}
```

## 关键模式

### Truncate from End Preserve Beginning

```
exceed maxSize → str.slice(0, remainingSpace) → append partial → preserve beginning → prevent RangeError
# truncate from end
# 保留beginning
# 防止RangeError
```

### totalBytesReceived Tracking

```
totalBytesReceived += str.length → track all data → toString: totalBytesReceived - maxSize → truncated amount
# totalBytesReceived tracking
# 计算truncated amount
# 显示实际删除量
```

### Truncation Marker KB

```
'\n... [output truncated - ${truncatedKB}KB removed]' → KB amount → user-friendly → show actual removal
# truncation marker with KB
# 用户友好
# 显示实际删除量
```

### firstLineOf indexOf No Split

```
s.indexOf('\n') → slice(0, nl) → no split('\n') array → no allocation → efficient
# indexOf no split allocation
# 避免split array
# efficient
```

### countChar indexOf Jumps

```
str.indexOf(char, start) → i = indexOf(char, i+1) → indexOf jumps → not per-char iteration → efficient
# indexOf jumps
# 不per-character iteration
# efficient counting
```

## 借用价值

- ⭐⭐⭐⭐⭐ Truncate from end preserve beginning pattern
- ⭐⭐⭐⭐⭐ totalBytesReceived tracking pattern
- ⭐⭐⭐⭐⭐ Truncation marker KB pattern
- ⭐⭐⭐⭐⭐ firstLineOf indexOf no split pattern
- ⭐⭐⭐⭐⭐ countChar indexOf jumps pattern

## 来源

- Claude Code: `utils/stringUtils.ts` (235 lines)
- 分析报告: P55-6