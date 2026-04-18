# Species Encoding Obfuscation Skill

Species Encoding Obfuscation - String.fromCharCode encoding + literal obfuscation + excluded-strings.txt bypass + runtime construction + type cast pattern。

## 功能概述

从Claude Code的buddy/types.ts提取的字符串混淆模式，用于OpenClaw的敏感字符串处理。

## 核心机制

### String.fromCharCode Encoding

```typescript
// One species name collides with a model-codename canary in excluded-strings.txt.
// The check greps build output (not source), so runtime-constructing the value keeps
// the literal out of the bundle while the check stays armed for the actual codename.
// All species encoded uniformly; `as` casts are type-position only (erased pre-bundle).

const c = String.fromCharCode
// biome-ignore format: keep the species list compact

export const duck = c(0x64,0x75,0x63,0x6b) as 'duck'
export const goose = c(0x67, 0x6f, 0x6f, 0x73, 0x65) as 'goose'
export const blob = c(0x62, 0x6c, 0x6f, 0x62) as 'blob'
export const cat = c(0x63, 0x61, 0x74) as 'cat'
export const dragon = c(0x64, 0x72, 0x61, 0x67, 0x6f, 0x6e) as 'dragon'
// Runtime construction via char codes
// Literal not in bundle
// Bypasses excluded-strings.txt grep check
```

### excluded-strings.txt Bypass

```typescript
// The check greps build output (not source)
// Runtime-constructing keeps literal out of bundle
// Check stays armed for actual codename
// Build-time grep bypassed
// Runtime construction pattern
```

### Type Cast Pattern

```typescript
export const duck = c(0x64,0x75,0x63,0x6b) as 'duck'
// `as` casts are type-position only (erased pre-bundle)
// TypeScript knows it's 'duck' type
// Runtime value same as 'duck'
// Type cast erased before bundle
```

### Uniform Encoding

```typescript
// All species encoded uniformly
// Even non-colliding species use same pattern
// Consistency across codebase
// Prevents future canary collisions
```

### Species List Compact

```typescript
// biome-ignore format: keep the species list compact
export const SPECIES = [
  duck,
  goose,
  blob,
  cat,
  dragon,
  octopus,
  owl,
  penguin,
  turtle,
  snail,
  ghost,
  axolotl,
  capybara,
  cactus,
  robot,
  rabbit,
  mushroom,
  chonk,
] as const
// Compact list
// biome-ignore format for readability
// as const for literal type
```

## 实现建议

### OpenClaw适配

1. **charCodeEncoding**: String.fromCharCode编码
2. **literalObfuscation**: 字面量混淆
3. **excludedStringsBypass**: excluded-strings.txt绕过
4. **typeCastPattern**: `as` 类型转换
5. **uniformEncoding**: 统一编码模式

### 状态文件示例

```json
{
  "species": "duck",
  "encoding": [0x64, 0x75, 0x63, 0x6b],
  "decoded": "duck"
}
```

## 关键模式

### Runtime Construction

```
String.fromCharCode(0x64,0x75,0x63,0x6b) → runtime 'duck' → literal not in bundle
// 运行时构造字符串
// 字面量不在bundle中
// 绕过grep检查
```

### Type Cast Erasure

```
as 'duck' → TypeScript type → erased pre-bundle → runtime value unchanged
// TypeScript类型转换
// 编译前擦除
// 运行时值不变
```

### Build Output Grep

```
excluded-strings.txt → grep build output (not source) → runtime construction bypasses
// 检查build output而非source
// runtime构造绕过检查
```

### Uniform Encoding Pattern

```
All species use char codes → even non-colliding → future-proof
// 所有字符串统一编码
// 即使不冲突也编码
// 未来防护
```

## 借用价值

- ⭐⭐⭐⭐⭐ Runtime construction obfuscation
- ⭐⭐⭐⭐⭐ excluded-strings.txt bypass
- ⭐⭐⭐⭐⭐ Type cast erasure pattern
- ⭐⭐⭐⭐ Uniform encoding pattern
- ⭐⭐⭐⭐ String.fromCharCode compact

## 来源

- Claude Code: `buddy/types.ts`
- 分析报告: P45-3