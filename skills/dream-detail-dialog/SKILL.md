# Dream Detail Dialog Skill

Dream Detail Dialog - Visible turns limit + Hidden turn collapse + Keyboard shortcuts + Elapsed time hook。

## 功能概述

从Claude Code的DreamDetailDialog提取的dream任务详情模式，用于OpenClaw的长期任务展示。

## 核心机制

### Visible Turns Limit

```typescript
const VISIBLE_TURNS = 6
const visibleTurns = task.turns.filter(isVisible)
const shown = visibleTurns.slice(-VISIBLE_TURNS)
const hidden = visibleTurns.length - shown.length
// Render last 6 turns
// Earlier turns collapse to count
```

### Hidden Turn Collapse

```typescript
<Text dimColor>{hidden} earlier {plural(hidden, "turn", "turns")}</Text>
// Collapse hidden turns to count
// DimColor for non-focus
```

### Keyboard Shortcuts

```typescript
useKeybindings({ "confirm:yes": onDone }, { context: "Confirmation" })
const handleKeyDown = e => {
  if (e.key === " ") { e.preventDefault(); onDone() }
  if (e.key === "left" && onBack) { e.preventDefault(); onBack() }
  if (e.key === "x" && task.status === "running" && onKill) { e.preventDefault(); onKill() }
}
// Space → confirm
// Left → back
// x → kill (running only)
```

### Elapsed Time Hook

```typescript
const elapsedTime = useElapsedTime(task.startTime, task.status === "running", 1000, 0)
// Hook for elapsed time display
// Updates every 1s when running
// Stops when not running
```

### Dialog Pattern

```typescript
<Dialog title="Dream Task Details">
  <Byline>Started {elapsedTime} ago · {task.status}</Byline>
  {shown.map(turn => <TurnRow turn={turn} />)}
  {hidden > 0 && <Text dimColor>{hidden} earlier turns</Text>}
</Dialog>
// Dialog wrapper
// Byline for metadata
// Turn rows + hidden count
```

### Files Touched Count

```typescript
<Text>{task.filesTouched.length} {plural(task.filesTouched.length, "file", "files")} touched</Text>
// Files touched summary
// Plural helper
```

### Sessions Reviewing

```typescript
<Text dimColor>{task.sessionsReviewing} sessions reviewing</Text>
// Multi-session dream
// Review count
```

### Status-Based Actions

```typescript
// x → kill only when task.status === "running"
// Conditional actions based on status
// Prevent invalid operations
```

## 实现建议

### OpenClaw适配

1. **visibleLimit**: Visible turns limit
2. **hiddenCollapse**: Hidden turn collapse
3. **keyboardShortcuts**: Keyboard shortcuts
4. **elapsedHook**: Elapsed time hook

### 状态文件示例

```json
{
  "visibleTurns": 6,
  "updateIntervalMs": 1000,
  "keyboardShortcuts": {
    "confirm": "space",
    "back": "left",
    "kill": "x"
  }
}
```

## 关键模式

### Visible Turn Window

```
VISIBLE_TURNS = 6 → slice(-6) → last 6 turns
// 固定可见窗口
// 防止列表过长
```

### Hidden Collapse to Count

```
hidden turns → "N earlier turns" (dim)
// 隐藏部分合并为计数
// DimColor区分
```

### Status-Gated Actions

```
task.status === "running" → x enabled, else → x disabled
// 状态决定可用action
// 防止无效操作
```

### Elapsed Time Hook

```
useElapsedTime(startTime, running, 1000) → updates every 1s
// 动态elapsed显示
// Running时更新
```

## 借用价值

- ⭐⭐⭐⭐⭐ Visible turn window (6)
- ⭐⭐⭐⭐⭐ Hidden collapse to count
- ⭐⭐⭐⭐⭐ Status-gated actions
- ⭐⭐⭐⭐⭐ Elapsed time hook pattern
- ⭐⭐⭐⭐ Keyboard shortcut bindings

## 来源

- Claude Code: `components/tasks/DreamDetailDialog.tsx`
- 分析报告: P40-4