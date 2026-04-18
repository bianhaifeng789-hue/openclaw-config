# Startup Profiler Pattern Skill

Startup Profiler Pattern - profileCheckpoint + profileReport + startMdmRawRead + startKeychainPrefetch + Prefetch Parallelization + 135ms imports optimization。

## 功能概述

从Claude Code的main.tsx提取的启动优化模式，用于OpenClaw的启动性能。

## 核心机制

### profileCheckpoint Pattern

```typescript
// These side-effects must run before all other imports:
import { profileCheckpoint, profileReport } from './utils/startupProfiler.js';

profileCheckpoint('main_tsx_entry')
// Mark entry before heavy module evaluation
// Profiling checkpoints throughout startup
```

### Prefetch Parallelization

```typescript
// 1. profileCheckpoint marks entry before heavy module evaluation begins
// 2. startMdmRawRead fires MDM subprocesses (plutil/reg query) so they run in
//    parallel with the remaining ~135ms of imports below
// 3. startKeychainPrefetch fires both macOS keychain reads (OAuth + legacy API
//    key) in parallel — isRemoteManagedSettingsEligible() otherwise reads them
//    sequentially via sync spawn inside applySafeConfigEnvironmentVariables()
//    (~65ms on every macOS startup)

// eslint-disable-next-line custom-rules/no-top-level-side-effects
startMdmRawRead();

// eslint-disable-next-line custom-rules/no-top-level-side-effects
startKeychainPrefetch();
// MDM subprocesses parallel with imports (~135ms)
// Keychain reads parallel (~65ms saved)
// Side-effects BEFORE imports
```

### ensureKeychainPrefetchCompleted

```typescript
import { ensureKeychainPrefetchCompleted, startKeychainPrefetch } from './utils/secureStorage/keychainPrefetch.js';

startKeychainPrefetch()  // Fire async
// ... later ...
ensureKeychainPrefetchCompleted()  // Wait for result
// Fire async early
// Wait later when needed
// Parallel execution
```

### Lazy Require Pattern

```typescript
// Lazy require to avoid circular dependency: teammate.ts -> AppState.tsx -> ... -> main.tsx
/* eslint-disable @typescript-eslint/no-require-imports */
const getTeammateUtils = () => require('./utils/teammate.js') as typeof import('./utils/teammate.js')
const getTeammatePromptAddendum = () => require('./utils/swarm/teammatePromptAddendum.js')
const getTeammateModeSnapshot = () => require('./utils/swarm/backends/teammateModeSnapshot.js')
/* eslint-enable @typescript-eslint/no-require-imports */
// Function returning require
// Avoid circular dependency
// Type cast with typeof import
```

### Dead Code Elimination Pattern

```typescript
// Dead code elimination: conditional import for COORDINATOR_MODE
const coordinatorModeModule = feature('COORDINATOR_MODE') 
  ? require('./coordinator/coordinatorMode.js') as typeof import('./coordinator/coordinatorMode.js') 
  : null

// Dead code elimination: conditional import for KAIROS (assistant mode)
const assistantModule = feature('KAIROS') 
  ? require('./assistant/index.js') as typeof import('./assistant/index.js') 
  : null
const kairosGate = feature('KAIROS') 
  ? require('./assistant/gate.js') as typeof import('./assistant/gate.js') 
  : null
// Bun compiler eliminates false branches
// No module included in external builds
// typeof import type cast
```

### seedEarlyInput Pattern

```typescript
import { seedEarlyInput, stopCapturingEarlyInput } from './utils/earlyInput.js';

// Seed early input before render
// Stop capturing after render
// Speed optimization
```

## 实现建议

### OpenClaw适配

1. **profileCheckpoint**: 启动profiling
2. **prefetchParallel**: 并行prefetch
3. **lazyRequire**: Lazy require避免循环依赖
4. **deadCodeElim**: Feature条件导入
5. **earlyInput**: 早期输入处理

### 状态文件示例

```json
{
  "startupProfile": {
    "main_tsx_entry": 0,
    "imports_complete": 135
  },
  "prefetchStarted": {
    "mdm": true,
    "keychain": true
  }
}
```

## 关键模式

### Prefetch Before Imports

```
startMdmRawRead() + startKeychainPrefetch() → parallel with 135ms imports
// imports前启动prefetch
// 并行执行节省65ms
```

### profileCheckpoint Chain

```
profileCheckpoint('main_tsx_entry') → profileCheckpoint('imports') → profileReport()
// 多checkpoint标记
// 最后生成报告
```

### Lazy Require Function

```
const getModule = () => require('./module.js') as typeof import(...)
// 函数包装require
// 避免循环依赖
// typeof import类型
```

### Dead Code Elimination

```
feature('X') ? require('./module.js') : null → Bun compiler eliminates false branch
// Bun编译器消除false分支
// 外部build不包含module
```

## 借用价值

- ⭐⭐⭐⭐⭐ Prefetch parallelization (65ms saved)
- ⭐⭐⭐⭐⭐ profileCheckpoint pattern
- ⭐⭐⭐⭐⭐ Lazy require avoid circular dependency
- ⭐⭐⭐⭐⭐ Dead code elimination pattern
- ⭐⭐⭐⭐ seedEarlyInput speed optimization

## 来源

- Claude Code: `main.tsx` (4683 lines)
- 分析报告: P45-1