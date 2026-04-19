# Stats Result Type Skill

Stats Result Type - Discriminated Union (success/error/empty) + DATE_RANGE_ORDER + getNextDateRange + Never Reject Promise + Heatmap。

## 功能概述

从Claude Code的Stats.tsx提取的统计类型模式，用于OpenClaw的数据展示。

## 核心机制

### StatsResult Discriminated Union

```typescript
type StatsResult = {
  type: 'success'
  data: ClaudeCodeStats
} | {
  type: 'error'
  message: string
} | {
  type: 'empty'
}
// Discriminated union by type field
// success: has data
// error: has message
// empty: no additional fields
```

### DATE_RANGE_ORDER

```typescript
const DATE_RANGE_LABELS: Record<StatsDateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  all: 'All time'
}

const DATE_RANGE_ORDER: StatsDateRange[] = ['all', '7d', '30d']
// Labels for display
// Order for cycling
```

### getNextDateRange

```typescript
function getNextDateRange(current: StatsDateRange): StatsDateRange {
  const currentIndex = DATE_RANGE_ORDER.indexOf(current)
  return DATE_RANGE_ORDER[(currentIndex + 1) % DATE_RANGE_ORDER.length]!
}
// Cycle through date ranges
// all → 7d → 30d → all
```

### Never Reject Promise

```typescript
/**
 * Creates a stats loading promise that never rejects.
 * Always loads all-time stats for the heatmap.
 */
function createAllTimeStatsPromise(): Promise<StatsResult> {
  return aggregateClaudeCodeStatsForRange('all')
    .then((data): StatsResult => {
      if (!data || data.totalSessions === 0) {
        return { type: 'empty' }
      }
      return { type: 'success', data }
    })
    .catch((err): StatsResult => {
      return { type: 'error', message: err instanceof Error ? err.message : 'Failed' }
    })
}
// Promise never rejects
// Always returns StatsResult
// error → { type: 'error' }
```

### Heatmap Integration

```typescript
import { generateHeatmap } from '../utils/heatmap.js'
// Heatmap visualization
// Activity over time
// Visual stats display
```

### asciichart Plot

```typescript
import { plot as asciichart } from 'asciichart'
// ASCII chart for token usage
// Visual graph in terminal
// No external dependencies
```

### Stats Tabs

```typescript
import { Tab, Tabs, useTabHeaderFocus } from './design-system/Tabs.js'
// Tabs for different stats views
// 7d / 30d / all time
// Tab navigation
```

## 实现建议

### OpenClaw适配

1. **discriminatedUnion**: Discriminated Union type
2. **dateRangeOrder**: DATE_RANGE_ORDER
3. **neverReject**: Never reject promise
4. **heatmap**: Heatmap integration

### 状态文件示例

```json
{
  "statsResult": "success",
  "dateRange": "7d",
  "totalSessions": 150,
  "heatmapEnabled": true
}
```

## 关键模式

### Discriminated Union

```
{ type: 'success', data } | { type: 'error', message } | { type: 'empty' }
// type字段作为discriminant
// 每种类型不同字段
```

### Cycle Pattern

```
getNextDateRange → all → 7d → 30d → all (cycle)
// 循环切换date range
// ORDER决定顺序
```

### Never Reject Pattern

```
.then() + .catch() → always returns StatsResult → never rejects
// Promise永不reject
// 错误转为{ type: 'error' }
```

### Heatmap + ASCII Chart

```
generateHeatmap + asciichart → visual stats
// Heatmap显示活动
// ASCII chart显示token曲线
```

## 借用价值

- ⭐⭐⭐⭐⭐ StatsResult discriminated union
- ⭐⭐⭐⭐⭐ Never reject promise pattern
- ⭐⭐⭐⭐⭐ DATE_RANGE_ORDER cycle
- ⭐⭐⭐⭐ Heatmap integration
- ⭐⭐⭐⭐ asciichart plot

## 来源

- Claude Code: `components/Stats.tsx`
- 分析报告: P42-4