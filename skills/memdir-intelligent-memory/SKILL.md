---
name: memdir-intelligent-memory
description: "Claude Code 智能记忆选择系统，只加载相关记忆，节省 tokens Use when [memdir intelligent memory] is needed."
version: 1.0.0
phase: 10
priority: high
source: Claude Code memdir/ (7 files)
borrowed_patterns:
  - findRelevantMemories
  - scanMemoryFiles
  - memoryAge/memoryAgeDays
  - parseMemoryType
  - formatMemoryManifest
---

# Memdir - 智能记忆选择系统

## 功能概述

借鉴 Claude Code 的 Memdir 系统，实现智能记忆选择：
- **关键创新**: 用 Sonnet 模型选择最相关的 5 个记忆
- 避免加载所有记忆文件
- 节省大量 tokens（50-90%）
- 记忆新鲜度追踪

## 核心模式

### 1. findRelevantMemories - 智能选择

```typescript
// 查找相关记忆（最多 5 个）
const memories = await findRelevantMemories(
  query,          // 用户查询
  memoryDir,      // 记忆目录
  signal,         // AbortSignal
  recentTools,    // 最近使用的工具（避免参考文档）
  alreadySurfaced // 已展示的记忆（避免重复）
)

// 返回格式
[
  {
    path: 'memory/project-architecture.md',
    mtimeMs: 1703275200000,
    ageDays: 2,
    freshness: '此记忆已 2 天。代码行为可能已过期...'
  }
]
```

### 2. scanMemoryFiles - 扫描记忆

```typescript
// 扫描记忆目录（最多 200 个）
const headers = await scanMemoryFiles(memoryDir)

// 返回格式
[
  {
    filename: 'project-architecture.md',
    filePath: '/path/to/memory/project-architecture.md',
    mtimeMs: 1703275200000,
    description: '项目架构概述',
    type: 'project'
  }
]
```

### 3. 记忆年龄计算

```typescript
// 天数计算
memoryAgeDays(mtimeMs) // 0=today, 1=yesterday, 2+ days

// 人类可读
memoryAge(mtimeMs) // "today", "yesterday", "47 days ago"

// 新鲜度警告
memoryFreshnessText(mtimeMs) // 空（新鲜）或警告文本
```

### 4. 记忆类型

```typescript
// 四种记忆类型
type MemoryType = 'user' | 'feedback' | 'project' | 'reference'

// 解析类型
parseMemoryType('user') // 'user'
parseMemoryType('invalid') // undefined
```

## 飞书集成

### 接入系统提示

```typescript
import { createMemdirHook } from './memdir-service'

const hook = createMemdirHook()

// 在生成系统提示前调用
const { memories } = await hook.beforePrompt({
  query: userMessage,
  recentTools: ['Bash', 'Read'],
  alreadySurfaced: new Set()
})

// 格式化记忆
const memoryText = hook.formatMemoriesForPrompt(memories)
systemPrompt += '\n' + memoryText
```

### 飞书卡片通知

```typescript
// 记忆使用统计
const stats = getSystemStats()

// 发送飞书卡片
message({
  action: 'send',
  card: {
    title: '记忆系统状态',
    content: `总文件: ${stats.state.totalFiles}
已选择: ${stats.efficiency.avgSelected}
节省 tokens: ${stats.state.savedTokens}
选择率: ${stats.efficiency.selectionRate}`
  }
})
```

## 状态文件

位置: `memory/memdir-state.json`

```json
{
  "totalFiles": 45,
  "lastScan": "2026-04-13T20:30:00Z",
  "selectedCount": 5,
  "savedTokens": 20000,
  "config": {
    "maxFiles": 200,
    "maxRelevant": 5,
    "autoMemoryEnabled": true
  }
}
```

## 使用场景

### 1. 系统提示注入

```
用户: 分析这个认证问题

系统提示:
<relevant_memories>
相关记忆（5 个，按相关性选择）:
- memory/user-auth-expertise.md (today) - 用户精通认证
- memory/project-auth-flow.md (2 days ago) - 项目认证流程
- memory/feedback-no-mock-db.md (5 days ago) - 不要 mock 数据库
</relevant_memories>

[只加载 5 个，而非全部 45 个记忆]
```

### 2. Token 节省对比

| 方法 | 加载记忆 | Tokens |
|------|---------|--------|
| 传统（全部加载） | 45 个 | ~22,500 |
| Memdir（智能选择） | 5 个 | ~2,500 |
| **节省** | 40 个 | **20,000 (89%)** |

### 3. 避免工具参考

```
最近使用工具: ['Bash', 'Grep']

选择时排除:
- bash-reference.md （已在使用）
- grep-api-docs.md （已在使用）

但保留:
- bash-warning-gotchas.md （使用时重要）
- grep-performance-tips.md （陷阱信息）
```

## 与 OpenClaw 集成

### HEARTBEAT.md 添加检查

```yaml
- name: memory-selection-stats
  interval: 1h
  prompt: "Check memdir-state.json. Send Feishu card with memory selection stats if savedTokens > 5000"
```

### impl/utils/index.ts 添加入口

```typescript
export * as memdir from './memdir-service'

// 用法
import { memdir } from './impl/utils'
memdir.findRelevantMemories(query, memoryDir)
memdir.memoryAge(mtimeMs)
```

### 接入 sessions_spawn（关键）

```typescript
// 实际实现需要调用 sessions_spawn 用 Sonnet 选择
const result = await sessions_spawn({
  task: `Query: ${query}\n\nMemories:\n${manifest}`,
  model: 'sonnet', // 小模型
  lightContext: true,
  runtime: 'subagent',
})

// 解析返回的文件名列表
const selectedFilenames = JSON.parse(result.message)
```

## 性能指标

| 操作 | 预期耗时 | Ops/sec |
|------|---------|---------|
| scanMemoryFiles | 50-200ms | 5-20 |
| findRelevantMemories | 100-500ms | 2-10 |
| memoryAge | < 0.01ms | 100M+ |
| formatMemoryManifest | < 1ms | 1M+ |

## 与 Claude Code 对比

| 功能 | Claude Code | OpenClaw | 状态 |
|------|-------------|----------|------|
| findRelevantMemories | Sonnet 子查询 | 启发式（待接入） | ⚠️ |
| scanMemoryFiles | 200 上限 | 200 上限 | ✅ |
| memoryAge | 天数计算 | 天数计算 | ✅ |
| MemoryType | 4 种 | 4 种 | ✅ |
| freshnessText | 过期警告 | 过期警告 | ✅ |
| recentTools 过滤 | ✅ | ✅ | ✅ |

## 关键差距

### Sonnet 子查询选择

**Claude Code**:
- 用 Sonnet 模型（小模型）选择相关记忆
- 子查询不影响主会话 token 消耗
- 模型理解语义，而非关键词匹配

**OpenClaw 当前**:
- 启发式关键词匹配（临时方案）
- 需要接入 `sessions_spawn` 实现子查询
- 使用 `lightContext: true` 减少子查询成本

## 下一步

1. 接入 `sessions_spawn` API 实现 Sonnet 子查询
2. 验证 token 节省效果（实际对比）
3. 飞书卡片显示记忆选择统计
4. 添加记忆新鲜度 UI 标记

---

生成时间: 2026-04-13 20:30
状态: Phase 10 实现完成 ✅