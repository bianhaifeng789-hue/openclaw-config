# Task List Tool Skill

任务列表工具 - Resolved filter + Owner display + Block visualization。

## 功能概述

从Claude Code的TaskListTool提取的任务列表模式，用于OpenClaw的任务系统。

## 核心机制

### Resolved Task Filter

```typescript
const resolvedTaskIds = new Set(
  allTasks.filter(t => t.status === 'completed').map(t => t.id)
)

const blockedBy = task.blockedBy.filter(id => !resolvedTaskIds.has(id))
// completed tasks不再显示在blockedBy中
// 过滤resolved blockers
```

### Internal Metadata Filter

```typescript
const allTasks = (await listTasks(taskListId)).filter(t => !t.metadata?._internal)
// _internal标记的任务不显示
// 隐藏系统任务
```

### Owner Display

```typescript
const owner = task.owner ? ` (${task.owner})` : ''
// 有owner → 显示owner
// 队友归属可视化
```

### Block Visualization

```typescript
const blocked = task.blockedBy.length > 0
  ? ` [blocked by ${task.blockedBy.map(id => `#${id}`).join(', ')}]`
  : ''
// blockedBy可视化
// #ID格式
```

### Output Format

```typescript
const lines = tasks.map(task =>
  `#${task.id} [${task.status}] ${task.subject}${owner}${blocked}`
)
// #ID [status] subject (owner) [blocked by #x, #y]
// 紧凑可视化
```

### Empty Result

```typescript
if (tasks.length === 0) {
  return { content: 'No tasks found' }
}
// 空列表友好提示
```

## 实现建议

### OpenClaw适配

1. **resolvedFilter**: Completed任务过滤
2. **internalFilter**: _internal过滤
3. **ownerDisplay**: Owner显示
4. **blockViz**: Block可视化

### 状态文件示例

```json
{
  "tasksCount": 5,
  "resolvedFiltered": 2,
  "internalFiltered": 1,
  "ownerDisplayed": 3
}
```

## 关键模式

### Resolved Blocker Filter

```
completed tasks → Set → blockedBy.filter(!Set.has)
// 不显示已完成blockers
// 减少噪音
```

### Internal Task Hide

```
metadata._internal = true → filter out
// 系统任务隐藏
// 用户只看业务任务
```

### Compact Format

```
#ID [status] subject (owner) [blocked by #x]
// 一行一个任务
// 快速扫描
```

## 借用价值

- ⭐⭐⭐⭐ Resolved blocker filter
- ⭐⭐⭐⭐ Internal metadata filter
- ⭐⭐⭐⭐ Owner/block visualization
- ⭐⭐⭐ Compact output format

## 来源

- Claude Code: `tools/TaskListTool/TaskListTool.ts` (4KB)
- 分析报告: P38-23