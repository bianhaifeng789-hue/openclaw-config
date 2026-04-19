---
name: context-suggestions
description: "Automatic context optimization suggestions. Detect bloat, large tool results, memory usage issues. Warn users and suggest actions to optimize context. Use when [context suggestions] is needed."
metadata:
  openclaw:
    emoji: "💡"
    triggers: [context-check, threshold-warning]
    feishuCard: true
---

# Context Suggestions Skill - 上下文建议

自动检测 Context 问题，提供优化建议。

## 为什么需要这个？

**场景**：
- Context 接近上限（80%+）
- 大工具结果占用过多
- Memory 区块过大
- 自动瘦身建议

**Claude Code 方案**：contextSuggestions.ts + 多阈值检测
**OpenClaw 飞书适配**：session_status + 飞书卡片建议

---

## 阈值检测

```typescript
const LARGE_TOOL_RESULT_PERCENT = 15  // 工具结果 > 15% context
const LARGE_TOOL_RESULT_TOKENS = 10_000
const READ_BLOAT_PERCENT = 5          // Read 结果 > 5% context
const NEAR_CAPACITY_PERCENT = 80      // Context > 80%
const MEMORY_HIGH_PERCENT = 5         // Memory > 5% context
const MEMORY_HIGH_TOKENS = 5_000
```

---

## 检测类型

### 1. Near Capacity（接近上限）

```
检测：Context >= 80%

建议：
"Context is 80% full.
Autocompact will trigger soon.
Use /compact now to control what gets kept."
```

### 2. Large Tool Results（大工具结果）

```
检测：某个工具结果 > 15% context

建议：
"FileReadTool result is 20% of context (15k tokens).
Consider using readFileInRange to limit scope."
```

### 3. Read Result Bloat（读取膨胀）

```
检测：Read 结果累计 > 5% context

建议：
"Read results total 10% of context.
Consider using GrepTool first to narrow scope."
```

### 4. Memory Bloat（记忆膨胀）

```
检测：MEMORY.md > 5% context

建议：
"MEMORY.md is 8% of context (6k tokens).
Consider consolidating or archiving old entries."
```

### 5. Auto Compact Disabled（自动瘦身禁用）

```
检测：Autocompact 禁用

建议：
"Autocompact is disabled.
Use /compact to free space, or enable in config."
```

---

## 飞书卡片格式

### Context 建议卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**💡 Context 建议**\n\n**当前状态**：107k/128k (84%) ⚠️\n\n**建议**：\n\n🔴 **接近上限**：Context 已达 84%\n→ 建议：执行 /compact 或等待自动触发\n\n🟡 **大工具结果**：FileReadTool 占用 15%\n→ 建议：使用 readFileInRange 限制范围\n\n🟢 **可节省**：约 20k tokens\n\n**优先级**：Warning > Info"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "执行 Compact"},
          "type": "primary",
          "value": {"action": "compact"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "查看详情"},
          "type": "default",
          "value": {"action": "view_context_detail"}
        }
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 定期检查

```
Heartbeat:
1. 获取 session_status（Context 百分比）
2. 检查各类阈值
3. 生成建议列表
4. 按优先级排序（Warning > Info）
5. 如果有 Warning，发送飞书卡片
```

### 2. 生成建议

```typescript
function generateContextSuggestions(data: ContextData): ContextSuggestion[] {
  const suggestions: ContextSuggestion[] = []

  checkNearCapacity(data, suggestions)
  checkLargeToolResults(data, suggestions)
  checkReadResultBloat(data, suggestions)
  checkMemoryBloat(data, suggestions)
  checkAutoCompactDisabled(data, suggestions)

  // 按优先级排序
  suggestions.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'warning' ? -1 : 1
    }
    return (b.savingsTokens ?? 0) - (a.savingsTokens ?? 0)
  })

  return suggestions
}
```

---

## 持久化存储

```json
// memory/context-suggestions-state.json
{
  "lastCheck": "2026-04-11T23:00:00Z",
  "suggestions": [
    {
      "severity": "warning",
      "title": "Context is 84% full",
      "detail": "Autocompact will trigger soon",
      "savingsTokens": 20000,
      "timestamp": "2026-04-11T23:00:00Z"
    }
  ],
  "stats": {
    "checksPerformed": 0,
    "warningsIssued": 0,
    "suggestionsAccepted": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| ContextData（内部） | session_status |
| checkNearCapacity | 同样检测 |
| checkLargeToolResults | 同样检测 |
| generateContextSuggestions | 同样生成 |
| Terminal UI | 飞书卡片建议 |

---

## 注意事项

1. **定期检查**：Heartbeat 每次都检查
2. **优先级排序**：Warning 先于 Info
3. **节省估算**：显示预计节省 tokens
4. **用户选择**：用户可以选择忽略
5. **自动触发**：Warning 时自动发送卡片

---

## 自动启用

此 Skill 由 Heartbeat 定期检查，接近阈值时自动发送建议。

---

## 下一步增强

- 建议执行跟踪（用户是否采纳）
- 建议效果评估
- 更智能的瘦身策略
- Context 使用历史图表