# REPL Pattern Skill

REPL Pattern - useReplBridge + useCostSummary + startBackgroundHousekeeping + consumeEarlyInput + PreventSleep RefCount。

## 功能概述

从Claude Code的REPL.tsx提取的主界面模式，用于OpenClaw的交互界面。

## 核心机制

### useReplBridge

```typescript
import { useReplBridge } from '../hooks/useReplBridge.js'
// Bridge hook for REPL state
// Connect React to backend
// State synchronization
```

### useCostSummary

```typescript
import { useCostSummary } from '../costHook.js'
// Cost summary hook
// Display cost information
// Track usage
```

### startBackgroundHousekeeping

```typescript
import { startBackgroundHousekeeping } from '../utils/backgroundHousekeeping.js'
// Background housekeeping task
// Periodic cleanup
// Maintenance tasks
```

### consumeEarlyInput

```typescript
import { consumeEarlyInput } from '../utils/earlyInput.js'
// Process early input
// Input before render complete
// Speed optimization
```

### PreventSleep RefCount

```typescript
import { startPreventSleep, stopPreventSleep } from '../services/preventSleep.js'
// RefCount pattern for sleep prevention
// Multiple callers supported
// Release on cleanup
```

### useFpsMetrics

```typescript
import { useFpsMetrics } from '../context/fpsMetrics.js'
// FPS metrics context
// Performance monitoring
// Frame rate tracking
```

### useAfterFirstRender

```typescript
import { useAfterFirstRender } from '../hooks/useAfterFirstRender.js'
// After first render hook
// Deferred execution
// Avoid initial render overhead
```

### useDeferredHookMessages

```typescript
import { useDeferredHookMessages } from '../hooks/useDeferredHookMessages.js'
// Deferred hook messages
// Batch hook results
// Reduce render frequency
```

### addToHistory

```typescript
import { addToHistory, removeLastFromHistory, expandPastedTextRefs, parseReferences } from '../history.js'
// History management
// Reference expansion
// Parse pasted text
```

### prependModeCharacterToInput

```typescript
import { prependModeCharacterToInput } from '../components/PromptInput/inputModes.js'
// Mode character prefix
// Input mode indicator
// / for slash commands
```

## 实现建议

### OpenClaw适配

1. **replBridge**: useReplBridge
2. **costSummary**: useCostSummary
3. **backgroundHousekeeping**: startBackgroundHousekeeping
4. **earlyInput**: consumeEarlyInput
5. **preventSleep**: PreventSleep RefCount

### 状态文件示例

```json
{
  "replBridge": true,
  "costSummaryEnabled": true,
  "backgroundHousekeeping": true,
  "earlyInputConsumed": false,
  "preventSleepRefCount": 1
}
```

## 关键模式

### Bridge Hook

```
useReplBridge → React ↔ backend bridge
// React与backend的桥接
// 状态同步
```

### Deferred Hooks

```
useAfterFirstRender + useDeferredHookMessages → deferred execution
// 避免initial render overhead
// Batch处理
```

### Early Input

```
consumeEarlyInput → process before render → speed optimization
// render前处理input
// 速度优化
```

### RefCount Sleep Prevention

```
startPreventSleep + stopPreventSleep → RefCount pattern
// 多caller支持
// Release时decrement
```

### Background Housekeeping

```
startBackgroundHousekeeping → periodic cleanup
// 后台清理任务
// 定期维护
```

## 借用价值

- ⭐⭐⭐⭐⭐ useReplBridge pattern
- ⭐⭐⭐⭐ PreventSleep RefCount
- ⭐⭐⭐⭐ startBackgroundHousekeeping
- ⭐⭐⭐⭐ consumeEarlyInput
- ⭐⭐⭐⭐ Deferred hooks pattern

## 来源

- Claude Code: `screens/REPL.tsx` (4906+ lines)
- 分析报告: P43-4