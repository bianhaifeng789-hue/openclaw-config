# Branch Command Skill

对话分支命令 - 从当前点创建分支对话。

## 功能概述

从Claude Code的branch.ts提取的对话分支模式，用于OpenClaw的对话fork。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'branch',
  aliases: feature('FORK_SUBAGENT') ? [] : ['fork'],
  description: 'Create a branch of the current conversation at this point',
  argumentHint: '[name]',
  load: () => import('./branch.js')
}
```

### Alias条件化

```typescript
aliases: feature('FORK_SUBAGENT') ? [] : ['fork']
// fork别名只在FORK_SUBAGENT feature未启用时可用
// 避免与/fork命令冲突
```

### 分支创建

- **保存当前状态**: messages + context
- **创建新session**: 继承当前点
- **独立发展**: 分支后独立演进

## 实现建议

### OpenClaw适配

1. **触发**: `/branch [name]`命令
2. **状态**: 复制当前messages/context
3. **新session**: 使用sessions_spawn
4. **继承**: 共享prompt cache

### 状态文件示例

```json
{
  "branchName": "explore-api",
  "branchPoint": "message_123",
  "branchCount": 3
}
```

## 关键模式

### Conditional Alias

使用feature flag控制别名：
- 防止命令冲突
- Feature渐进推出
- 保持backward compat

### Conversation Fork

类似git branch：
- 从某个点创建分支
- 独立发展
- 可合并或丢弃

## 借用价值

- ⭐⭐⭐ 对话分支支持探索
- ⭐⭐⭐ Conditional alias模式
- ⭐⭐⭐ 状态继承机制

## 来源

- Claude Code: `commands/branch/index.ts`
- 分析报告: P34-4