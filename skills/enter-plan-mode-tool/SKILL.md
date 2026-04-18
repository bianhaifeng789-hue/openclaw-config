# Enter Plan Mode Tool Skill

Plan mode切换工具 - Permission transition + Interview phase + MetaMessages injection。

## 功能概述

从Claude Code的EnterPlanModeTool提取的plan模式，用于OpenClaw的探索-计划模式。

## 核心机制

### Permission Transition

```typescript
handlePlanModeTransition(mode, 'plan')
context.setAppState(prev => ({
  ...prev,
  toolPermissionContext: applyPermissionUpdate(
    prepareContextForPlanMode(prev.toolPermissionContext),
    { type: 'setMode', mode: 'plan', destination: 'session' }
  )
}))
// 切换permission mode
// prepareContextForPlanMode runs classifier activation
```

### Interview Phase

```typescript
if (isPlanModeInterviewPhaseEnabled()) {
  return `DO NOT write or edit any files except the plan file. 
          Detailed workflow instructions will follow.`
}
// Interview phase启用时
// 只允许编辑plan file
```

### Mode Gate

```typescript
isEnabled() {
  if (feature('KAIROS_CHANNELS') && getAllowedChannels().length > 0) {
    return false  // ExitPlanMode disabled, so disable entry too
  }
  return true
}
// --channels模式禁用plan mode
// 避免trap（进不去出不来）
```

### Agent Context Block

```typescript
if (context.agentId) {
  throw new Error('EnterPlanMode tool cannot be used in agent contexts')
}
// Agent不能进入plan mode
// 只有main session可以
```

### Concurrency Safe

```typescript
isConcurrencySafe() { return true }
isReadOnly() { return true }
// Plan mode切换是并发安全
// 不修改文件
```

## 实现建议

### OpenClaw适配

1. **transition**: Permission mode切换
2. **interviewPhase**: Optional阶段
3. **gate**: Mode启用检查
4. **agentBlock**: Agent限制

### 状态文件示例

```json
{
  "previousMode": "default",
  "newMode": "plan",
  "interviewPhase": false,
  "agentBlocked": false
}
```

## 关键模式

### Permission Transition Chain

```
handlePlanModeTransition → prepareContext → applyPermissionUpdate → setAppState
// 链式更新
// Classifier activation side effects
```

### Trap Prevention

```
ExitPlanMode disabled → EnterPlanMode disabled
// 避免用户被困在plan mode
```

### Interview Phase Pattern

```
Gate enabled → Restrict to plan file only
// Optional workflow phase
// 等待详细指令
```

## 借用价值

- ⭐⭐⭐⭐⭐ Permission transition chain
- ⭐⭐⭐⭐⭐ Interview phase pattern
- ⭐⭐⭐⭐⭐ Trap prevention
- ⭐⭐⭐⭐ Agent context block

## 来源

- Claude Code: `tools/EnterPlanModeTool/EnterPlanModeTool.ts`
- 分析报告: P38-9