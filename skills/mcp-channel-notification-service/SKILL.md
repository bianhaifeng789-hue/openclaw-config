---
name: mcp-channel-notification-service
description: "MCP通道通知服务。发送通知到不同通道（飞书、Telegram等）。Use when sending notifications via MCP channels."
---

# MCP Channel Notification Service

## 功能

发送通道通知。

### 支持通道

- Feishu（飞书）
- Telegram
- Discord
- WhatsApp

### 示例

```javascript
await sendNotification({
  channel: 'feishu',
  message: '任务完成',
  card: {
    title: '进度更新',
    content: '已完成10个Skills补全'
  }
});
```

---

来源: Claude Code services/mcp/channelNotification.ts