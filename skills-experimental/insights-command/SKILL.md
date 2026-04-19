# Insights Command Skill

使用洞察分析 - 远程主机收集 + 并行洞察生成 + HTML报告。

## 功能概述

从Claude Code的insights.ts提取的洞察分析，用于OpenClaw的使用统计。

## 核心机制

### 远程主机数据收集（Ant-only）

```typescript
// SCP from coder workspaces
await execFileNoThrow('scp', ['-rq', `${homespace}.coder:/root/.claude/projects/`, tempDir])

// Merge into local destination
destProjectName = `${projectName}__${homespace}`
// 唯一命名避免冲突
```

### Session Facets提取

```typescript
type SessionFacets = {
  underlying_goal: string
  goal_categories: Record<string, number>
  outcome: string
  user_satisfaction_counts: Record<string, number>
  claude_helpfulness: string
  session_type: string
  friction_counts: Record<string, number>
  // ...
}
```

### Multi-Clauding检测

```typescript
// 滑动窗口检测s1 → s2 → s1模式
const OVERLAP_WINDOW_MS = 30 * 60000  // 30分钟
// 计算overlap_events, sessions_involved
```

### 并行洞察生成（8 sections）

```typescript
const INSIGHT_SECTIONS = [
  'project_areas', 'interaction_style', 'what_works',
  'friction_analysis', 'suggestions', 'on_the_horizon',
  'cc_team_improvements', 'model_behavior_improvements', 'fun_ending'
]
await Promise.all(INSIGHT_SECTIONS.map(generateSectionInsight))
// 并行生成，最后生成at_a_glance
```

### HTML报告生成

```typescript
// Bar charts, histograms, time-of-day
generateBarChart(data, color, fixedOrder)
generateResponseTimeHistogram(times)
generateTimeOfDayChart(messageHours)
// CSS样式嵌入HTML
```

## 实现建议

### OpenClaw适配

1. **remoteCollect**: 远程数据收集
2. **facets**: Session facets提取
3. **parallelInsights**: 并行洞察生成
4. **htmlReport**: HTML可视化

### 状态文件示例

```json
{
  "totalSessions": 150,
  "facets": 120,
  "multiClauding": { "overlap_events": 5 },
  "insights": ["project_areas", "interaction_style"]
}
```

## 关键模式

### Parallel Section Generation

```typescript
await Promise.all(INSIGHT_SECTIONS.map(...))
// 8个section并行生成
// 最后生成at_a_glance（依赖其他section）
```

### Multi-Clauding Detection

```
滑动窗口：s1 → s2 → s1 pattern
// 30分钟窗口内交替使用多个session
```

### Cached Facets

```typescript
await loadCachedFacets(sessionId)
await saveFacets(facets)
// 缓存避免重复提取
```

## 借用价值

- ⭐⭐⭐⭐⭐ Parallel insights generation
- ⭐⭐⭐⭐⭐ Multi-clauding detection
- ⭐⭐⭐⭐⭐ Session facets extraction
- ⭐⭐⭐⭐ Remote host collection
- ⭐⭐⭐⭐ HTML report visualization

## 来源

- Claude Code: `commands/insights.ts` (40KB+)
- 分析报告: P37-6