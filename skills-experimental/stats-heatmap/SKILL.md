---
name: stats-heatmap
description: "Usage statistics visualization: sessions, messages, tokens, streaks, daily activity heatmap, peak activity analysis. Use when: user asks about usage stats, wants to see activity patterns."
metadata:
  openclaw:
    emoji: "📊"
    triggers: [stats-request, usage-visualization]
    feishuCard: true
---

# Stats Heatmap Skill - 使用统计可视化

生成使用统计和活动热力图，可视化用户使用模式。

## 为什么需要这个？

**场景**：
- 查看使用统计
- 分析活跃模式
- Streak 追踪
- Token 使用统计
- Peak activity 分析

**Claude Code 方案**：stats.ts + statsCache.ts
**OpenClaw 飞书适配**：飞书卡片统计报告 + 状态文件

---

## 统计类型

### 1. Overview Stats

```typescript
interface ClaudeCodeStats {
  totalSessions: number
  totalMessages: number
  totalDays: number
  activeDays: number
  
  streaks: StreakInfo
  dailyActivity: DailyActivity[]
  dailyModelTokens: DailyModelTokens[]
  
  longestSession: SessionStats | null
  modelUsage: { [modelName: string]: ModelUsage }
  
  firstSessionDate: string | null
  lastSessionDate: string | null
  peakActivityDay: string | null
  peakActivityHour: number | null
}
```

### 2. Streak Info

```typescript
interface StreakInfo {
  currentStreak: number
  longestStreak: number
  currentStreakStart: string | null
  longestStreakStart: string | null
  longestStreakEnd: string | null
}
```

### 3. Daily Activity

```typescript
interface DailyActivity {
  date: string  // YYYY-MM-DD
  messageCount: number
  sessionCount: number
  toolCallCount: number
}
```

---

## 飞书卡片格式

### Overview Stats 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📊 使用统计概览**\n\n**总览**：\n• **Sessions**：128 次\n• **Messages**：3,420 条\n• **Active Days**：45 天\n• **Total Days**：60 天\n\n---\n\n**Streaks**：\n🔥 **当前 streak**：7 天（始于 2026-04-05）\n🏆 **最长 streak**：12 天（2026-03-01 ~ 2026-03-12）\n\n---\n\n**Peak Activity**：\n• **最活跃日期**：2026-03-15（56 messages）\n• **最活跃时段**：22:00（晚间高峰）\n\n---\n\n**最长 Session**：\n• **时长**：2 小时 15 分钟\n• **Messages**：89 条\n• **日期**：2026-03-20"
      }
    }
  ]
}
```

### Heatmap 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📊 活动热力图（最近 30 天）**\n\n**Week 1**：\n```\n01 02 03 04 05 06 07\n■  ■  □  ■  ■  ■  □\n3  5  0  2  8  7  0\n```\n\n**Week 2**：\n```\n08 09 10 11 12 13 14\n■  □  ■  ■  □  ■  ■\n4  0  6  9  0  5  3\n```\n\n...\n\n**Legend**：\n□ 无活动  ■ 有活动（数字 = messages）"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 收集统计数据

```
Stats Heatmap:
1. 读取 memory/YYYY-MM-DD.md 文件
2. 解析 daily activity
3. 计算 streaks
4. 统计 tokens/model usage
5. 找出 peak activity
```

### 2. 生成热力图

```typescript
function generateHeatmap(dailyActivity: DailyActivity[]): string {
  // 按周分组
  const weeks = groupByWeek(dailyActivity)
  
  // 生成可视化
  let heatmap = ''
  for (const week of weeks) {
    heatmap += formatWeekRow(week)
  }
  
  return heatmap
}
```

### 3. 计算 Streaks

```typescript
function calculateStreaks(dailyActivity: DailyActivity[]): StreakInfo {
  // 当前 streak（从今天往回数）
  let currentStreak = 0
  let currentStreakStart = null
  
  // 最长 streak（历史最高）
  let longestStreak = 0
  let longestStreakStart = null
  let longestStreakEnd = null
  
  // 遍历 activity 数据计算
  // ...
  
  return {
    currentStreak,
    longestStreak,
    currentStreakStart,
    longestStreakStart,
    longestStreakEnd
  }
}
```

---

## 持久化存储

```json
// memory/stats-heatmap-state.json
{
  "lastComputed": "2026-04-12T00:00:00Z",
  "stats": {
    "totalSessions": 0,
    "totalMessages": 0,
    "activeDays": 0,
    "streaks": {
      "currentStreak": 0,
      "longestStreak": 0
    }
  },
  "dailyActivity": [],
  "peakActivity": {
    "day": null,
    "hour": null
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| stats.ts + statsCache.ts | Skill + 状态文件 |
| processSessionFiles | 读取 memory/YYYY-MM-DD.md |
| Heatmap UI | 飞书卡片 text visualization |
| Terminal UI | 飞书卡片报告 |
| /stats 命令 | 飞书触发 |

---

## 注意事项

1. **状态文件读取**：从 memory/YYYY-MM-DD.md 获取数据
2. **热力图格式**：使用飞书 text visualization（■/□）
3. **Streak 计算**：从今天往回数连续活跃天数
4. **Peak activity**：找最活跃的日期和时段
5. **Model usage**：统计各模型 token 使用

---

## 自动启用

此 Skill 在用户请求统计或 heartbeat 时自动运行。

---

## 下一步增强

- Token cost 计算
- Model usage 对比
- Activity trend 分析
- Export 统计数据