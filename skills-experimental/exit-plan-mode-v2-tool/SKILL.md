# Exit Plan Mode V2 Tool Skill

退出计划模式工具 - Leader approval + Gate fallback + Mode restore + Plan snapshot。

## 功能概述

从Claude Code的ExitPlanModeV2Tool提取的计划模式退出模式，用于OpenClaw的计划执行。

## 核心机制

### Leader Approval Request

```typescript
if (isTeammate() && isPlanModeRequired()) {
  const approvalRequest = {
    type: 'plan_approval_request',
    from: agentName,
    planFilePath: filePath,
    planContent: plan,
    requestId
  }
  await writeToMailbox('team-lead', { from: agentName, text: jsonStringify(approvalRequest) }, teamName)
  setAwaitingPlanApproval(agentTaskId, context.setAppState, true)
  return { awaitingLeaderApproval: true, requestId }
}
// Teammate → 发送plan_approval_request到leader mailbox
// 设置awaiting状态
```

### Gate Fallback Pattern

```typescript
const prePlanRaw = appState.toolPermissionContext.prePlanMode ?? 'default'
if (prePlanRaw === 'auto' && !isAutoModeGateEnabled()) {
  gateFallbackNotification = getAutoModeUnavailableNotification(reason)
  restoreMode = 'default'  // circuit breaker defense
}
// prePlanMode是auto但gate off → fallback to default
// 防止bypass circuit breaker
```

### Mode Restore + Strip/Restore Permissions

```typescript
let restoreMode = prev.toolPermissionContext.prePlanMode ?? 'default'
const restoringToAuto = restoreMode === 'auto'
let baseContext = prev.toolPermissionContext

if (restoringToAuto) {
  baseContext = stripDangerousPermissionsForAutoMode(baseContext)
} else if (prev.toolPermissionContext.strippedDangerousRules) {
  baseContext = restoreDangerousPermissions(baseContext)
}
// auto → strip dangerous
// 非auto → restore stripped
```

### Plan Snapshot Sync

```typescript
if (inputPlan !== undefined && filePath) {
  await writeFile(filePath, inputPlan, 'utf-8').catch(...)
  void persistFileSnapshotIfRemote()
}
// CCR web UI edited plan → sync to disk
// Snapshot persist
```

### Auto Mode State Management

```typescript
const autoWasUsedDuringPlan = isAutoModeActive()
const finalRestoringAuto = restoreMode === 'auto'
setAutoModeActive(finalRestoringAuto)

if (autoWasUsedDuringPlan && !finalRestoringAuto) {
  setNeedsAutoModeExitAttachment(true)
}
// 记录auto使用状态
// Exit时设置attachment flag
```

### Channels Gate

```typescript
isEnabled() {
  if (getAllowedChannels().length > 0) {
    return false  // Telegram/Discord用户不在TUI，plan dialog会hang
  }
  return true
}
// --channels时禁用
// 防止plan mode trap
```

### Plan Approval Result

```typescript
if (awaitingLeaderApproval) {
  return {
    content: `Your plan has been submitted to team lead for approval.
    **Important:** Do NOT proceed until you receive approval. Check your inbox.
    Request ID: ${requestId}`
  }
}
// Teammate等待leader批准
// 提示check inbox
```

### Edit Detection

```typescript
const planLabel = planWasEdited ? 'Approved Plan (edited by user)' : 'Approved Plan'
// CCR或Ctrl+G编辑 → 标注edited
// 模型知道用户改了内容
```

## 实现建议

### OpenClaw适配

1. **leaderApproval**: Leader批准请求
2. **gateFallback**: Gate fallback
3. **modeRestore**: Mode restore
4. **planSnapshot**: Plan snapshot sync

### 状态文件示例

```json
{
  "awaitingLeaderApproval": true,
  "requestId": "plan_approval@agent@team",
  "planFilePath": "/path/to/plan.md",
  "restoreMode": "default",
  "gateFallback": true
}
```

## 关键模式

### Leader Approval Flow

```
Teammate + plan_mode_required → writeToMailbox → setAwaitingPlanApproval → return awaiting=true
// 异步批准流程
// Inbox通信
```

### Circuit Breaker Defense

```
prePlanMode=auto + gate off → restoreMode=default + notification
// 防止bypass circuit breaker
// Graceful fallback
```

### Permission Strip/Restore

```
auto mode → strip dangerous permissions
exit auto → restore stripped permissions
// 动态permission调整
```

### Channels Trap Prevention

```
getAllowedChannels().length > 0 → disable ExitPlanMode
// 防止plan mode hang
// 非TUI用户安全
```

## 借用价值

- ⭐⭐⭐⭐⭐ Leader approval via mailbox
- ⭐⭐⭐⭐⭐ Circuit breaker defense (gate fallback)
- ⭐⭐⭐⭐⭐ Permission strip/restore pattern
- ⭐⭐⭐⭐⭐ Channels trap prevention
- ⭐⭐⭐⭐ Plan snapshot sync

## 来源

- Claude Code: `tools/ExitPlanModeTool/ExitPlanModeV2Tool.ts` (12KB+)
- 分析报告: P38-26