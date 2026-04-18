# Context Visualization Skill

Context Visualization - SOURCE_DISPLAY_ORDER + groupBySource + CollapseStatus + RESERVED_CATEGORY_NAME + isMeta placeholders。

## 功能概述

从Claude Code的ContextVisualization提取的上下文可视化模式，用于OpenClaw的token使用展示。

## 核心机制

### SOURCE_DISPLAY_ORDER

```typescript
// Order for displaying source groups: Project > User > Managed > Plugin > Built-in
const SOURCE_DISPLAY_ORDER = ['Project', 'User', 'Managed', 'Plugin', 'Built-in']
// Display priority order
// Project settings highest priority
// Built-in lowest
```

### groupBySource

```typescript
/** Group items by source type for display, sorted by tokens descending within each group */
function groupBySource<T extends {
  source: SettingSource | 'plugin' | 'built-in'
  tokens: number
}>(items: T[]): Map<string, T[]> {
  // Group by source
  // Sort by tokens descending within group
  // Map<source, items[]>
}
// Type constraint: source + tokens fields
// Descending token sort
```

### CollapseStatus

```typescript
/**
 * One-liner for legend header showing what context-collapse has done.
 * Returns null when nothing's summarized/staged (avoid visual noise).
 * This is the one place user can see context was rewritten.
 */
function CollapseStatus() {
  const s = getStats()
  const parts = []
  
  if (s.collapsedSpans > 0) {
    parts.push(`${s.collapsedSpans} spans summarized (${s.collapsedMessages} msgs)`)
  }
  if (s.stagedSpans > 0) {
    parts.push(`${s.stagedSpans} staged`)
  }
  
  // Health monitoring
  if (h.totalErrors > 0) {
    return <Text color="warning">Collapse errors: {h.totalErrors}/{h.totalSpawns} spawns failed</Text>
  }
  if (h.emptySpawnWarningEmitted) {
    return <Text color="warning">Collapse idle: {h.totalEmptySpawns} consecutive empty runs</Text>
  }
}
// collapsedSpans + stagedSpans
// health: totalErrors + totalSpawns + lastError
// emptySpawnWarningEmitted
```

### RESERVED_CATEGORY_NAME

```typescript
const RESERVED_CATEGORY_NAME = 'Autocompact buffer'
// Reserved for autocompact
// Special handling
// Not user-configurable
```

### isMeta Placeholders

```typescript
// <collapsed> placeholders are isMeta and don't appear in conversation view
// isMeta: true → hidden from conversation
// Only visible in CollapseStatus
// One place to see context rewritten
```

### Feature Flag Check

```typescript
if (feature("CONTEXT_COLLAPSE")) {
  const { getStats, isContextCollapseEnabled } = require("../services/contextCollapse/index.js")
  if (!isContextCollapseEnabled()) return null
  // ...
}
return null
// Feature flag: CONTEXT_COLLAPSE
// Dynamic require
// Enabled check
```

## 实现建议

### OpenClaw适配

1. **sourceDisplayOrder**: SOURCE_DISPLAY_ORDER
2. **groupBySource**: 按source分组
3. **collapseStatus**: CollapseStatus
4. **reservedCategory**: RESERVED_CATEGORY_NAME

### 状态文件示例

```json
{
  "sourceDisplayOrder": ["Project", "User", "Managed", "Plugin", "Built-in"],
  "reservedCategory": "Autocompact buffer",
  "collapsedSpans": 5,
  "stagedSpans": 2
}
```

## 关键模式

### Source Priority Order

```
Project > User > Managed > Plugin > Built-in → display order
// 项目设置最高优先级
// Built-in最低
```

### Token Descending Sort

```
groupBySource → Map<source, items[]> → tokens descending
// 按source分组
// 组内按token降序
```

### Collapse Health Monitoring

```
totalErrors/totalSpawns → error rate, emptySpawnWarningEmitted → idle warning
// 崩溃spawn错误率
// 连续空spawn警告
```

### Visual Noise Avoidance

```
nothing summarized/staged → return null → avoid visual noise
// 无摘要时返回null
// 避免视觉噪音
```

### isMeta Hidden

```
<collapsed> placeholders → isMeta → hidden from conversation
// 元消息不显示在conversation
// 只有CollapseStatus可见
```

## 借用价值

- ⭐⭐⭐⭐⭐ SOURCE_DISPLAY_ORDER pattern
- ⭐⭐⭐⭐⭐ groupBySource + token sort
- ⭐⭐⭐⭐⭐ CollapseStatus health monitoring
- ⭐⭐⭐⭐ RESERVED_CATEGORY_NAME
- ⭐⭐⭐⭐ isMeta placeholder pattern

## 来源

- Claude Code: `components/ContextVisualization.tsx`
- 分析报告: P41-6