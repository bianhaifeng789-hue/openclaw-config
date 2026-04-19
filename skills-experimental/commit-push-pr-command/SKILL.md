# Commit Push PR Command Skill

组合命令 - Allowed tools + Shell execution + Slack集成。

## 功能概述

从Claude Code的commit-push-pr.ts提取的组合命令，用于OpenClaw的Git工作流。

## 核心机制

### Allowed Tools白名单

```typescript
const ALLOWED_TOOLS = [
  'Bash(git checkout --branch:*)',
  'Bash(git checkout -b:*)',
  'Bash(git add:*)',
  'Bash(git status:*)',
  'Bash(git push:*)',
  'Bash(git commit:*)',
  'Bash(gh pr create:*)',
  'Bash(gh pr edit:*)',
  'Bash(gh pr view:*)',
  'Bash(gh pr merge:*)',
  'ToolSearch',
  'mcp__slack__send_message',
]
// 精细化的工具权限
```

### Shell Execution

```typescript
const finalContent = await executeShellCommandsInPrompt(
  promptContent,
  context,
  '/commit-push-pr'
)
// !\`command\`动态执行并替换
```

### Slack集成（可选）

```typescript
slackStep: `
5. Check CLAUDE.md for Slack channels
   Use ToolSearch to find slack send message tools
   Only post if user confirms
`
// 条件性Slack通知
```

### Undercover模式

```typescript
if (isUndercover()) {
  prefix = getUndercoverInstructions()
  reviewerArg = ''
  changelogSection = ''
  slackStep = ''
}
// Ant undercover隐藏trace
```

## 实现建议

### OpenClaw适配

1. **allowedTools**: Git + PR工具白名单
2. **shellExec**: 动态git状态
3. **slack**: 条件通知
4. **undercover**: 隐藏模式

### 状态文件示例

```json
{
  "allowedTools": 13,
  "slackEnabled": true,
  "undercover": false
}
```

## 关键模式

### Composite Workflow

```
Create branch → Commit → Push → Create PR → Notify Slack
// 单次turn完成所有步骤
```

### Conditional Slack

```
ToolSearch → Ask → Send
// 不强制Slack通知
// 失败silently skip
```

## 借用价值

- ⭐⭐⭐⭐⭐ Allowed tools白名单
- ⭐⭐⭐⭐ Composite workflow
- ⭐⭐⭐ Conditional Slack
- ⭐⭐⭐ Undercover模式

## 来源

- Claude Code: `commands/commit-push-pr.ts`
- 分析报告: P37-3