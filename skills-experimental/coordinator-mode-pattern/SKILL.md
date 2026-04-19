# Coordinator Mode Pattern Skill

Coordinator Mode Pattern - isCoordinatorMode + matchSessionMode + INTERNAL_WORKER_TOOLS + isScratchpadGateEnabled + Session Mode Switch + Worker Whitelist + Task Notification XML。

## 功能概述

从Claude Code的coordinator/coordinatorMode.ts提取的协调模式，用于OpenClaw的多Agent协调。

## 核心机制

### isCoordinatorMode

```typescript
export function isCoordinatorMode(): boolean {
  if (feature('COORDINATOR_MODE')) {
    return isEnvTruthy(process.env.CLAUDE_CODE_COORDINATOR_MODE)
  }
  return false
}
// Feature flag + env var check
// Coordinator mode toggle
```

### matchSessionMode

```typescript
/**
 * Checks if current coordinator mode matches session's stored mode.
 * If mismatched, flips env var so isCoordinatorMode() returns correct value.
 * Returns warning message if mode switched, undefined if no switch needed.
 */
export function matchSessionMode(
  sessionMode: 'coordinator' | 'normal' | undefined,
): string | undefined {
  // No stored mode (old session before mode tracking) — do nothing
  if (!sessionMode) return undefined

  const currentIsCoordinator = isCoordinatorMode()
  const sessionIsCoordinator = sessionMode === 'coordinator'

  if (currentIsCoordinator === sessionIsCoordinator) return undefined

  // Flip the env var — isCoordinatorMode() reads it live, no caching
  if (sessionIsCoordinator) {
    process.env.CLAUDE_CODE_COORDINATOR_MODE = '1'
  } else {
    delete process.env.CLAUDE_CODE_COORDINATOR_MODE
  }

  logEvent('tengu_coordinator_mode_switched', {
    to: sessionMode as AnalyticsMetadata,
  })

  return sessionIsCoordinator
    ? 'Entered coordinator mode to match resumed session.'
    : 'Exited coordinator mode to match resumed session.'
}
// Match session mode on resume
// Flip env var if mismatched
# Return warning message
```

### INTERNAL_WORKER_TOOLS

```typescript
const INTERNAL_WORKER_TOOLS = new Set([
  TEAM_CREATE_TOOL_NAME,
  TEAM_DELETE_TOOL_NAME,
  SEND_MESSAGE_TOOL_NAME,
  SYNTHETIC_OUTPUT_TOOL_NAME,
])
// Worker-only tools whitelist
// Coordinator cannot use these
```

### isScratchpadGateEnabled

```typescript
// Checks the same gate as isScratchpadEnabled() in utils/permissions/filesystem.ts.
// Duplicated here because importing filesystem.ts creates circular dependency.
function isScratchpadGateEnabled(): boolean {
  return checkStatsigFeatureGate_CACHED_MAY_BE_STALE('tengu_scratch')
}
// Feature gate check
# Avoid circular dependency
# Duplicate gate check
```

### Session Mode Switch

```typescript
// Flip the env var — isCoordinatorMode() reads it live, no caching
if (sessionIsCoordinator) {
  process.env.CLAUDE_CODE_COORDINATOR_MODE = '1'
} else {
  delete process.env.CLAUDE_CODE_COORDINATOR_MODE
}
// Live env var flip
# No caching
# Immediate effect
```

### Worker Whitelist Pattern

```typescript
const INTERNAL_WORKER_TOOLS = new Set([...])
// Whitelist of tools only workers can use
// Coordinator restricted from these
```

### Task Notification XML (from previous analysis)

```typescript
// Coordinator receives task notifications in XML format
// Workers send task completion notifications
// XML structure for task tracking
```

## 实现建议

### OpenClaw适配

1. **coordinatorMode**: isCoordinatorMode check
2. **matchSessionMode**: Session mode match
3. **workerWhitelist**: INTERNAL_WORKER_TOOLS whitelist
4. **scratchpadGate**: isScratchpadGateEnabled
5. **sessionSwitch**: Session mode switch pattern

### 状态文件示例

```json
{
  "isCoordinator": true,
  "sessionMode": "coordinator",
  "internalWorkerTools": ["team_create", "team_delete"]
}
```

## 关键模式

### Feature + Env Check

```
feature('COORDINATOR_MODE') + process.env → isCoordinatorMode()
// Feature flag + env var组合
// 双重检查
```

### Session Mode Match

```
matchSessionMode(sessionMode) → flip env var → return warning
// 检查session mode是否匹配
// 不匹配则flip env var
// 返回warning message
```

### Worker Whitelist

```
INTERNAL_WORKER_TOOLS Set → worker-only tools → coordinator restricted
// Worker专用tools whitelist
// Coordinator不能使用这些tools
```

### Circular Dependency Avoid

```
Duplicate isScratchpadGateEnabled → avoid importing filesystem.ts → circular dependency
// 复制gate check
// 避免循环依赖
// 直接调用Statsig
```

## 借用价值

- ⭐⭐⭐⭐⭐ matchSessionMode pattern
- ⭐⭐⭐⭐⭐ INTERNAL_WORKER_TOOLS whitelist
- ⭐⭐⭐⭐⭐ Session mode switch pattern
- ⭐⭐⭐⭐ Circular dependency avoidance
- ⭐⭐⭐⭐ Feature + env check pattern

## 来源

- Claude Code: `coordinator/coordinatorMode.ts`
- 分析报告: P47-2