# withResolvers Polyfill Skill

withResolvers Polyfill - Promise.withResolvers() polyfill + ES2024 feature + Node 18 support + promise/resolve/reject triple + Definite Assignment Assertion + engines constraint workaround。

## 功能概述

从Claude Code的utils/withResolvers.ts提取的Promise polyfill模式，用于OpenClaw的Promise创建。

## 核心机制

### withResolvers Polyfill

```typescript
/**
 * Polyfill for Promise.withResolvers() (ES2024, Node 22+).
 * package.json declares "engines": { "node": ">=18.0.0" }
 * so we can't use the native one.
 */
export function withResolvers<T>(): PromiseWithResolvers<T> {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
// ES2024 Promise.withResolvers() polyfill
// Node 22+ has native, but engines: Node 18+
// Return promise/resolve/reject triple
```

### PromiseWithResolvers Type

```typescript
type PromiseWithResolvers<T> = {
  promise: Promise<T>
  resolve: (value: T | PromiseLike<T>) => void
  reject: (reason?: unknown) => void
}
// Triple return: promise + resolve + reject
// Same as native Promise.withResolvers()
```

### Definite Assignment Assertion

```typescript
let resolve!: (value: T | PromiseLike<T>) => void
let reject!: (reason?: unknown) => void
// ! assertion: definite assignment
// Promise constructor assigns before return
// TypeScript knows they're initialized
```

### Promise Constructor Pattern

```typescript
const promise = new Promise<T>((res, rej) => {
  resolve = res
  reject = rej
})
// Capture resolve/reject from constructor
// Assign to outer variables
// Return triple
```

### Engines Constraint Workaround

```typescript
// package.json declares "engines": { "node": ">=18.0.0" }
// Node 22+ has native Promise.withResolvers()
// But can't use native due to engines constraint
// Polyfill provides same API
// ES2024 feature polyfill
// Node 18 compatibility
```

### Usage Pattern

```typescript
const { promise, resolve, reject } = withResolvers<string>()

// Later: resolve("done") or reject(new Error("failed"))
// await promise
// Triple extraction
// resolve/reject captured
// await promise
```

## 实现建议

### OpenClaw适配

1. **withResolvers**: withResolvers polyfill
2. **promiseTriple**: promise/resolve/reject triple
3. **definiteAssignment**: Definite assignment assertion (!)
4. **enginesWorkaround**: Engines constraint workaround
5. **es2024Polyfill**: ES2024 feature polyfill

### 状态文件示例

```json
{
  "resolved": false,
  "rejected": false,
  "pending": true
}
```

## 关键模式

### Triple Return Pattern

```
{ promise, resolve, reject } → capture resolve/reject → use later
# Promise构造时capture
# 返回triple
# 外部可resolve/reject
```

### Definite Assignment Assertion

```
let resolve!: ... → TypeScript knows assigned → Promise constructor assigns
# !断言definite assignment
# Promise constructor内赋值
# TypeScript编译通过
```

### ES2024 Polyfill Pattern

```
ES2024 feature → Node 22+ native → engines: Node 18 → polyfill
# ES2024新特性
# Node 22+原生支持
# engines限制Node 18
# polyfill兼容
```

### Capture from Constructor

```
new Promise((res, rej) => { resolve = res; reject = rej }) → capture
# Promise构造函数内capture
# 赋值到outer变量
# 返回triple
```

## 借用价值

- ⭐⭐⭐⭐⭐ withResolvers polyfill pattern
- ⭐⭐⭐⭐⭐ Definite assignment assertion (!)
- ⭐⭐⭐⭐⭐ ES2024 feature polyfill
- ⭐⭐⭐⭐ promise/resolve/reject triple
- ⭐⭐⭐⭐ Engines constraint workaround

## 来源

- Claude Code: `utils/withResolvers.ts` (15 lines)
- 分析报告: P48-5