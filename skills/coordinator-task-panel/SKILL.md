# Coordinator Task Panel Skill

Coordinator Task Panel - EvictAfter deadline + 1s tick eviction + Agent name registry + View/steer pattern。

## 功能概述

从Claude Code的CoordinatorAgentStatus提取的任务面板模式，用于OpenClaw的后台任务展示。

## 核心机制

### EvictAfter Deadline

```typescript
export function getVisibleAgentTasks(tasks: AppState['tasks']): LocalAgentTaskState[] {
  return Object.values(tasks).filter((t): t is LocalAgentTaskState => 
    isPanelAgentTask(t) && t.evictAfter !== 0
  ).sort((a, b) => a.startTime - b.startTime)
}
// Presence in AppState.tasks IS visibility
// evictAfter !== 0 check handles immediate dismiss (x key)
// Time-dependent eviction
```

### 1s Tick Eviction

```typescript
React.useEffect(() => {
  if (!hasTasks) return
  const interval = setInterval(() => {
    const now = Date.now()
    for (const t of Object.values(tasksRef.current)) {
      if (isPanelAgentTask(t) && (t.evictAfter ?? Infinity) <= now) {
        evictTerminalTask(t.id, setAppState)
      }
    }
    setTick(prev => prev + 1)
  }, 1000)
  return () => clearInterval(interval)
}, [hasTasks, setAppState])
// 1s tick: re-render for elapsed time + evict tasks past deadline
// Eviction deletes from prev.tasks
// useCoordinatorTaskCount sees updated count without own tick
```

### Agent Name Registry

```typescript
const agentNameRegistry = useAppState(s => s.agentNameRegistry)
const nameByAgentId = React.useMemo(() => {
  const inv = new Map<string, string>()
  for (const [n, id] of agentNameRegistry) inv.set(id, n)
  return inv
}, [agentNameRegistry])
// Invert registry: name → id → id → name
// Display agent names in panel
```

### View/Steer Pattern

```typescript
const viewingAgentTaskId = useAppState(s => s.viewingAgentTaskId)
const selectedIndex = tasksSelected ? coordinatorTaskIndex : undefined

<MainLine onClick={() => exitTeammateView(setAppState)} />
{visibleTasks.map((task, i) => 
  <AgentLine key={task.id} task={task} 
    isSelected={selectedIndex === i + 1} 
    isViewed={viewingAgentTaskId === task.id}
    onClick={() => enterTeammateView(task.id, setAppState)} 
  />
)}
// Enter to view/steer
// x to dismiss
// Selected vs viewed distinction
```

### MainLine + AgentLines

```typescript
<MainLine isSelected={selectedIndex === 0} isViewed={viewingAgentTaskId === undefined} />
{visibleTasks.map((task, i) => <AgentLine key={task.id} task={task} isSelected={selectedIndex === i + 1} />)}
// MainLine for coordinator view
// AgentLines for workers
// Index 0 = main, i+1 = agent
```

### Selection vs Viewing

```typescript
// isSelected = footerSelection === 'tasks' && coordinatorTaskIndex matches
// isViewed = viewingAgentTaskId matches
// Selected → keyboard focus
// Viewed → expanded detail view
// Two distinct states
```

### Hover State

```typescript
const [hover, setHover] = React.useState(false)
const prefix = isSelected || hover ? figures.pointer + " " : "  "
// Hover + selected → pointer prefix
// Visual feedback
```

## 实现建议

### OpenClaw适配

1. **evictAfter**: EvictAfter deadline
2. **tickEviction**: 1s tick eviction
3. **nameRegistry**: Agent name registry
4. **viewSteer**: View/steer pattern

### 状态文件示例

```json
{
  "evictAfterMs": 5000,
  "tickIntervalMs": 1000,
  "viewSteer": true,
  "agentNameRegistry": true
}
```

## 关键模式

### EvictAfter Deadline

```
evictAfter !== 0 → visible, evictAfter <= now → evict
// 时间驱动visibility
// 立即dismiss处理
```

### 1s Tick Eviction

```
setInterval(1000) → check deadline → evict → setTick re-render
// 自动清理过期任务
// 其他consumer无需tick
```

### Selection vs Viewing

```
isSelected = keyboard focus, isViewed = expanded detail
// 两个独立状态
// 不同交互含义
```

### Agent Name Inversion

```
agentNameRegistry: Map<name, id> → invert → Map<id, name>
// Registry反转显示
// Panel显示name
```

## 借用价值

- ⭐⭐⭐⭐⭐ EvictAfter deadline pattern
- ⭐⭐⭐⭐⭐ 1s tick eviction (centralized)
- ⭐⭐⭐⭐⭐ Selection vs viewing distinction
- ⭐⭐⭐⭐ Agent name registry inversion
- ⭐⭐⭐⭐ View/steer pattern

## 来源

- Claude Code: `components/CoordinatorAgentStatus.tsx`
- 分析报告: P40-2