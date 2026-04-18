# Init Pattern Skill

Init Pattern - memoize async function + profileCheckpoint chain + enableConfigs + applySafeConfigEnvironmentVariables + setupGracefulShutdown + preconnectAnthropicApi。

## 功能概述

从Claude Code的entrypoints/init.ts提取的初始化模式，用于OpenClaw的启动流程。

## 核心机制

### memoize Async Function

```typescript
import memoize from 'lodash-es/memoize.js'

export const init = memoize(async (): Promise<void> => {
  const initStartTime = Date.now()
  logForDiagnosticsNoPII('info', 'init_started')
  profileCheckpoint('init_function_start')
  // ... initialization logic
})
// Single initialization (memoized)
// Prevent duplicate init calls
// Async function memoization
```

### profileCheckpoint Chain

```typescript
profileCheckpoint('init_function_start')
profileCheckpoint('init_configs_enabled')
profileCheckpoint('init_safe_env_vars_applied')
profileCheckpoint('init_after_graceful_shutdown')
// Multiple checkpoints
// Track timing at each stage
// Performance profiling
```

### enableConfigs

```typescript
const configsStart = Date.now()
enableConfigs()
logForDiagnosticsNoPII('info', 'init_configs_enabled', {
  duration_ms: Date.now() - configsStart,
})
// Enable configuration system
// Log duration for diagnostics
// Performance tracking
```

### applySafeConfigEnvironmentVariables

```typescript
// Apply only safe environment variables before trust dialog
// Full environment variables are applied after trust is established
const envVarsStart = Date.now()
applySafeConfigEnvironmentVariables()
applyExtraCACertsFromConfig()
logForDiagnosticsNoPII('info', 'init_safe_env_vars_applied', {
  duration_ms: Date.now() - envVarsStart,
})
// Safe env vars before trust
// Full env vars after trust
// Two-phase application
```

### setupGracefulShutdown

```typescript
// Make sure things get flushed on exit
setupGracefulShutdown()
profileCheckpoint('init_after_graceful_shutdown')
// Flush on exit
// Graceful shutdown handling
// Cleanup registered
```

### applyExtraCACertsFromConfig

```typescript
// Apply NODE_EXTRA_CA_CERTS from settings.json to process.env early,
// before any TLS connections. Bun caches the TLS cert store at boot
// via BoringSSL, so this must happen before the first TLS handshake.
applyExtraCACertsFromConfig()
// TLS certs before handshake
// Bun BoringSSL cache
// Early TLS configuration
```

### Lazy Import Pattern

```typescript
// initializeTelemetry is loaded lazily via import() to defer
// ~400KB of OpenTelemetry + protobuf modules until telemetry is actually initialized.
// gRPC exporters (~700KB via @grpc/grpc-js) are further lazy-loaded.

void Promise.all([
  import('../services/analytics/firstPartyEventLogger.js'),
  import('../services/analytics/growthbook.js'),
]).then(([fp, gb]) => {
  fp.initialize1PEventLogging()
  // ...
})
// Lazy import for large modules
// Deferred loading
// ~400KB OpenTelemetry + protobuf
// ~700KB gRPC exporters
```

## 实现建议

### OpenClaw适配

1. **memoizeAsync**: memoize async function pattern
2. **profileCheckpointChain**: 多checkpoint profiling
3. **safeEnvVars**: Safe env vars before trust
4. **gracefulShutdown**: setupGracefulShutdown
5. **lazyImport**: Deferred import for large modules

### 状态文件示例

```json
{
  "initStartTime": 1744400000,
  "configsEnabled": true,
  "safeEnvVarsApplied": true,
  "gracefulShutdownSetup": true
}
```

## 关键模式

### Memoized Async Init

```
memoize(async () => ...) → single initialization → prevent duplicate calls
// async function memoization
// 单次初始化
// 防止重复调用
```

### Two-Phase Env Vars

```
applySafeConfigEnvironmentVariables() → before trust
applyConfigEnvironmentVariables() → after trust
// 两阶段env vars应用
// 安全vars先应用
// 完整vars后应用
```

### TLS Cert Early Application

```
applyExtraCACertsFromConfig() → before TLS handshake → Bun BoringSSL cache
// TLS certs必须在第一次handshake前
// Bun缓存BoringSSL cert store
```

### Lazy Import Deferred Loading

```
import('../largeModule.js') → deferred → ~400KB OpenTelemetry + ~700KB gRPC
// 大模块延迟加载
// telemetry相关模块deferred
// 减少启动时间
```

## 借用价值

- ⭐⭐⭐⭐⭐ memoize async function pattern
- ⭐⭐⭐⭐⭐ Two-phase env vars (safe before trust)
- ⭐⭐⭐⭐⭐ TLS cert early application (Bun BoringSSL)
- ⭐⭐⭐⭐⭐ Lazy import deferred loading (~1.1MB saved)
- ⭐⭐⭐⭐ profileCheckpoint chain

## 来源

- Claude Code: `entrypoints/init.ts`
- 分析报告: P46-1