# CharPool Interming Skill

CharPool Interming - CharPool class + strings array + stringMap + ascii Int32Array fast-path + intern/get methods + Index 0 space + Index 1 empty spacer + shared pool across screens + blitRegion copy IDs + diffEach compare IDs。

## 功能概述

从Claude Code的ink/screen.ts提取的CharPool interning模式，用于OpenClaw的字符池内存优化。

## 核心机制

### CharPool Class

```typescript
export class CharPool {
  private strings: string[] = [' ', '']  // Index 0 = space, 1 = empty (spacer)
  private stringMap = new Map<string, number>([[' ', 0], ['', 1]])
  private ascii: Int32Array = initCharAscii()  // charCode → index, -1 = not interned
  // strings array for storage
  // stringMap for lookup
  // ascii Int32Array for ASCII fast-path
}
```

### strings Array

```typescript
private strings: string[] = [' ', '']  // Index 0 = space, 1 = empty (spacer)
// Index 0: space (default)
// Index 1: empty (spacer tail for wide chars)
# Pre-populated common chars
```

### stringMap Lookup

```typescript
private stringMap = new Map<string, number>([[' ', 0], ['', 1]])
// Map for non-ASCII lookup
// string → index mapping
```

### ascii Int32Array Fast-Path

```typescript
private ascii: Int32Array = initCharAscii()  // charCode → index, -1 = not interned

intern(char: string): number {
  // ASCII fast-path: direct array lookup instead of Map.get
  if (char.length === 1) {
    const code = char.charCodeAt(0)
    if (code < 128) {
      const cached = this.ascii[code]!
      if (cached !== -1) return cached  // Already interned
      const index = this.strings.length
      this.strings.push(char)
      this.ascii[code] = index  // Cache for future lookups
      return index
    }
  }
  // ... non-ASCII fallback
}
// Int32Array direct lookup
// ASCII: O(1) array access
# Faster than Map.get
```

### intern Method

```typescript
intern(char: string): number {
  // ASCII fast-path (see above)
  // Non-ASCII: Map lookup
  const existing = this.stringMap.get(char)
  if (existing !== undefined) return existing  // Already interned
  const index = this.strings.length
  this.strings.push(char)
  this.stringMap.set(char, index)
  return index
}
// Returns index (ID)
# Interned char ID
```

### get Method

```typescript
get(index: number): string {
  return this.strings[index] ?? ' '  // Fallback to space
}
// Lookup by index
# Fallback to space if invalid
```

### Shared Pool Across Screens

```typescript
// Character string pool shared across all screens.
// With a shared pool, interned char IDs are valid across screens,
// so blitRegion can copy IDs directly (no re-interning) and
// diffEach can compare IDs as integers (no string lookup).
// Shared across all screens
// IDs valid across screens
# blitRegion: copy IDs directly
# diffEach: compare IDs as integers
```

### blitRegion Copy IDs

```typescript
// blitRegion can copy IDs directly (no re-interning)
// No string lookup needed
// Direct ID copy
# Memory efficiency
```

### diffEach Compare IDs

```typescript
// diffEach can compare IDs as integers (no string lookup)
// Integer comparison faster than string comparison
// IDs as integers
# Fast diffing
```

## 实现建议

### OpenClaw适配

1. **charPoolClass**: CharPool class
2. **asciiFastPath**: Int32Array ASCII fast-path
3. **sharedPool**: Shared pool across screens
4. **blitRegionCopy**: blitRegion copy IDs pattern
5. **diffEachCompare**: diffEach compare IDs pattern

### 状态文件示例

```json
{
  "stringsCount": 150,
  "asciiCached": 95,
  "sharedPool": true
}
```

## 关键模式

### ASCII Int32Array Fast-Path

```
char.charCodeAt(0) < 128 → this.ascii[code] → O(1) lookup → no Map.get
# ASCII字符用Int32Array直接lookup
# O(1)数组访问
# 比Map.get更快
```

### Shared Pool ID Validity

```
shared pool → IDs valid across screens → blitRegion copy IDs → diffEach compare IDs
# 共享池确保IDs跨screen有效
# blitRegion直接copy IDs
# diffEach整数比较
```

### Pre-Populated Common Chars

```
[' ', ''] → Index 0 space + Index 1 empty spacer → avoid interning common chars
# 预填充space和empty
# 避免频繁interning
# 常用字符预分配
```

### Fallback to Space

```
get(invalid index) → ' ' fallback → safe default
# 无效index返回space
# 安全fallback
```

## 借用价值

- ⭐⭐⭐⭐⭐ CharPool interning pattern
- ⭐⭐⭐⭐⭐ ASCII Int32Array fast-path
- ⭐⭐⭐⭐⭐ Shared pool across screens
- ⭐⭐⭐⭐⭐ blitRegion/diffEach ID optimization
- ⭐⭐⭐⭐ Pre-populated common chars pattern

## 来源

- Claude Code: `ink/screen.ts` (1486 lines)
- 分析报告: P50-1