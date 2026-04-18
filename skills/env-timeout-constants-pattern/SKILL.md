# Env Timeout Constants Pattern Skill

Env Timeout Constants Pattern - getDefaultBashTimeoutMs + getMaxBashTimeoutMs + env parameter injection + EnvLike type + parseInt NaN check > 0 + Math.max ensure max >= default + DEFAULT_TIMEOUT_MS 120_000 + MAX_TIMEOUT_MS 600_000 + configurable constants。

## 功能概述

从Claude Code的utils/timeouts.ts提取的Env timeout constants模式，用于OpenClaw的超时配置。

## 核心机制

### getDefaultBashTimeoutMs

```typescript
export function getDefaultBashTimeoutMs(env: EnvLike = process.env): number {
  const envValue = env.BASH_DEFAULT_TIMEOUT_MS
  if (envValue) {
    const parsed = parseInt(envValue, 10)
    if (!isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return DEFAULT_TIMEOUT_MS
}
// Get default timeout from env or default
# BASH_DEFAULT_TIMEOUT_MS env var
# Falls back to DEFAULT_TIMEOUT_MS
```

### getMaxBashTimeoutMs

```typescript
export function getMaxBashTimeoutMs(env: EnvLike = process.env): number {
  const envValue = env.BASH_MAX_TIMEOUT_MS
  if (envValue) {
    const parsed = parseInt(envValue, 10)
    if (!isNaN(parsed) && parsed > 0) {
      // Ensure max is at least as large as default
      return Math.max(parsed, getDefaultBashTimeoutMs(env))
    }
  }
  // Always ensure max is at least as large as default
  return Math.max(MAX_TIMEOUT_MS, getDefaultBashTimeoutMs(env))
}
// Get max timeout from env or max
# BASH_MAX_TIMEOUT_MS env var
# Ensure max >= default
```

### env Parameter Injection

```typescript
env: EnvLike = process.env
// Inject env for testing
# Default to process.env
# Test can inject custom env
```

### EnvLike Type

```typescript
type EnvLike = Record<string, string | undefined>
// Env object type
# Record<string, string | undefined>
# Flexible for testing
```

### parseInt NaN check > 0

```typescript
const parsed = parseInt(envValue, 10)
if (!isNaN(parsed) && parsed > 0) {
  return parsed
}
// parseInt validation
# NaN check
# > 0 check (positive)
# Invalid → fall back
```

### Math.max ensure max >= default

```typescript
return Math.max(parsed, getDefaultBashTimeoutMs(env))
// Ensure max >= default
# Never return max smaller than default
# Math.max safeguard
```

### DEFAULT_TIMEOUT_MS 120_000

```typescript
const DEFAULT_TIMEOUT_MS = 120_000 // 2 minutes
// Default timeout: 2 minutes
# 120_000 ms
```

### MAX_TIMEOUT_MS 600_000

```typescript
const MAX_TIMEOUT_MS = 600_000 // 10 minutes
// Max timeout: 10 minutes
# 600_000 ms
```

### configurable Constants

```typescript
// Constants configurable via env
# BASH_DEFAULT_TIMEOUT_MS
# BASH_MAX_TIMEOUT_MS
# Runtime configurable
```

## 实现建议

### OpenClaw适配

1. **envTimeout**: getDefaultBashTimeoutMs + getMaxBashTimeoutMs pattern
2. **envInjection**: env parameter injection pattern
3. **parseIntValidation**: parseInt NaN + > 0 check pattern
4. **maxDefaultEnsure**: Math.max ensure max >= default pattern
5. **configurableConstants**: configurable constants via env pattern

### 状态文件示例

```json
{
  "defaultTimeout": 120000,
  "maxTimeout": 600000,
  "envDefault": "300000",
  "envMax": "900000"
}
```

## 关键模式

### env Parameter Injection Testing

```
env: EnvLike = process.env → default process.env | test inject custom env → testable
# env parameter injection
# 默认process.env
# test inject custom env
```

### parseInt Validation NaN + > 0

```
parseInt(envValue, 10) → isNaN check → > 0 check → invalid → fall back to default
# parseInt validation
# NaN check + > 0 check
# invalid时fall back
```

### Math.max Ensure max >= default

```
Math.max(parsed, getDefaultBashTimeoutMs(env)) → never smaller → safeguard → max >= default
# Math.max确保max >= default
# never return smaller
# safeguard
```

### Configurable Constants via Env

```
DEFAULT_TIMEOUT_MS + BASH_DEFAULT_TIMEOUT_MS env → configurable → runtime adjustable → no code change
# configurable constants via env
# runtime adjustable
# no code change needed
```

### EnvLike Type Flexible

```
type EnvLike = Record<string, string | undefined> → flexible → test mock → not tied to process.env
# EnvLike type flexible
# test mock
# 不依赖process.env
```

## 借用价值

- ⭐⭐⭐⭐⭐ env parameter injection testing pattern
- ⭐⭐⭐⭐⭐ parseInt validation NaN + > 0 pattern
- ⭐⭐⭐⭐⭐ Math.max ensure max >= default pattern
- ⭐⭐⭐⭐⭐ Configurable constants via env pattern
- ⭐⭐⭐⭐⭐ EnvLike type flexible pattern

## 来源

- Claude Code: `utils/timeouts.ts` (58 lines)
- 分析报告: P56-5