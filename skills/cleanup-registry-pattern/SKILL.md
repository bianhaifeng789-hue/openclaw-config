# Cleanup Registry Pattern Skill

Cleanup Registry Pattern - cleanupFunctions Set + registerCleanup + unregister return + runCleanupFunctions + Promise.all + global registry + graceful shutdown support + circular dependency avoidance + async cleanup + Set.add/delete。

## 功能概述

从Claude Code的utils/cleanupRegistry.ts提取的Cleanup registry模式，用于OpenClaw的清理函数管理。

## 核心机制

### cleanupFunctions Set

```typescript
const cleanupFunctions = new Set<() => Promise<void>>()
// Global registry for cleanup functions
# Set of async cleanup functions
```

### registerCleanup Function

```typescript
export function registerCleanup(cleanupFn: () => Promise<void>): () => void {
  cleanupFunctions.add(cleanupFn)
  return () => cleanupFunctions.delete(cleanupFn)  // Return unregister function
}
// Register cleanup function
# Return unregister function
```

### unregister Return

```typescript
return () => cleanupFunctions.delete(cleanupFn)  // Return unregister function
// Unregister cleanup handler
# Remove from Set
# Function identity check
```

### runCleanupFunctions

```typescript
export async function runCleanupFunctions(): Promise<void> {
  await Promise.all(Array.from(cleanupFunctions).map(fn => fn()))
}
// Run all registered cleanup functions
# Used by gracefulShutdown
```

### Promise.all Execution

```typescript
await Promise.all(Array.from(cleanupFunctions).map(fn => fn()))
// Execute all cleanup functions in parallel
# Promise.all for concurrent execution
```

### global Registry

```typescript
// Global registry for cleanup functions
// Separate from gracefulShutdown.ts to avoid circular dependencies
# Global Set
# Module isolation
```

### graceful Shutdown Support

```typescript
// Used internally by gracefulShutdown
// Cleanup functions run during shutdown
# Shutdown hook
```

### circular Dependency Avoidance

```typescript
// This module is separate from gracefulShutdown.ts to avoid circular dependencies
// cleanupRegistry.ts ← gracefulShutdown.ts (import runCleanupFunctions)
# Separate module
# Avoid circular import
```

### async Cleanup

```typescript
cleanupFn: () => Promise<void>
// Async cleanup functions
# Can be sync or async
# Promise<void> return
```

### Set.add/delete

```typescript
cleanupFunctions.add(cleanupFn)  // Register
cleanupFunctions.delete(cleanupFn)  // Unregister
// Set operations
# add for register
# delete for unregister
```

## 实现建议

### OpenClaw适配

1. **cleanupRegistry**: cleanupFunctions Set
2. **registerCleanup**: registerCleanup function
3. **unregisterReturn**: Unregister return pattern
4. **runCleanupFunctions**: runCleanupFunctions execution
5. **circularAvoidance**: Circular dependency avoidance

### 状态文件示例

```json
{
  "cleanupCount": 5,
  "cleanupFunctions": ["fn1", "fn2", "fn3", "fn4", "fn5"]
}
```

## 关键模式

### Register + Return Unregister

```
registerCleanup(fn) → add to Set → return () => delete → unregister pattern
# register添加到Set
# 返回unregister函数
# delete移除
```

### Promise.all Parallel Execution

```
Promise.all(Array.from(set).map(fn => fn())) → parallel execution → concurrent cleanup
# Promise.all并行执行
# 所有cleanup functions并发
# 快速shutdown
```

### Global Set Registry

```
new Set<() => Promise<void>>() → global registry → module isolation → circular avoidance
# global Set registry
# 模块隔离
# 避免circular dependency
```

### Separate Module for Circular

```
cleanupRegistry.ts ← gracefulShutdown.ts → avoid circular → import only runCleanupFunctions
# cleanupRegistry独立模块
# gracefulShutdown导入runCleanupFunctions
# 无circular dependency
```

### Set Function Identity

```
Set.add(fn) → identity check → Set.delete(fn) → exact same function → reference equality
# Set使用function identity
# add/delete使用相同function reference
# reference equality
```

## 借用价值

- ⭐⭐⭐⭐ Cleanup registry pattern
- ⭐⭐⭐⭐⭐ Register + return unregister pattern
- ⭐⭐⭐⭐⭐ Promise.all parallel execution
- ⭐⭐⭐⭐⭐ Global Set registry pattern
- ⭐⭐⭐⭐⭐ Circular dependency avoidance

## 来源

- Claude Code: `utils/cleanupRegistry.ts` (25 lines)
- 分析报告: P52-6