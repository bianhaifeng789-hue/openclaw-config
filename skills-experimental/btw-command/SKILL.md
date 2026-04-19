# BTW Command Skill

快速旁路问题命令 - forked agent处理side question，不中断主对话。

## 功能概述

从Claude Code的btw.ts提取的旁路问题模式，用于OpenClaw的快速查询。

## 核心机制

### 命令结构

```typescript
{
  type: 'local-jsx',
  name: 'btw',
  description: 'Ask a quick side question without interrupting the main conversation',
  immediate: true,
  argumentHint: '<question>',
  load: () => import('./btw.js')
}
```

### 关键字段

| 字段 | 说明 |
|------|------|
| immediate | true - 立即执行，不等待turn end |
| argumentHint | 用户问题提示 |

### 执行模式

- **Forked agent**: 创建独立的subagent处理
- **工具限制**: 主对话工具不可用
- **Max 1 turn**: 限制输出长度
- **Prompt cache**: 共享parent cache

### 使用场景

1. 用户在对话中插入快速问题
2. 不影响主对话流程
3. 结果直接返回，不写入transcript

## 实现建议

### OpenClaw适配

1. **触发**: `/btw <question>`命令
2. **fork**: sessions_spawn lightContext
3. **限制**: 禁用非必要工具
4. **结果**: 直接回复，不影响主对话

### 状态文件示例

```json
{
  "btwCount": 5,
  "lastBtwQuestion": "what's the syntax for async",
  "immediate": true
}
```

## 关键模式

### Immediate Execution

`immediate: true`表示立即执行：
- 不等待当前turn结束
- 适合快速查询
- 不阻塞主流程

### Non-Interrupting

- Side question不影响主对话
- 不写入transcript
- 不改变对话状态

## 借用价值

- ⭐⭐⭐⭐ immediate模式提升用户体验
- ⭐⭐⭐⭐ 不中断主对话
- ⭐⭐⭐ Forked agent轻量处理

## 来源

- Claude Code: `commands/btw/index.ts`
- 分析报告: P34-3