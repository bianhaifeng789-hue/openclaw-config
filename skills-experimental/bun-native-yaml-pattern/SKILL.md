# Bun Native YAML Pattern Skill

Bun Native YAML Pattern - parseYaml + typeof Bun !== 'undefined' guard + Bun.YAML.parse zero-cost + require('yaml') fallback + lazy-require non-Bun branch + ~270KB yaml parser avoided + native builds never load npm package + built-in YAML parser。

## 功能概述

从Claude Code的utils/yaml.ts提取的Bun native YAML模式，用于OpenClaw的YAML解析。

## 核心机制

### parseYaml

```typescript
export function parseYaml(input: string): unknown {
  if (typeof Bun !== 'undefined') {
    return Bun.YAML.parse(input)
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('yaml') as typeof import('yaml')).parse(input)
}
// Parse YAML
# Bun native: zero-cost
# Node: require('yaml')
```

### typeof Bun !== 'undefined' guard

```typescript
if (typeof Bun !== 'undefined') {
  // Bun runtime
  return Bun.YAML.parse(input)
}
// Bun runtime guard
# typeof Bun !== 'undefined'
# Runtime detection
```

### Bun.YAML.parse zero-cost

```typescript
return Bun.YAML.parse(input)
// Bun.YAML.parse
# Built-in YAML parser
# Zero-cost native
# No npm package
```

### require('yaml') fallback

```typescript
// eslint-disable-next-line @typescript-eslint/no-require-imports
return (require('yaml') as typeof import('yaml')).parse(input)
// require('yaml') fallback
# Node runtime
# npm package
```

### lazy-require non-Bun branch

```typescript
// The package is lazy-required inside the non-Bun branch so native Bun builds
// never load the ~270KB yaml parser.
// Lazy-require
# Inside non-Bun branch
# Native builds never load
```

### ~270KB yaml parser avoided

```typescript
// ~270KB yaml parser
# npm package size
# Native Bun builds avoid
# Zero-cost built-in
```

### native builds never load npm package

```typescript
// Native Bun builds never load the ~270KB yaml parser
// Native builds
# Never load npm package
# Built-in parser
```

### built-in YAML parser

```typescript
// Bun has built-in YAML parser
# Bun.YAML.parse
# Zero-cost
# Native implementation
```

## 实现建议

### OpenClaw适配

1. **bunNativeYaml**: parseYaml + Bun.YAML pattern
2. **runtimeGuard**: typeof Bun !== 'undefined' guard pattern
3. **lazyRequire**: lazy-require non-Bun branch pattern
4. **npmPackageAvoid**: ~270KB yaml parser avoided pattern
5. **zeroCostNative**: built-in YAML parser pattern

### 状态文件示例

```json
{
  "runtime": "bun",
  "parser": "Bun.YAML.parse",
  "zeroCost": true
}
```

## 关键模式

### typeof Bun Runtime Guard

```
typeof Bun !== 'undefined' → Bun runtime | else → Node runtime → runtime detection
# typeof Bun runtime guard
# Bun vs Node detection
```

### Bun.YAML.parse Zero-Cost

```
Bun.YAML.parse(input) → built-in → zero-cost → no npm package → native implementation
# Bun.YAML.parse zero-cost
# built-in parser
# no npm package
```

### lazy-require Inside Non-Bun

```
require('yaml') inside non-Bun branch → lazy require → native builds never load → ~270KB avoided
# lazy-require inside non-Bun
# native builds never load
# ~270KB avoided
```

### Native Builds Avoid npm

```
native Bun builds → never load yaml npm → zero-cost built-in → startup optimization
# native builds avoid npm
# startup optimization
# zero-cost built-in
```

### Runtime-Specific Parser

```
Bun → Bun.YAML.parse | Node → require('yaml').parse → runtime-specific → optimal parser
# runtime-specific parser
# Bun: built-in
# Node: npm package
```

## 借用价值

- ⭐⭐⭐⭐⭐ typeof Bun runtime guard pattern
- ⭐⭐⭐⭐⭐ Bun.YAML.parse zero-cost pattern
- ⭐⭐⭐⭐⭐ lazy-require inside non-Bun pattern
- ⭐⭐⭐⭐⭐ native builds avoid npm pattern
- ⭐⭐⭐⭐ Runtime-specific parser pattern

## 来源

- Claude Code: `utils/yaml.ts` (19 lines)
- 分析报告: P57-4