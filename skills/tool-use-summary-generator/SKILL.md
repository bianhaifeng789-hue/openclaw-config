---
name: tool-use-summary-generator
description: |
  Generate a short human-readable label for a batch of completed tool calls.
  Used to provide progress updates during long tool sequences.
  
  Use when:
  - After completing a batch of tool calls (3+ tools)
  - User asks "what did you just do"
  - Providing progress updates in long-running tasks
  
  Keywords:
  - "what did you do", "progress", "summary", "刚才做了什么"
metadata:
  openclaw:
    emoji: "🏷️"
    source: claude-code-services
    triggers: [tool-batch-complete, explicit-request]
    priority: P2
---

# Tool Use Summary Generator

为完成的工具调用批次生成简短的人类可读标签。

## 核心逻辑（来自 Claude Code toolUseSummaryGenerator.ts）

**System Prompt**：
```
Write a short summary label describing what these tool calls accomplished. 
It appears as a single-line row in a mobile app and truncates around 30 characters, 
so think git-commit-subject, not sentence.

Keep the verb in past tense and the most distinctive noun. 
Drop articles, connectors, and long location context first.

Examples:
- Searched in auth/
- Fixed NPE in UserService
- Created signup endpoint
- Read config.json
- Ran failing tests
```

## 生成规则

- 动词用过去时
- 保留最有辨识度的名词
- 去掉冠词、连接词、长路径
- 目标长度：~30字符
- 不是完整句子，是 git commit subject 风格

## 在 OpenClaw 中的应用

在飞书场景下，可以在完成一批工具调用后，生成一行摘要发送给用户：

```
✅ 已完成：Created find-relevant-memories skill
```

或在长任务中作为进度更新：
```
🔄 正在：Reading memoryScan.ts
✅ 已完成：Analyzed 3 memory services
```

## 实现方式

根据最近的工具调用列表，自行生成摘要（不需要额外 API 调用）：

```
工具列表 → 提取关键动作 → 生成30字以内标签
```
