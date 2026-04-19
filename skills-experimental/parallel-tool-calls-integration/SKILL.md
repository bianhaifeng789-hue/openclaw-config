---
name: parallel-tool-calls-integration
description: parallel_tool_calls 集成指南 - Claude Code 架构核心优化，允许模型在一次响应中发出多个工具调用。需修改 OpenClaw Agent 核心逻辑。
---

# Parallel Tool Calls 集成指南

## 概述

`parallel_tool_calls` 是 Claude Code 架构的核心优化，允许模型在一次响应中发出多个独立的工具调用，显著提升吞吐量。

来源：Harness Engineering - agents.py 第 127 行

## 原理

**传统模式**：
- 模型响应 → 执行1个工具 → 返回结果 → 模型响应 → 执行下一个工具
- 每次工具调用需要等待上一轮完成
- 吞吐量低

**Parallel模式**：
- 模型响应 → 同时执行多个工具 → 返回所有结果 → 模型响应
- 独立的工具调用可以并行执行
- 吞吐量显著提升

## Harness 实现

```python
kwargs["parallel_tool_calls"] = True

response = client.chat.completions.create(**kwargs)

# Execute all tool calls
for tc in msg.tool_calls:
    result = tools.execute_tool(fn_name, fn_args)
    messages.append({
        "role": "tool",
        "tool_call_id": tc.id,
        "content": result
    })
```

## 集成到 OpenClaw

### 需要修改的位置

1. **impl/bin/harness.js** - Agent 循环
2. **impl/bin/builder.js** - Builder Agent
3. **impl/bin/evaluator.js** - Evaluator Agent

### 修改示例（builder.js）

```javascript
// Before LLM call
const kwargs = {
  model: config.MODEL,
  messages: messages,
  max_tokens: 16384,
  tools: TOOL_SCHEMAS,
  tool_choice: 'auto',
  parallel_tool_calls: true  // ← 关键修改
};

// Execute all tool calls in parallel
const toolPromises = msg.tool_calls.map(async tc => {
  const fnName = tc.function.name;
  const fnArgs = JSON.parse(tc.function.arguments);
  const result = await executeTool(fnName, fnArgs);
  
  return {
    role: 'tool',
    tool_call_id: tc.id,
    content: result
  };
});

const toolResults = await Promise.all(toolPromises);
messages.push(...toolResults);
```

## 注意事项

### 1. Tool Response 顺序

OpenAI API 要求 tool responses 按照 tool_calls 的顺序返回：

```javascript
// 正确顺序
for (const tc of msg.tool_calls) {
  messages.push({
    role: 'tool',
    tool_call_id: tc.id,
    content: result
  });
}
```

### 2. Post-tool Middleware

对于 parallel tool calls，middleware 只在最后一个工具执行后注入：

```javascript
// For parallel tool calls, only inject AFTER the last tool
if (tc === msg.tool_calls[msg.tool_calls.length - 1]) {
  const inject = mw.post_tool(fn_name, fn_args, result, messages);
  if (inject) {
    messages.push({ role: 'user', content: inject });
    break;
  }
}
```

### 3. Error Handling

如果某个工具调用失败，其他工具调用仍然继续执行：

```javascript
const toolResults = await Promise.allSettled(toolPromises);
for (const result of toolResults) {
  if (result.status === 'fulfilled') {
    messages.push(result.value);
  } else {
    messages.push({
      role: 'tool',
      tool_call_id: tc.id,
      content: `[error] ${result.reason.message}`
    });
  }
}
```

## 性能提升

根据 Harness Engineering 注释：
> "This is the single biggest throughput win from Claude Code's architecture."

预期提升：**2-5倍吞吐量**（取决于任务复杂度）

## 实现难度

- **难度**: 中等（需要修改 Agent 核心逻辑）
- **风险**: 低（OpenAI API 已支持）
- **时间**: 30-60 分钟

---

创建时间：2026-04-17
来源：Harness Engineering agents.py
状态：文档已完成，待集成到 OpenClaw Agent