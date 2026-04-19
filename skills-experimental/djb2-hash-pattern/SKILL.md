# djb2 Hash Pattern Skill

djb2 Hash Pattern - djb2Hash function + signed 32-bit int + hash << 5 - hash + charCode | 0 + fast non-cryptographic + deterministic cross-runtime + Bun.hash fallback + hashContent + hashPair seed-chain + wyhash vs SHA-256。

## 功能概述

从Claude Code的utils/hash.ts提取的djb2 hash模式，用于OpenClaw的快速哈希计算。

## 核心机制

### djb2Hash Function

```typescript
export function djb2Hash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return hash
}
// djb2 string hash
# Signed 32-bit int
# Fast non-cryptographic
```

### signed 32-bit int

```typescript
| 0  // Convert to signed 32-bit integer
// JavaScript bitwise OR coerces to 32-bit signed int
# Prevents overflow
# Deterministic across runtimes
```

### hash << 5 - hash + charCode

```typescript
hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
// hash * 33 + charCode (equivalent to << 5 - hash)
# djb2 algorithm
# Daniel J. Bernstein hash
```

### fast Non-Cryptographic

```typescript
// djb2 string hash — fast non-cryptographic hash returning a signed 32-bit int.
// ~100x faster than SHA-256
// Not crypto-safe (collision-prone)
# Speed over security
```

### deterministic Cross-Runtime

```typescript
// Deterministic across runtimes (unlike Bun.hash which uses wyhash)
// Use as a fallback when Bun.hash isn't available
// Or when you need on-disk-stable output (e.g. cache directory names)
// Same hash across Bun, Node, browsers
# On-disk-stable
```

### Bun.hash Fallback

```typescript
export function hashContent(content: string): string {
  if (typeof Bun !== 'undefined') {
    return Bun.hash(content).toString()  // ~100x faster
  }
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(content).digest('hex')  // Fallback
}
// Bun.hash ~100x faster than SHA-256
# Node fallback to SHA-256
```

### hashContent Function

```typescript
// Hash arbitrary content for change detection
// Bun.hash is ~100x faster than sha256
// Collision-resistant enough for diff detection (not crypto-safe)
// For diff/change detection
# Not crypto-safe
```

### hashPair Seed-Chain

```typescript
export function hashPair(a: string, b: string): string {
  if (typeof Bun !== 'undefined') {
    return Bun.hash(b, Bun.hash(a)).toString()  // Seed-chain
  }
  const crypto = require('crypto')
  return crypto
    .createHash('sha256')
    .update(a)
    .update('\0')  // Separator for Node
    .update(b)
    .digest('hex')
}
// Bun: seed-chain wyhash
# Node: incremental SHA-256 with separator
```

### wyhash vs SHA-256

```typescript
// Bun.hash uses wyhash (fast)
// Node uses SHA-256 (slow but standard)
// wyhash: ~100x faster than SHA-256
// SHA-256: crypto-safe (but slower)
# Bun: wyhash fast
# Node: SHA-256 safe
```

### Separator-free Seed-Chain

```typescript
// Bun path seed-chains wyhash (hash(a) feeds as seed to hash(b))
// Naturally disambiguates ("ts","code") vs ("tsc","ode")
// No separator needed under Bun
// Seed-chain disambiguates
# No separator
```

### Node Separator

```typescript
// Node path uses incremental SHA-256 update
// .update('\0') separator needed
// Separator prevents collisions
# '\0' separator for Node
```

## 实现建议

### OpenClaw适配

1. **djb2Hash**: djb2Hash function
2. **signed32bit**: Signed 32-bit int pattern
3. **deterministicHash**: Deterministic cross-runtime
4. **bunHashFallback**: Bun.hash fallback pattern
5. **hashPairSeedChain**: hashPair seed-chain pattern

### 状态文件示例

```json
{
  "djb2Hash": 1234567890,
  "hashContent": "abc123",
  "runtime": "bun"
}
```

## 关键模式

### djb2 Algorithm

```
hash << 5 - hash + charCode | 0 → hash * 33 + char → signed 32-bit → fast non-crypto
# djb2算法
# hash * 33 + charCode
# | 0转signed 32-bit
```

### Cross-Runtime Determinism

```
djb2Hash: same result in Bun/Node/Browser | Bun.hash: wyhash runtime-specific
# djb2跨runtime确定性
# Bun.hash使用wyhash（runtime-specific）
```

### Bun.hash ~100x Faster

```
Bun.hash(content) → wyhash → ~100x faster than SHA-256 → change detection
# Bun.hash快100倍
# wyhash算法
# change detection用途
```

### Seed-Chain Disambiguation

```
Bun.hash(b, Bun.hash(a)) → seed-chain → ("ts","code") ≠ ("tsc","ode") → no separator
# Bun seed-chain disambiguates
# 无需separator
# wyhash特性
```

### Node Separator vs Bun None

```
Node: update('\0') separator | Bun: seed-chain no separator → different handling
# Node需要separator
# Bun不需要
# 不同处理方式
```

## 借用价值

- ⭐⭐⭐⭐⭐ djb2Hash fast non-crypto pattern
- ⭐⭐⭐⭐⭐ Signed 32-bit int coercion
- ⭐⭐⭐⭐⭐ Cross-runtime determinism
- ⭐⭐⭐⭐⭐ Bun.hash ~100x faster fallback
- ⭐⭐⭐⭐⭐ hashPair seed-chain pattern

## 来源

- Claude Code: `utils/hash.ts` (46 lines)
- 分析报告: P52-4