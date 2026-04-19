# Todo Write Tool Skill

Todo写入工具 - Verification nudge + All-done clear + Gate pattern。

## 功能概述

从Claude Code的TodoWriteTool提取的todo管理模式，用于OpenClaw的任务列表。

## 核心机制

### Verification Nudge

```typescript
if (
  feature('VERIFICATION_AGENT') &&
  getFeatureValue('tengu_hive_evidence', false) &&
  !context.agentId &&
  allDone &&
  todos.length >= 3 &&
  !todos.some(t => /verif/i.test(t.content))
) {
  verificationNudgeNeeded = true
}
// 3+任务完成 + 无verification → nudge
// 提示spawn verification agent
```

### All-done Clear

```typescript
const allDone = todos.every(_ => _.status === 'completed')
const newTodos = allDone ? [] : todos
// 全部完成 → 清空列表
// 避免stale显示
```

### Session/Agent Key

```typescript
const todoKey = context.agentId ?? getSessionId()
const oldTodos = appState.todos[todoKey] ?? []
// Agent有自己的todo list
// Main session用sessionId
```

### Gate Pattern

```typescript
isEnabled() {
  return !isTodoV2Enabled()
}
// TodoV2 gate
// V2启用时禁用此tool
```

### Nudge Message

```typescript
const nudge = verificationNudgeNeeded
  ? `\n\nNOTE: You just closed out 3+ tasks and none was a verification step.
     Before writing final summary, spawn verification agent.
     You cannot self-assign PARTIAL by listing caveats — only verifier issues verdict.`
  : ''
// 强制verification
// 不能自己声明partial
```

### Diff Output

```typescript
outputSchema: z.object({
  oldTodos: TodoListSchema().describe('The todo list before update'),
  newTodos: TodoListSchema().describe('The todo list after update'),
  verificationNudgeNeeded: z.boolean().optional()
})
// 返回old/new对比
// 可追踪变更
```

## 实现建议

### OpenClaw适配

1. **verificationNudge**: Verification提示
2. **allDoneClear**: 完成清空
3. **sessionKey**: Session绑定
4. **gate**: V2 gate

### 状态文件示例

```json
{
  "oldTodos": [{ "content": "Fix bug", "status": "in_progress" }],
  "newTodos": [],
  "allDone": true,
  "verificationNudgeNeeded": true
}
```

## 关键模式

### Verification Nudge Pattern

```
3+ tasks done + no verif → Nudge: spawn verifier
// 强制verification
// 防止self-declared partial
```

### All-done Auto Clear

```
every(t => t.status === 'completed') → clear list
// 清空stale任务
// UI简洁
```

### Gate Pattern

```
isTodoV2Enabled() → false → disable TodoWriteTool
// 新版本替代旧版
// Gate控制
```

## 借用价值

- ⭐⭐⭐⭐⭐ Verification nudge pattern
- ⭐⭐⭐⭐ All-done auto clear
- ⭐⭐⭐⭐ Session/Agent key separation
- ⭐⭐⭐⭐ Gate pattern

## 来源

- Claude Code: `tools/TodoWriteTool/TodoWriteTool.ts` (4KB)
- 分析报告: P38-17