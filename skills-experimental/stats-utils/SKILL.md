---
name: stats-utils
description: "Usage statistics system. DailyActivity + DailyModelTokens + StreakInfo (currentStreak/longestStreak) + SessionStats + ClaudeCodeStats + processSessionFiles + getClaudeCodeStats + Heatmap data + Model usage aggregation. Use when [stats utils] is needed."
metadata:
  openclaw:
    emoji: "📊"
    triggers: [stats, usage-tracking]
    feishuCard: true
---

# Stats Utils Skill - Stats Utils

Stats Utils 使用统计系统。

## 为什么需要这个？

**场景**：
- Daily activity tracking
- Model token usage
- Streak calculation
- Session statistics
- Heatmap data
- Model usage aggregation

**Claude Code 方案**：stats.ts + 1060+ lines
**OpenClaw 飞书适配**：Stats utils + Usage tracking

---

## Types

### DailyActivity

```typescript
type DailyActivity = {
  date: string // YYYY-MM-DD
  messageCount: number
  sessionCount: number
  toolCallCount: number
}
```

### DailyModelTokens

```typescript
type DailyModelTokens = {
  date: string // YYYY-MM-DD
  tokensByModel: { [modelName: string]: number }
}
```

### StreakInfo

```typescript
type StreakInfo = {
  currentStreak: number
  longestStreak: number
  currentStreakStart: string | null
  longestStreakStart: string | null
  longestStreakEnd: string | null
}
```

### SessionStats

```typescript
type SessionStats = {
  sessionId: string
  duration: number // milliseconds
  messageCount: number
  timestamp: string
}
```

### ClaudeCodeStats

```typescript
type ClaudeCodeStats = {
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
  totalSpeculationTimeSavedMs: number
  shotDistribution?: { [shotCount: number]: number }
  oneShotRate?: number
}
```

---

## Functions

### 1. Process Session Files

```typescript
async function processSessionFiles(
  sessionFiles: string[],
  options: ProcessOptions = {},
): Promise<ProcessedStats> {
  const { fromDate, toDate } = options
  
  // Process in parallel batches
  const BATCH_SIZE = 20
  for (let i = 0; i < sessionFiles.length; i += BATCH_SIZE) {
    const batch = sessionFiles.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(async sessionFile => {
      // Read JSONL file
      const messages = await readJSONLFile(sessionFile)
      
      // Extract stats
      // ...
    }))
  }
  
  return {
    dailyActivity: [...],
    dailyModelTokens: [...],
    modelUsage: {...},
    sessionStats: [...],
    hourCounts: {...},
    totalMessages: 0,
    totalSpeculationTimeSavedMs: 0,
  }
}
```

### 2. Get Claude Code Stats

```typescript
async function getClaudeCodeStats(options?: ProcessOptions): Promise<ClaudeCodeStats> {
  const cache = await loadStatsCache()
  const sessionFiles = await getSessionFiles()
  
  const processed = await processSessionFiles(sessionFiles, options)
  
  // Merge with cache
  const merged = mergeCacheWithNewStats(cache, processed)
  
  // Calculate streaks
  const streaks = calculateStreaks(merged.dailyActivity)
  
  return {
    totalSessions: merged.sessionStats.length,
    totalMessages: merged.totalMessages,
    streaks,
    dailyActivity: merged.dailyActivity,
    dailyModelTokens: merged.dailyModelTokens,
    modelUsage: merged.modelUsage,
    ...
  }
}
```

---

## 飞书卡片格式

### Stats Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📊 Stats Utils**\n\n---\n\n**Types**：\n• DailyActivity - date/messageCount/sessionCount/toolCallCount\n• DailyModelTokens - tokensByModel\n• StreakInfo - currentStreak/longestStreak\n• SessionStats - sessionId/duration/messageCount\n• ClaudeCodeStats - Full stats\n\n---\n\n**Functions**：\n• processSessionFiles(batch=20)\n• getClaudeCodeStats()\n• calculateStreaks()\n\n---\n\n**Features**：\n• Heatmap data\n• Model usage aggregation\n• Streak calculation\n• Peak activity analysis"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/stats-utils-state.json
{
  "stats": {
    "totalSessions": 0,
    "totalMessages": 0,
    "currentStreak": 0
  },
  "lastUpdate": "2026-04-12T11:15:00Z",
  "notes": "Stats Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| stats.ts (1060+ lines) | Skill + Stats |
| getClaudeCodeStats() | Get stats |
| processSessionFiles() | Process |
| StreakInfo | Streaks |

---

## 注意事项

1. **Batch processing**：20 files per batch
2. **Cache system**：statsCache.jsonl
3. **Streak calculation**：Current + longest
4. **Peak analysis**：Hour + day
5. **Shot distribution**：Ant-only feature gate

---

## 自动启用

此 Skill 在 stats collection 时自动运行。

---

## 下一步增强

- 飞书 stats 集成
- Stats analytics
- Stats debugging