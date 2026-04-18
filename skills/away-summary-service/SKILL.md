---
name: away-summary-service
description: "用户离开期间摘要生成服务。检测用户离开时间，生成'while you were away'摘要，发送飞书卡片。Use when user returns after > 30min absence."
---

# Away Summary Service

## 实际功能

检测用户离开时间，生成摘要。

### 核心逻辑

```javascript
// impl/bin/away-summary-generator.js
function generateAwaySummary(lastActiveTime, currentTime) {
  const awayMinutes = (currentTime - lastActiveTime) / 60000;

  if (awayMinutes > 30) {
    return {
      awayTime: awayMinutes.toFixed(0) + '分钟',
      summary: '离开期间的重要事件',
      missedMessages: getMissedMessages(),
      calendarEvents: getUpcomingEvents()
    };
  }

  return null;
}
```

### 飞书卡片格式

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**👋 While you were away...**\n\n离开时间: 35分钟\n\n重要事件:\n• 2条未读消息\n• 1个即将到来的会议"
      }
    }
  ]
}
```

### 心跳集成

- interval: 30m
- priority: high
- 条件: awayMinutes > 30

---

来源: Claude Code services/awaySummary.ts