---
name: stats-cache
description: "Persisted stats cache on disk. Daily aggregates (activity, model tokens). Model usage tracking. Session aggregates. Lock mechanism (concurrent prevention). Cache migration. Use when [stats cache] is needed."
metadata:
  openclaw:
    emoji: "📊"
    triggers: [stats-update, daily-aggregate]
    feishuCard: true
---

# Stats Cache Skill - 统计数据缓存

持久化统计数据到磁盘，带 Lock mechanism。

## 为什么需要这个？

**场景**：
- 统计数据持久化
- Daily aggregates
- Model usage tracking
- Concurrent prevention
- Cache migration

**Claude Code 方案**：statsCache.ts + Lock + Migration
**OpenClaw 飞书适配**：统计缓存 + Lock

---

## Cache 结构

```typescript
type PersistedStatsCache = {
  version: number
  lastComputedDate: string | null
  dailyActivity: DailyActivity[]
  dailyModelTokens: DailyModelTokens[]
  modelUsage: { [modelName: string]: ModelUsage }
  totalSessions: number
  totalMessages: number
  longestSession: SessionStats | null
  firstSessionDate: string | null
  hourCounts: { [hour: number]: number }
  totalSpeculationTimeSavedMs: number
  shotDistribution?: { [shotCount: number]: number }
}

type DailyActivity = {
  date: string
  messages: number
  tokens: number
}

type DailyModelTokens = {
  date: string
  model: string
  inputTokens: number
  outputTokens: number
}
```

---

## Lock Mechanism

```typescript
let statsCacheLockPromise: Promise<void> | null = null

async function withStatsCacheLock<T>(fn: () => Promise<T>): Promise<T> {
  // Wait for existing lock
  while (statsCacheLockPromise) {
    await statsCacheLockPromise
  }
  
  // Create lock
  let releaseLock: (() => void) | undefined
  statsCacheLockPromise = new Promise<void>(resolve => {
    releaseLock = resolve
  })
  
  try {
    return await fn()
  } finally {
    // Release lock
    statsCacheLockPromise = null
    releaseLock?.()
  }
}
```

---

## 处理流程

### 1. Load Cache

```typescript
async function loadStatsCache(): PersistedStatsCache {
  const path = getStatsCachePath()
  
  try {
    const content = await readFile(path, 'utf-8')
    const cache = jsonParse(content)
    
    // Check version
    if (cache.version !== STATS_CACHE_VERSION) {
      return migrateStatsCache(cache)
    }
    
    return cache
  } catch {
    return getEmptyCache()
  }
}
```

### 2. Save Cache

```typescript
async function saveStatsCache(cache: PersistedStatsCache): void {
  await withStatsCacheLock(async () => {
    const path = getStatsCachePath()
    await writeFile(path, jsonStringify(cache))
  })
}
```

---

## 飞书卡片格式

### Stats Cache Status 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📊 Stats Cache Status**\n\n---\n\n**缓存信息**：\n\n| 属性 | 值 |\n|------|------|\n| **版本** | 3 |\n| **最后计算日期** | 2026-04-11 |\n| **总 Sessions** | 150 |\n| **总 Messages** | 5000 |\n\n---\n\n**Daily Activity**：\n• 2026-04-11：200 messages, 50k tokens\n• 2026-04-10：180 messages, 45k tokens\n• ...（30 days）\n\n---\n\n**Model Usage**：\n• claude-sonnet-4：60% \n• claude-opus-4：40%\n\n---\n\n**Peak Hours**：\n• 10:00：150 sessions\n• 14:00：120 sessions\n• ..."
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/stats-cache-state.json
{
  "cache": {
    "version": 3,
    "lastComputedDate": null,
    "dailyActivity": [],
    "dailyModelTokens": [],
    "modelUsage": {},
    "totalSessions": 0,
    "totalMessages": 0,
    "longestSession": null,
    "firstSessionDate": null,
    "hourCounts": {},
    "totalSpeculationTimeSavedMs": 0
  },
  "config": {
    "cacheFilename": "stats-cache.json",
    "version": 3,
    "maxDailyEntries": 90
  },
  "lastUpdate": "2026-04-12T00:30:00Z",
  "notes": "Stats Cache Skill 创建完成。等待 stats 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| statsCache.ts | Skill + Lock |
| withStatsCacheLock() | Lock wrapper |
| PersistedStatsCache | Cache type |
| migrateStatsCache() | Migration |
| STATS_CACHE_VERSION | Version 3 |

---

## 注意事项

1. **Lock mechanism**：防止并发写入
2. **Version check**：检查版本，迁移旧版本
3. **Bounded entries**：限制 daily entries（90 days）
4. **Model usage**：追踪 model 使用
5. **Hour counts**：Peak hour 计算

---

## 自动启用

此 Skill 在 stats update 时自动触发。

---

## 下一步增强

- 飞书 Heatmap 展示
- Weekly/Monthly aggregates
- Trend analysis