---
name: todo-task-system
description: |
  Structured todo/task list management for multi-step work. Track progress with pending/in_progress/completed states.
  
  Use when:
  - Task requires 3+ distinct steps
  - User provides multiple tasks at once
  - Complex coding or analysis work needs tracking
  - User explicitly asks for a todo list
  
  NOT for: single trivial tasks, pure Q&A
  
  Keywords: todo, task list, checklist, track progress, steps, plan
metadata:
  openclaw:
    emoji: "✅"
    source: claude-code-todo
    triggers: [todo, task-list, multi-step, progress-tracking]
    priority: P1
---

# Todo/Task System

基于 Claude Code `TodoWriteTool` + `TaskCreateTool` 的结构化任务追踪，适配飞书场景。

## 核心概念（来自 Claude Code）

### Todo Item 结构
```typescript
type TodoItem = {
  id: string           // 唯一 ID
  content: string      // 任务描述
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'high' | 'medium' | 'low'
}
```

### 使用规则（直接来自 Claude Code prompt）
1. **复杂多步骤任务** — 需要 3+ 个不同步骤时
2. **非平凡任务** — 需要仔细规划或多次操作
3. **用户明确要求** — 用户直接要求 todo 列表
4. **用户提供多个任务** — 编号或逗号分隔的任务列表
5. **收到新指令后** — 立即将需求捕获为 todos
6. **开始工作前** — 先标记为 `in_progress`，理想情况下同时只有一个 in_progress
7. **完成后** — 标记为 `completed`，添加发现的后续任务

**不使用的情况**：单个简单任务、纯对话/信息查询、3 步以内的简单任务

## OpenClaw 适配实现

### 状态文件
`memory/todo-list.json`:
```json
{
  "sessionId": "2026-04-13",
  "todos": [
    {
      "id": "1",
      "content": "分析 Claude Code 源码",
      "status": "completed",
      "priority": "high"
    },
    {
      "id": "2", 
      "content": "创建对应 skills",
      "status": "in_progress",
      "priority": "high"
    },
    {
      "id": "3",
      "content": "测试 skill 调用",
      "status": "pending",
      "priority": "medium"
    }
  ],
  "updatedAt": "2026-04-13T18:30:00+08:00"
}
```

### 执行流程

#### 创建 Todo 列表
```
1. 分析用户请求，拆解为具体步骤
2. 读取 memory/todo-list.json（不存在则创建）
3. 写入 todos 数组
4. 发送飞书卡片展示任务列表（可选）
```

#### 更新状态
```
开始任务前: status → "in_progress"
完成任务后: status → "completed"
发现新任务: 追加到列表
```

#### 飞书卡片格式
```
📋 任务进度 (2/3 完成)
✅ 分析 Claude Code 源码
🔄 创建对应 skills  ← 当前
⏳ 测试 skill 调用
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 存储 | 内存（AppState） | `memory/todo-list.json` |
| 展示 | TUI TaskListV2 组件 | 飞书卡片 / 文本 |
| 作用域 | 单会话 | 跨会话持久化 |
| 多 agent | 支持颜色编码 | 单 agent |

## 何时发送飞书卡片

- 任务数 >= 3 时，创建后发送卡片
- 每完成一个任务，更新卡片状态
- 全部完成时，发送完成通知
