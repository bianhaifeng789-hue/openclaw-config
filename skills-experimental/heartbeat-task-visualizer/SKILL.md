---
name: heartbeat-task-visualizer
description: "Visualize background tasks during heartbeat checks. Send Feishu cards to show task status, progress, and results. Use when visualizing heartbeat tasks, showing active work, or monitoring health."
metadata:
  openclaw:
    emoji: "⚙️"
    triggers: [heartbeat]
    priority: high
    feishuCard: true
---

# Heartbeat Task Visualizer Skill

心跳时检查后台任务状态，发送飞书卡片更新。

## 为什么需要

**问题**：
- 用户看不到后台任务在做什么
- Claude Code 有 Footer pill + Shift+Down dialog
- OpenClaw 飞书用户缺少可视化

**解决**：
- 在 heartbeat 检查时发送飞书卡片
- 显示运行中的任务状态
- 显示最近完成的任务结果

---

## 执行流程

### 1. Heartbeat 触发

```
每 ~30 分钟 heartbeat 检查：
→ 检查 memory/heartbeat-state.json lastTaskUpdate
→ 如果有活动任务，发送飞书卡片
```

### 2. 任务状态检查

```
调用 getRunningTasks() → 返回运行中任务列表
→ 生成卡片（createTasksSummaryCard）
→ 通过 message 工具发送
```

### 3. 卡片更新策略

```
策略：避免频繁更新
→ 同一任务：至少间隔 3 秒更新一次
→ 多任务：汇总显示，不单独发送
→ 完成时：发送完成卡片
```

---

## 任务类型映射

| Claude Code | OpenClaw 飞书 |
|-------------|--------------|
| DreamTask | 记忆整合 |
| LocalAgentTask | 子代理任务 |
| LocalShellTask | Shell 任务 |
| RemoteAgentTask | 远程代理 |
| MonitorMcpTask | MCP 监控 |

---

## 飞书卡片格式

### 活动任务卡片

```json
{
  "config": {"wide_screen_mode": true},
  "header": {
    "title": {"tag": "plain_text", "content": "⚙️ 后台任务 (2 运行中)"},
    "template": "blue"
  },
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "🔄 记忆维护 `[███░░░░░░░]` 30%\n🔄 洞察分析 `[█░░░░░░░░░]` 10%"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "总计: 5 | 完成: 3 | 失败: 0"}
      ]
    }
  ]
}
```

### 完成卡片

```json
{
  "config": {"wide_screen_mode": true},
  "header": {
    "title": {"tag": "plain_text", "content": "✅ 任务完成"},
    "template": "green"
  },
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**✅ 记忆维护 完成**\n\n耗时: 2分钟\n结果:\n- 更新 Current Focus\n- 更新 Learnings"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "查看 MEMORY.md"},
          "type": "primary",
          "value": {"action": "view_memory"}
        }
      ]
    }
  ]
}
```

---

## 状态追踪

```json
// memory/heartbeat-state.json 新增字段
{
  "taskTracker": {
    "activeTasks": [
      {
        "id": "bg-1-1234567890",
        "name": "memory_maintenance",
        "progress": 30,
        "status": "running",
        "startedAt": 1234567890
      }
    ],
    "cardMessageId": "om_xxx",  // 当前卡片消息 ID
    "lastUpdate": 1234567891,
    "taskResults": {
      "bg-1-1234567890": "正在更新 MEMORY.md..."
    }
  }
}
```

---

## 代码位置

- `impl/utils/background-task-service.ts` - 任务管理
- `impl/utils/background-task-card.ts` - 卡片生成
- `impl/utils/task-tracker.ts` - 整合器

---

## 执行示例

### Example 1: 活动任务检查

```typescript
// heartbeat 执行时
const runningTasks = getRunningTasks()

if (runningTasks.length > 0) {
  const card = createTasksSummaryCard(runningTasks)
  
  // 使用 message 工具发送
  await message({
    action: 'send',
    card: card
  })
}
```

### Example 2: 任务完成通知

```typescript
// 任务完成时
completeTask('bg-1-xxx', '更新了 MEMORY.md')

// 自动发送完成卡片
const task = getTask('bg-1-xxx')
const card = createTaskCard(task, '更新了 MEMORY.md')

await message({
  action: 'send',
  card: card
})
```

---

## 与 Claude Code 的对比

| Claude Code | OpenClaw 飞书 |
|-------------|--------------|
| AppState.tasks | memory/heartbeat-state.json |
| Footer pill | 飞书卡片消息 |
| Shift+Down dialog | 卡片交互按钮 |
| updateTaskState() | taskTracker.updateProgress() |
| registerTask() | taskTracker.registerTask() |

---

## 注意事项

1. **避免频繁发送**：至少间隔 3 秒
2. **简洁摘要**：不展示完整日志
3. **重要任务才通知**：过滤低优先级任务
4. **用户可关闭**：提供配置选项

---

## 自动执行

此 Skill 在 heartbeat 检查时自动执行，无需手动触发。

---

## 配置

```yaml
taskVisualizer:
  enabled: true
  showProgress: true       # 显示进度
  showResult: true         # 显示结果
  notifyOnFailure: true    # 失败通知
  updateIntervalMs: 3000   # 更新间隔
  compactMode: false       # 简洁模式
```

---

## 下一步

- 添加任务取消功能（飞书按钮交互）
- 添加任务历史记录查看
- 整合 sessions_spawn 的子代理追踪