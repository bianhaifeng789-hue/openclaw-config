---
name: brief
description: "Send messages to users with proactive vs normal status. Proactive: background task finished, blocker surfaced. Normal: replying to user request. Use when [brief] is needed."
metadata:
  openclaw:
    emoji: "💬"
    triggers: [message-send]
    feishuCard: true
---

# Brief Skill - 消息发送优化

区分 proactive vs normal 消息，优化用户通知体验。

## 为什么需要这个？

**场景**：
- 后台任务完成 → proactive 通知
- 决策阻塞 → proactive 请求输入
- 回复用户问题 → normal 消息

**Claude Code 方案**：BriefTool + status 参数
**OpenClaw 飞书适配**：message tool + status 参数

---

## Message Status

### Normal（默认）

**用途**：回复用户问题
- 用户刚问 → 直接回复
- 对话流程 → normal 消息
- 不打断用户

```
用户：帮我检查代码

Agent:
→ 检查代码
→ 发送 normal 消息："代码检查完成..."
```

### Proactive（主动）

**用途**：主动通知用户
- 后台任务完成 → 通知结果
- 决策阻塞 → 请求输入
- 发现重要信息 → 主动分享

```
Background Task:
→ 定时检查完成
→ 发送 proactive 消息："后台检查完成，发现 3 个问题"

用户看到：后台通知（不打断当前对话）
```

---

## 飞书卡片格式

### Normal 消息卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**回复**\n\n[消息内容]"
      }
    }
  ]
}
```

### Proactive 消息卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📢 后台通知**\n\n[消息内容]\n\n**来源**：[后台任务名称]\n**时间**：[完成时间]"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "proactive - 主动通知"}
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 判断消息类型

```typescript
function getMessageStatus(context: MessageContext): 'normal' | 'proactive' {
  // 用户刚发送消息 → normal
  if (context.isUserTriggered) {
    return 'normal'
  }
  
  // 后台任务完成 → proactive
  if (context.isBackgroundTask) {
    return 'proactive'
  }
  
  // 决策阻塞 → proactive
  if (context.isBlocking) {
    return 'proactive'
  }
  
  // 默认 normal
  return 'normal'
}
```

### 2. 发送消息

```
Agent:
1. 判断消息类型（normal vs proactive）
2. 生成消息内容
3. 选择飞书卡片格式
4. 调用 message tool 发送
```

---

## 持久化存储

```json
// memory/brief-state.json
{
  "messagesSent": [
    {
      "id": "msg-1",
      "status": "proactive",
      "content": "后台检查完成",
      "source": "background-task",
      "timestamp": "2026-04-11T23:00:00Z"
    }
  ],
  "stats": {
    "normalMessages": 0,
    "proactiveMessages": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| BriefTool | message tool |
| status: 'normal'/'proactive' | 同样参数 |
| attachments 参数 | 飞书附件支持 |
| Terminal UI | 飞书卡片展示 |
| downstream routing | 飞书路由不同 |

---

## 注意事项

1. **Normal 默认**：回复用户时使用 normal
2. **Proactive 明确**：主动通知时标记 proactive
3. **路由不同**：proactive 可能路由到不同通知渠道
4. **不打断**：proactive 不打断当前对话
5. **内容简洁**：proactive 消息简洁明了

---

## 自动启用

此 Skill 在发送消息时自动判断 status。

---

## 下一步增强

- 飞书不同通知渠道路由
- Proactive 消息聚合（批量通知）
- 用户偏好设置（通知频率）