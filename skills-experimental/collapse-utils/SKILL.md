---
name: collapse-utils
description: "Message collapsing utilities. collapseBackgroundBashNotifications + collapseHookSummaries + collapseTeammateShutdowns + N background commands completed + Parallel tool calls hook summary + Aggregation (hookCount/hookInfos/hookErrors). Use when [collapse utils] is needed."
metadata:
  openclaw:
    emoji: "📦"
    triggers: [collapse-messages, notification-collapse]
    feishuCard: true
---

# Collapse Utils Skill - Collapse Utils

Collapse Utils 消息折叠工具。

## 为什么需要这个？

**场景**：
- Collapse background bash notifications
- Collapse hook summaries
- Collapse teammate shutdowns
- N background commands completed
- Parallel tool calls grouping

**Claude Code 方案**：collapseReadSearch.ts + 1100+ lines
**OpenClaw 飞书适配**：Collapse utils + Message collapsing

---

## Functions

### 1. Collapse Background Bash

```typescript
function collapseBackgroundBashNotifications(
  messages: RenderableMessage[],
  verbose: boolean,
): RenderableMessage[] {
  if (!isFullscreenEnvEnabled()) return messages
  if (verbose) return messages

  const result: RenderableMessage[] = []
  let i = 0

  while (i < messages.length) {
    const msg = messages[i]!
    if (isCompletedBackgroundBash(msg)) {
      let count = 0
      while (i < messages.length && isCompletedBackgroundBash(messages[i]!)) {
        count++
        i++
      }
      if (count === 1) {
        result.push(msg)
      } else {
        // Synthesize task-notification
        result.push({
          ...msg,
          message: {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `<${TASK_NOTIFICATION_TAG}><${STATUS_TAG}>completed</${STATUS_TAG}><${SUMMARY_TAG}>${count} background commands completed</${SUMMARY_TAG}></${TASK_NOTIFICATION_TAG}>`,
              },
            ],
          },
        })
      }
    } else {
      result.push(msg)
      i++
    }
  }

  return result
}
```

### 2. Collapse Hook Summaries

```typescript
function collapseHookSummaries(
  messages: RenderableMessage[],
): RenderableMessage[] {
  const result: RenderableMessage[] = []
  let i = 0

  while (i < messages.length) {
    const msg = messages[i]!
    if (isLabeledHookSummary(msg)) {
      const label = msg.hookLabel
      const group: SystemStopHookSummaryMessage[] = []
      while (i < messages.length) {
        const next = messages[i]!
        if (!isLabeledHookSummary(next) || next.hookLabel !== label) break
        group.push(next)
        i++
      }
      if (group.length === 1) {
        result.push(msg)
      } else {
        result.push({
          ...msg,
          hookCount: group.reduce((sum, m) => sum + m.hookCount, 0),
          hookInfos: group.flatMap(m => m.hookInfos),
          hookErrors: group.flatMap(m => m.hookErrors),
          preventedContinuation: group.some(m => m.preventedContinuation),
          hasOutput: group.some(m => m.hasOutput),
          totalDurationMs: Math.max(...group.map(m => m.totalDurationMs ?? 0)),
        })
      }
    } else {
      result.push(msg)
      i++
    }
  }

  return result
}
```

---

## 飞书卡片格式

### Collapse Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📦 Collapse Utils**\n\n---\n\n**Functions**：\n• collapseBackgroundBashNotifications() - Background bash\n• collapseHookSummaries() - Hook summaries\n• collapseTeammateShutdowns() - Teammate shutdowns\n\n---\n\n**Features**：\n• N background commands completed\n• Parallel tool calls grouping\n• Aggregation (hookCount/hookInfos/hookErrors)\n• Verbose mode pass-through"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/collapse-utils-state.json
{
  "stats": {
    "totalCollapsed": 0,
    "backgroundBashCollapsed": 0,
    "hookSummariesCollapsed": 0
  },
  "lastUpdate": "2026-04-12T11:02:00Z",
  "notes": "Collapse Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| collapseReadSearch.ts (1100+ lines) | Skill + Collapse |
| collapseBackgroundBashNotifications() | Background bash |
| collapseHookSummaries() | Hook summaries |
| N completed | Aggregation |

---

## 注意事项

1. **Only collapse successful**：Failed/killed stay visible
2. **Verbose mode**：Pass-through (ctrl+O)
3. **Fullscreen env**：Only collapse when enabled
4. **Aggregation**：hookCount/hookInfos/hookErrors
5. **Parallel tool calls**：Same hookLabel grouping

---

## 自动启用

此 Skill 在 message collapsing 时自动运行。

---

## 下一步增强

- 飞书 collapse 集成
- Collapse analytics
- Collapse debugging