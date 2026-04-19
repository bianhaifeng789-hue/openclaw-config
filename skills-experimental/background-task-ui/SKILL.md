---
name: background-task-ui
description: "Background Task UI - Integrate background task visualization with Feishu cards. Shows running tasks, progress, and completion status. Use when [background task ui] is needed."
metadata:
  openclaw:
    emoji: "⚙️"
    triggers: [task-start, task-progress, task-complete]
    feishuCard: true
    imports:
      - impl/utils/background-task-utils.ts
---

# Background Task UI Skill

整合后台任务可视化到飞书卡片。

## 快速使用

### 1. 注册任务

```typescript
import { registerTask, updateProgress, completeTask, createTaskCard } from './background-task-utils'

// 启动记忆维护任务
const task = registerTask('memory_maintenance')

// 立即发送启动卡片
const startCard = createTaskCard(task)
await message({ action: 'send', card: startCard })
```

### 2. 更新进度

```typescript
// 更新进度（30%）
updateProgress(task.id, 30, '正在读取会话记录...')

// 发送进度卡片（间隔至少 3 秒）
const progressCard = createTaskCard(task)
await message({ action: 'send', card: progressCard })
```

### 3. 完成任务

```typescript
// 完成任务
completeTask(task.id, '更新了 MEMORY.md Current Focus 和 Learnings 区块')

// 发送完成卡片
const completeCard = createTaskCard(task, '更新了 MEMORY.md...')
await message({ action: 'send', card: completeCard })
```

---

## 在 Heartbeat 中使用

```typescript
// heartbeat 检查时
import { checkActiveTasks } from './background-task-utils'

const { hasActive, card, runningCount } = checkActiveTasks()

if (hasActive) {
  // 有活动任务，发送汇总卡片
  await message({ 
    action: 'send',
    card: card
  })
  
  // 返回活动状态（不是 HEARTBEAT_OK）
  return `有 ${runningCount} 个后台任务正在运行`
}

// 无活动任务，正常返回
return 'HEARTBEAT_OK'
```

---

## 卡片类型

### 启动卡片（蓝色）

```
⚙️ 后台任务启动

记忆维护

任务 ID: bg-1-xxx
状态: 运行中

预计耗时：1-2 分钟
```

### 进度卡片（浅蓝）

```
⚙️ 后台任务进度

🔄 记忆维护

进度: [███░░░░░░░] 30%
耗时: 45秒

正在处理...
```

### 完成卡片（绿色）

```
✅ 任务完成

✅ 记忆维护 完成

耗时: 2分钟
结果:
- 更新 Current Focus
- 更新 Learnings

[查看 MEMORY.md]
```

### 汇总卡片（多任务）

```
⚙️ 后台任务 (2 运行中)

🔄 记忆维护 [███░░░░░░░] 30%
🔄 洞察分析 [█░░░░░░░░░] 10%
✅ 上次分析 已完成

总计: 5 | 完成: 3 | 失败: 0
```

---

## 状态图标

| 状态 | 图标 | 说明 |
|-----|-----|-----|
| pending | ⏳ | 等待中 |
| running | 🔄 | 运行中 |
| completed | ✅ | 已完成 |
| failed | ❌ | 失败 |
| cancelled | 🚫 | 已取消 |

---

## 任务类型

| 类型 | 中文名 | 说明 |
|-----|-------|-----|
| memory_maintenance | 记忆维护 | 更新 MEMORY.md |
| insights_analysis | 洞察分析 | 分析用户模式 |
| dream_task | 记忆整合 | 长期记忆整理 |
| cron_task | 定时任务 | 定时执行 |
| subagent | 子代理任务 | sessions_spawn |
| compact | 上下文压缩 | Context compact |
| tool_run | 工具执行 | 工具调用 |

---

## 借鉴 Claude Code

| Claude Code | OpenClaw 飞书 |
|-------------|--------------|
| `registerTask()` | `registerTask()` |
| `updateTaskState()` | `updateProgress()` |
| `AppState.tasks` | `memory/heartbeat-state.json taskTracker` |
| Footer pill | 飞书卡片消息 |
| Shift+Down dialog | 卡片交互按钮 |
| DreamTaskState | BackgroundTask |

---

## 配置

```yaml
backgroundTaskUI:
  enabled: true
  showProgress: true       # 显示进度条
  showResult: true         # 显示结果
  notifyOnFailure: true    # 失败时通知
  updateIntervalMs: 3000   # 最小更新间隔
  compactMode: false       # 简洁模式（只显示完成）
```

---

## 示例：记忆维护流程

```typescript
// 1. 注册任务
const task = registerTask('memory_maintenance')

// 2. 发送启动卡片
await message({ action: 'send', card: createTaskCard(task) })

// 3. 执行步骤
updateProgress(task.id, 20, '读取最近会话...')
// ... 实际读取逻辑

updateProgress(task.id, 50, '提取关键信息...')
// ... 实际提取逻辑

updateProgress(task.id, 80, '更新 MEMORY.md...')
// ... 实际更新逻辑

// 4. 完成任务
completeTask(task.id, '更新了 Current Focus, Learnings, User Profile')

// 5. 发送完成卡片
await message({ 
  action: 'send',
  card: createTaskCard(task, '更新了...')
})
```

---

## 与 sessions_spawn 整合（Phase 2）

```typescript
// 未来：追踪子代理任务
const subagentTask = registerTask('subagent')

// 使用 sessions_spawn
const session = await sessions_spawn({
  task: '...',
  runtime: 'subagent'
})

// 更新进度
updateProgress(subagentTask.id, 30)

// sessions 完成后
completeTask(subagentTask.id, result)
```

---

## 注意事项

1. **避免频繁发送**：同一任务至少间隔 3 秒
2. **简洁摘要**：不展示完整日志
3. **重要任务才通知**：过滤低优先级
4. **更新现有卡片**：用 cardMessageId 更新而非新建

---

## 自动执行

此 Skill 在后台任务启动/进度/完成时自动执行，无需手动调用。