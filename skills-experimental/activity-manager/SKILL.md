---
name: activity-manager
description: "Activity time tracking for user vs CLI operations. Deduplicate overlapping activities. Track active time with timeout. Singleton instance. Use when managing user activity, tracking idle time, or handling away/return states."
metadata:
  openclaw:
    emoji: "⏱️"
    triggers: [session-active, heartbeat]
    feishuCard: true
---

# Activity Manager Skill - 活动时间追踪

追踪用户和 CLI 的活动时间，用于统计和报告。

## 为什么需要这个？

**场景**：
- 用户活跃时间统计
- CLI 执行时间统计
- Activity deduplication
- 活跃时间报告

**Claude Code 方案**：activityManager.ts + Singleton
**OpenClaw 飞书适配**：飞书用户活动追踪 + Stats Heatmap

---

## Activity 类型

### 1. User Activity

```typescript
// 用户交互（打字、命令等）
recordUserActivity(): void {
  // 不记录 CLI 活动期间的用户时间
  if (!isCLIActive && lastUserActivityTime !== 0) {
    const timeSinceLastActivity = (now - lastUserActivityTime) / 1000
    
    // 只有在 timeout 窗口内才记录（5s）
    if (timeSinceLastActivity < timeoutSeconds) {
      activeTimeCounter.add(timeSinceLastActivity, { type: 'user' })
    }
  }
  
  lastUserActivityTime = now
}
```

### 2. CLI Activity

```typescript
// CLI 执行（工具调用、AI 响应等）
startCLIActivity(operationId: string): void {
  // 如果操作已存在，先结束（防止重叠）
  if (activeOperations.has(operationId)) {
    endCLIActivity(operationId)
  }
  
  const wasEmpty = activeOperations.size === 0
  activeOperations.add(operationId)
  
  if (wasEmpty) {
    isCLIActive = true
    lastCLIRecordedTime = now
  }
}

endCLIActivity(operationId: string): void {
  activeOperations.delete(operationId)
  
  if (activeOperations.size === 0) {
    // 记录 CLI 时间
    const cliTime = (now - lastCLIRecordedTime) / 1000
    activeTimeCounter.add(cliTime, { type: 'cli' })
    
    isCLIActive = false
  }
}
```

---

## Time Counter

```typescript
interface ActiveTimeCounter {
  add(seconds: number, options: { type: 'user' | 'cli' }): void
  getTotal(): { userTime: number; cliTime: number }
}
```

---

## 飞书卡片格式

### Activity Summary 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏱️ Activity Summary**\n\n---\n\n**活跃时间统计**：\n\n| 类型 | 时间 | 占比 |\n|------|------|------|\n| **用户** | 15 分钟 | 25% |\n| **CLI** | 45 分钟 | 75% |\n| **总计** | 60 分钟 | 100% |\n\n---\n\n**当前状态**：\n• **CLI 活跃**：是\n• **活跃操作**：3 个\n• **最后用户活动**：2 分钟前"
      }
    }
  ]
}
```

---

## 执行流程

### 1. Singleton 模式

```
Activity Manager:
1. 单例实例
2. 管理 active operations set
3. 追踪 last activity timestamps
4. Deduplicate overlapping activities
```

### 2. Activity 追踪

```typescript
class ActivityManager {
  private activeOperations = new Set<string>()
  private lastUserActivityTime: number = 0
  private lastCLIRecordedTime: number
  private isCLIActive: boolean = false
  
  private readonly USER_ACTIVITY_TIMEOUT_MS = 5000  // 5 seconds
  
  // Singleton
  static getInstance(): ActivityManager
}
```

---

## 持久化存储

```json
// memory/activity-manager-state.json
{
  "sessions": [
    {
      "sessionId": "session-1",
      "userTime": 900,  // seconds
      "cliTime": 2700,  // seconds
      "startTime": "2026-04-12T00:00:00Z",
      "endTime": "2026-04-12T01:00:00Z"
    }
  ],
  "stats": {
    "totalUserTime": 0,
    "totalCLITime": 0,
    "totalSessions": 0
  },
  "current": {
    "isCLIActive": false,
    "activeOperations": [],
    "lastUserActivity": null
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| ActivityManager.getInstance() | Skill + 单例 |
| recordUserActivity() | 飞书用户消息触发 |
| startCLIActivity() | 工具调用开始 |
| endCLIActivity() | 工具调用结束 |
| USER_ACTIVITY_TIMEOUT_MS | 5s timeout |

---

## 注意事项

1. **Deduplication**：重叠操作只记录一次
2. **Timeout**：用户活动 5s timeout
3. **CLI 优先**：CLI 活跃时不记录用户时间
4. **Singleton**：全局单例实例
5. **飞书适配**：飞书消息作为用户活动

---

## 自动启用

此 Skill 在 heartbeat 时自动检查并记录活动时间。

---

## 下一步增强

- Activity trend 分析
- Peak activity detection
- Activity heatmap