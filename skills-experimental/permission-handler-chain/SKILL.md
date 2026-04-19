# Permission Handler Chain Skill

权限处理链 - Handler chain pattern + Speculative classifier race + Coordinator gate + Swarm worker mailbox。

## 功能概述

从Claude Code的useCanUseTool hook提取的权限处理模式，用于OpenClaw的权限系统。

## 核心机制

### Handler Chain Pattern

```typescript
// 1. Coordinator handler (awaitAutomatedChecksBeforeDialog)
const coordinatorDecision = await handleCoordinatorPermission({ ctx, pendingClassifierCheck, ... })
if (coordinatorDecision) { resolve(coordinatorDecision); return }

// 2. Swarm worker handler (mailbox forwarding)
const swarmDecision = await handleSwarmWorkerPermission({ ctx, description, ... })
if (swarmDecision) { resolve(swarmDecision); return }

// 3. Interactive handler (show dialog)
handleInteractivePermission({ ctx, description, result, bridgeCallbacks, channelCallbacks }, resolve)
// Sequential handlers
// Early return if resolved
```

### Speculative Classifier Race

```typescript
const speculativePromise = peekSpeculativeClassifierCheck(command)
if (speculativePromise) {
  const raceResult = await Promise.race([
    speculativePromise.then(r => ({ type: 'result', result: r })),
    new Promise(res => setTimeout(res, 2000, { type: 'timeout' }))
  ])
  if (raceResult.type === 'result' && raceResult.result.matches && raceResult.result.confidence === 'high') {
    consumeSpeculativeClassifierCheck(command)
    resolve(ctx.buildAllow(input, { decisionReason: { type: 'classifier', classifier: 'bash_allow' } }))
    return
  }
}
// 2s grace period for classifier
// Skip dialog if high confidence match
```

### Coordinator Gate

```typescript
if (appState.toolPermissionContext.awaitAutomatedChecksBeforeDialog) {
  const coordinatorDecision = await handleCoordinatorPermission({ ctx, ... })
  if (coordinatorDecision) { resolve(coordinatorDecision); return }
}
// Background workers → await automated checks before showing dialog
// Only interrupt when automated checks can't decide
```

### Swarm Worker Mailbox

```typescript
const swarmDecision = await handleSwarmWorkerPermission({ ctx, description, pendingClassifierCheck })
if (swarmDecision) { resolve(swarmDecision); return }
// Swarm worker → try classifier auto-approval → forward to leader via mailbox
```

### Abort Check Pattern

```typescript
if (ctx.resolveIfAborted(resolve)) return
// Check abort before each async operation
// Prevents stale dialog
```

### Auto Mode Denial Tracking

```typescript
if (result.decisionReason?.type === 'classifier' && result.decisionReason.classifier === 'auto-mode') {
  recordAutoModeDenial({ toolName, display, reason, timestamp })
  toolUseContext.addNotification?.({
    key: 'auto-mode-denied',
    priority: 'immediate',
    jsx: <><Text color="error">{tool.userFacingName(input).toLowerCase()} denied by auto mode</Text><Text dimColor> · /permissions</Text></>
  })
}
// Track auto mode denials
// Show notification
```

### Force Decision Override

```typescript
const decisionPromise = forceDecision !== undefined
  ? Promise.resolve(forceDecision)
  : hasPermissionsToUseTool(tool, input, toolUseContext, assistantMessage, toolUseID)
// Allow force decision bypass
// Used by rewind, etc.
```

## 实现建议

### OpenClaw适配

1. **handlerChain**: Handler chain pattern
2. **speculativeRace**: Speculative classifier race
3. **coordinatorGate**: Coordinator gate
4. **abortCheck**: Abort check pattern

### 状态文件示例

```json
{
  "handlers": ["coordinator", "swarmWorker", "interactive"],
  "speculativeTimeout": 2000,
  "awaitAutomatedChecks": true
}
```

## 关键模式

### Handler Chain Early Return

```
handler → if (decision) resolve+return → next handler
// Sequential processing
// Early exit on resolution
```

### Speculative Classifier Grace

```
Promise.race([classifier, timeout(2s)])
// 等待classifier最多2s
// High confidence → skip dialog
```

### Coordinator Background Gate

```
awaitAutomatedChecksBeforeDialog → coordinator handler → only interrupt if can't decide
// Background workers不打断用户
// 自动检查失败才interrupt
```

### Abort Check Before Async

```
await something → if (ctx.resolveIfAborted(resolve)) return
// 每个async后检查abort
// 防止stale state
```

## 借用价值

- ⭐⭐⭐⭐⭐ Handler chain pattern
- ⭐⭐⭐⭐⭐ Speculative classifier race (2s grace)
- ⭐⭐⭐⭐⭐ Coordinator background gate
- ⭐⭐⭐⭐⭐ Abort check before async
- ⭐⭐⭐⭐ Auto mode denial tracking

## 来源

- Claude Code: `hooks/useCanUseTool.tsx`
- 分析报告: P39-6