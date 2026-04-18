# Background Task Skill

Background Task - Type discriminant + Activity limit truncate + Diamond icon status + Remote session progress。

## 功能概述

从Claude Code的BackgroundTask提取的后台任务模式，用于OpenClaw的任务显示。

## 核心机制

### Type Discriminant

```typescript
switch (task.type) {
  case "local_bash": {
    return <ShellProgress shell={task} />
  }
  case "remote_agent": {
    return <RemoteSessionProgress session={task} />
  }
}
// task.type as discriminant
// Different render per type
```

### Activity Limit Truncate

```typescript
const activityLimit = maxActivityWidth ?? 40
const truncated = truncate(task.description, activityLimit, true)
// Max activity width
// Truncate to fit terminal
```

### Diamond Icon Status

```typescript
const DIAMOND_OPEN = '◇'    // running
const DIAMOND_FILLED = '◆'  // completed
const running = task.status === "running" || task.status === "pending"
const icon = running ? DIAMOND_OPEN : DIAMOND_FILLED
// Visual status indicator
// Unicode diamond icons
```

### Remote Session Progress

```typescript
<Text dimColor>{DIAMOND_OPEN} </Text>
{truncate(task.title, activityLimit, true)}
<Text dimColor> · </Text>
<RemoteSessionProgress session={task} />
// Diamond + title + separator + progress
// DimColor for non-focus
```

### Monitor vs Command

```typescript
const displayText = task.kind === "monitor" 
  ? task.description 
  : task.command
// Monitor tasks → description
// Bash tasks → command
```

### Teammate Activity Description

```typescript
const activity = describeTeammateActivity(task)
// Helper for swarm/teammate tasks
// Human-readable activity
```

### Plural Helper

```typescript
plural(count, "turn", "turns")
plural(count, "file", "files")
// Pluralize based on count
// String utils
```

## 实现建议

### OpenClaw适配

1. **typeDiscriminant**: Type discriminant
2. **activityLimit**: Activity limit truncate
3. **diamondStatus**: Diamond icon status
4. **remoteProgress**: Remote session progress

### 状态文件示例

```json
{
  "activityLimit": 40,
  "statusIcons": {
    "running": "◇",
    "completed": "◆"
  },
  "truncate": true
}
```

## 关键模式

### Type-Based Rendering

```
switch (task.type) → local_bash → ShellProgress, remote_agent → RemoteSessionProgress
// 不同类型不同组件
// Discriminant pattern
```

### Activity Width Limit

```
maxActivityWidth ?? 40 → truncate → fit terminal
// 固定宽度限制
// 防止overflow
```

### Diamond Status Icons

```
◇ running/pending, ◆ completed/failed
// Unicode visual status
// DimColor非focus
```

### Monitor vs Command Display

```
kind === "monitor" → description, else → command
// 不同task kind不同显示文本
```

## 借用价值

- ⭐⭐⭐⭐⭐ Type discriminant rendering
- ⭐⭐⭐⭐⭐ Activity limit truncate
- ⭐⭐⭐⭐ Diamond status icons
- ⭐⭐⭐⭐ Monitor vs command distinction
- ⭐⭐⭐⭐ Remote session progress component

## 来源

- Claude Code: `components/tasks/BackgroundTask.tsx`
- 分析报告: P40-3