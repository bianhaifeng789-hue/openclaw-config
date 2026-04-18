---
name: background-tasks
description: "Visualize background tasks (memory maintenance, insights analysis, etc.) via Feishu cards. Shows what's happening behind the scenes to build user trust. Use when spawning background work, managing long-running tasks, or checking task status."
metadata:
  openclaw:
    emoji: "⚙️"
    triggers: [task-start, task-progress, task-complete]
    feishuCard: true
---

# Background Tasks UI Skill - 后台任务可视化

用飞书卡片展示后台任务状态，让用户看到系统在做什么。

## 为什么需要这个？

**问题**：用户看不到后台在做什么
- 记忆维护在运行，但用户不知道
- 洞察分析在执行，但用户看不到进度
- 用户可能觉得系统"没做事"

**解决**：用飞书卡片透明展示后台任务状态

---

## 任务类型

| 任务 | 说明 | 触发频率 |
|------|------|----------|
| `memory_maintenance` | 记忆维护 | 2-4 小时 |
| `insights_analysis` | 洞察分析 | 4-6 小时 |
| `dream_task` | 记忆整合（类似 Claude Code auto-dream） | 24 小时 |
| `cron_task` | 定时任务 | 按配置 |

---

## 任务状态

```typescript
interface BackgroundTaskState {
  type: 'memory_maintenance' | 'insights_analysis' | 'dream_task' | 'cron_task'
  status: 'pending' | 'running' | 'completed' | 'failed'
  startTime: string
  endTime?: string
  progress?: {
    current: number
    total: number
    description: string
  }
  result?: string
  error?: string
}
```

---

## 飞书卡片格式

### 任务开始卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚙️ 后台任务启动**\n\n🟡 正在执行：记忆维护\n\n**任务**：读取最近会话 → 提取关键信息 → 更新 MEMORY.md"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "预计耗时：1-2 分钟"}
      ]
    }
  ]
}
```

### 任务进度卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⚙️ 后台任务进度**\n\n🟡 记忆维护\n\n**进度**：`███░░░░░░░` 30%\n\n✓ 读取最近会话\n✓ 提取关键信息\n→ 更新 MEMORY.md..."
      }
    }
  ]
}
```

### 任务完成卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**✅ 后台任务完成**\n\n✓ 记忆维护已完成\n\n**结果**：\n- 更新了 Current Focus 区块\n- 更新了 Learnings 区块\n- 下次检查：> 2 小时后"
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

## 执行流程

### 1. 任务启动

```
Agent:
1. 检查 heartbeat 触发条件
2. 如果满足，启动后台任务
3. 立即发送飞书卡片："⚙️ 后台任务启动"
4. 更新 memory/background-tasks-state.json
```

### 2. 任务进度

```
Agent:
1. 执行任务各步骤
2. 每完成关键步骤，发送进度卡片
3. 更新进度百分比
4. 继续执行直到完成
```

### 3. 任务完成

```
Agent:
1. 完成所有步骤
2. 发送完成卡片："✅ 后台任务完成"
3. 展示结果摘要
4. 更新状态文件
```

---

## 持久化存储

```json
// memory/background-tasks-state.json
{
  "activeTasks": [
    {
      "type": "memory_maintenance",
      "status": "running",
      "startTime": "2026-04-11T23:00:00Z",
      "progress": {
        "current": 2,
        "total": 4,
        "description": "更新 MEMORY.md 区块"
      }
    }
  ],
  "completedTasks": [
    {
      "type": "insights_analysis",
      "status": "completed",
      "startTime": "2026-04-11T22:00:00Z",
      "endTime": "2026-04-11T22:02:00Z",
      "result": "更新用户画像，发现新偏好"
    }
  ],
  "lastUpdate": "2026-04-11T23:01:00Z"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| Footer pill + Shift+Down | 飞书卡片消息 |
| 实时 Ink 组件 | 卡片更新（异步） |
| Dialog 详情展示 | 卡片交互按钮 |
| AppState.tasks | memory/background-tasks-state.json |

---

## 卡片交互

用户可以点击按钮：

- **"查看 MEMORY.md"** → 展示记忆文件内容
- **"查看详情"** → 展示任务详细日志
- **"取消任务"** → 终止正在运行的任务（可选）

---

## 配置

```yaml
backgroundTasks:
  enabled: true
  showProgress: true      # 显示进度卡片
  showResult: true        # 显示完成卡片
  notifyOnFailure: true   # 任务失败时通知
  compactMode: false      # 简洁模式（只显示完成）
```

---

## 使用示例

### 示例 1：记忆维护启动

```
用户：（发送消息）

Agent: （检测到 heartbeat）
→ 发送飞书卡片：

⚙️ 后台任务启动
🟡 正在执行：记忆维护
任务：读取最近会话 → 提取关键信息 → 更新 MEMORY.md
预计耗时：1-2 分钟
```

### 示例 2：洞察分析完成

```
Agent:
→ 发送飞书卡片：

✅ 后台任务完成
✓ 洞察分析已完成

结果：
- 更新用户画像（偏好：简洁回复）
- 发现活跃时间：晚间 22:00-23:00
- 建议继续实现 Background Tasks UI

[查看 MEMORY.md] [查看详情]
```

---

## 注意事项

1. **不要频繁更新卡片**（避免打扰）
2. **简洁摘要**（不要展示完整日志）
3. **重要任务才通知**（不通知每个小任务）
4. **用户可关闭通知**（提供配置选项）

---

## 自动启用

此 Skill 在后台任务启动/进度/完成时自动发送飞书卡片，用户无需手动调用。

---

## 下一步增强

- 添加任务取消功能（飞书按钮）
- 添加任务历史记录查看
- 添加任务失败重试选项