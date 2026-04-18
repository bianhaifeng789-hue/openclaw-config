# Resume Command Skill

会话恢复命令 - Alias别名 + ID/Search参数。

## 功能概述

从Claude Code的resume/index.ts提取的会话恢复模式，用于OpenClaw的对话恢复。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'resume',
  description: 'Resume a previous conversation',
  aliases: ['continue'],
  argumentHint: '[conversation id or search term]',
  load: () => import('./resume.js')
}
```

### Alias Support

```typescript
aliases: ['continue']
// resume和continue都可以
// 用户习惯不同名称
```

### Argument Types

```
[conversation id] - 直接恢复特定会话
[search term]     - 搜索匹配会话
(no args)         - 显示最近会话列表
```

## 实现建议

### OpenClaw适配

1. **alias**: continue别名
2. **argumentHint**: ID或搜索
3. **search**: 会话搜索功能

### 状态文件示例

```json
{
  "recentSessions": [
    { "id": "abc123", "title": "Claude Code analysis" },
    { "id": "def456", "title": "Memory maintenance" }
  ]
}
```

## 关键模式

### Flexible Argument

```
[conversation id or search term]
// 支持两种输入
// ID直接恢复，term搜索
```

## 借用价值

- ⭐⭐⭐ Alias支持
- ⭐⭐⭐ Flexible argument

## 来源

- Claude Code: `commands/resume/index.ts`
- 分析报告: P36-10