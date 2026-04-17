---
name: text-only-nudge
description: 检测模型描述而不执行，注入强制提示。防止弱模型只写计划不执行。适用于前3次迭代无工具调用的情况。
---

# Text-Only Nudge - 检测模型描述而不执行

## 概述

当模型在前几次迭代只描述计划而不执行工具时，注入强制提示。

来源：Harness Engineering - agents.py

## 检测条件

必须同时满足以下4个条件：

1. **iteration <= 3** - 前几次迭代（模型刚开始工作）
2. **msg.content 存在** - 模型返回了文本
3. **包含 action_words** - 文本包含计划性词汇
4. **has_no_prior_tools** - 消息历史中没有工具调用

## Action Words 列表

**英文**：
- i will, i'll, let me, first, step 1
- here's my plan, i need to, we need to
- the approach, my strategy

**中文**：
- 我将, 让我, 第一步, 我的计划, 我需要

## Nudge 消息

```
[SYSTEM] STOP DESCRIBING. START EXECUTING.
You just wrote a plan/description instead of calling tools.
Use run_bash to execute commands NOW.
Do not explain what you will do — just DO it.
```

## 实现细节

```javascript
function detectTextOnlyNudge(iteration, content, messages) {
  // 条件检查
  if (iteration > 3) return { needsNudge: false };
  if (!content || content.trim() === '') return { needsNudge: false };
  
  const contentLower = content.toLowerCase();
  const matchedWords = ACTION_WORDS.filter(w => contentLower.includes(w));
  const isPlanningText = matchedWords.length > 0;
  
  if (!isPlanningText) return { needsNudge: false };
  
  const hasPriorTools = messages.some(m => m.role === 'tool');
  if (hasPriorTools) return { needsNudge: false };
  
  return {
    needsNudge: true,
    nudgeMessage: NUDGE_MESSAGE
  };
}
```

## 用法

```bash
# 检测是否需要 nudge
node text-only-nudge.js detect 2 "I will start by reading the file" '[]'

# 查看状态
node text-only-nudge.js status
```

## 集成到 Agent 循环

在 `impl/bin/harness.js` 或 `impl/bin/builder.js` 中：

```javascript
// After LLM response
if (!msg.tool_calls && msg.content && iteration <= 3) {
  const result = detectTextOnlyNudge(iteration, msg.content, messages);
  if (result.needsNudge) {
    messages.push({ role: 'user', content: result.nudgeMessage });
    continue; // 强制继续
  }
}
```

---

创建时间：2026-04-17
来源：Harness Engineering agents.py
状态：已实现