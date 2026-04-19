---
name: context-analysis
description: |
  Analyze current conversation context token distribution.
  Shows which tools/files are consuming the most tokens, duplicate reads, and optimization opportunities.
  
  Use when:
  - User asks "how much context is left" or "why is context full"
  - Context usage > 70%
  - User asks "what's taking up context"
  - Before compaction to understand what to keep
  
  Keywords:
  - "context", "tokens", "上下文", "token 分布", "context full", "context usage"
metadata:
  openclaw:
    emoji: "📊"
    source: claude-code-utils
    triggers: [explicit-request, context-warning]
    priority: P1
---

# Context Analysis

分析当前对话的 token 分布，找出优化机会。

## 核心逻辑（来自 Claude Code contextAnalysis.ts）

分析维度：
- `toolRequests`: 每个工具的请求 token 数
- `toolResults`: 每个工具的结果 token 数
- `humanMessages`: 用户消息 token 数
- `assistantMessages`: 助手消息 token 数
- `attachments`: 附件 token 数
- `duplicateFileReads`: 重复读取的文件（浪费）

## 优化建议（contextSuggestions）

触发条件和建议：

| 条件 | 建议 |
|------|------|
| 上下文 > 80% | 考虑 compact |
| 单个工具结果 > 15% | 该工具结果过大 |
| Read 结果 > 5% | 文件读取过多 |
| 记忆文件 > 5000 tokens | MEMORY.md 过大 |
| 重复读取同一文件 | 缓存或减少重读 |

## 在 OpenClaw 中执行

通过 `session_status` 获取当前 token 使用情况：

```
当前上下文：72k/200k (36%)
```

详细分析需要检查对话历史中的工具调用记录。

## 输出格式

```
📊 上下文分析
总计：72k tokens (36%)

工具结果占用：
- exec: 45k (62%)
- read: 12k (17%)
- memory_search: 3k (4%)

⚠️ 建议：
- exec 结果占用过多，考虑截断长输出
- 距离 compact 阈值还有 64% 空间
```
