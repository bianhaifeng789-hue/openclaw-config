---
name: fork-subagent-pattern
description: "Forked Subagent 创建模式。创建独立的子Agent处理特定任务，避免主会话上下文污染。Use when task needs isolated execution context."
---

# Fork Subagent Pattern

## 实际功能

创建独立子Agent处理任务。

### 核心模式

```javascript
// 使用 sessions_spawn
const subagent = await sessions_spawn({
  runtime: 'subagent',
  task: '分析 DeerFlow 源码',
  cwd: '/path/to/workspace',
  timeoutSeconds: 120,
  streamTo: 'parent' // 结果流回父会话
});

// 子Agent独立执行，不污染主会话上下文
// 结果通过 streamTo 返回
```

### 使用场景

1. **源码分析** - 大量文件读取，避免上下文膨胀
2. **记忆提取** - 处理大量对话历史
3. **复杂计算** - 长时间任务，避免超时
4. **并行任务** - 多个独立任务并发执行

### 限制

- timeoutSeconds: 默认120秒（可调整）
- 单次最大3个子Agent（subagent-limiter）
- 结果需要手动集成回主会话

### 心跳集成

- auto-dream: 使用forked agent提取记忆
- extract-memories: forked agent处理对话历史

---

来源: Claude Code tools/AgentTool/forkSubagent.ts