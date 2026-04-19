---
name: cron-scheduler-system
description: |
  Cron-based scheduled task system. Create, list, delete recurring or one-shot scheduled prompts.
  
  Use when:
  - User asks to schedule a recurring task ("every morning at 9am...")
  - User asks for a one-shot reminder ("remind me in 20 minutes")
  - User wants to automate periodic checks or reports
  - Managing existing scheduled tasks
  
  Keywords: schedule, cron, recurring, reminder, every day, every hour, loop, /loop
metadata:
  openclaw:
    emoji: "⏰"
    source: claude-code-cron
    triggers: [schedule, cron, reminder, recurring]
    priority: P1
---

# Cron Scheduler System

基于 Claude Code `ScheduleCronTool` 的定时任务系统，适配 OpenClaw/飞书场景。

## 核心概念（来自 Claude Code）

### 任务类型
- **One-shot**: `recurring: false` — 下次触发后自动删除（用于"提醒我在X时间"）
- **Recurring**: `recurring: true` — 按 cron 表达式循环触发，直到手动删除或超过 maxAge
- **Durable**: `durable: true` — 持久化到磁盘，进程重启后恢复
- **Session-only**: `durable: false` — 仅内存，会话结束后消失

### Cron 表达式格式
5 字段，本地时间：`M H DoM Mon DoW`
- `*/5 * * * *` = 每 5 分钟
- `0 9 * * 1-5` = 工作日早上 9 点
- `30 14 28 2 *` = 2 月 28 日 14:30（一次性）

## OpenClaw 适配实现

### 状态文件
`memory/cron-tasks.json`:
```json
{
  "tasks": [
    {
      "id": "uuid",
      "cron": "0 9 * * 1-5",
      "prompt": "检查今日日历和邮件",
      "createdAt": 1713000000000,
      "lastFiredAt": 1713000000000,
      "recurring": true,
      "durable": true
    }
  ]
}
```

### 创建任务

```
1. 解析用户意图 → cron 表达式 + prompt
2. 验证 cron 表达式（5 字段）
3. 生成 UUID
4. 写入 memory/cron-tasks.json
5. 计算下次触发时间，告知用户
```

### 触发检查（在 heartbeat 中执行）

```
1. 读取 memory/cron-tasks.json
2. 对每个任务：计算 nextFireAt = computeNextCronRun(cron, lastFiredAt ?? createdAt)
3. 如果 now >= nextFireAt：
   a. 执行 task.prompt
   b. 如果 recurring: 更新 lastFiredAt = now
   c. 如果 one-shot: 从列表删除
4. 写回文件
```

### 自然语言 → Cron 转换

| 用户说 | Cron |
|--------|------|
| 每天早上 9 点 | `0 9 * * *` |
| 每小时 | `0 * * * *` |
| 每 30 分钟 | `*/30 * * * *` |
| 工作日早上 9 点 | `0 9 * * 1-5` |
| 每周一早上 | `0 9 * * 1` |
| 明天下午 3 点（一次性） | `0 15 <明天日期> <月> *` + `recurring: false` |

## 执行流程

### 创建定时任务
```
用户: "每天早上 9 点提醒我检查邮件"

1. 解析 → cron: "0 9 * * *", prompt: "检查邮件", recurring: true
2. 读取 memory/cron-tasks.json（不存在则创建）
3. 追加新任务
4. 写回文件
5. 回复: "已创建定时任务，每天 09:00 执行「检查邮件」"
```

### 列出任务
```
1. 读取 memory/cron-tasks.json
2. 格式化输出每个任务的 id、cron、下次触发时间、prompt
```

### 删除任务
```
1. 读取 memory/cron-tasks.json
2. 按 id 或 prompt 关键词匹配
3. 删除并写回
```

## Heartbeat 集成

在 HEARTBEAT.md 中添加 cron 检查任务：
```yaml
- name: cron-check
  interval: 1min
  prompt: "读取 memory/cron-tasks.json，检查是否有到期任务，执行并更新状态"
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 存储 | `.claude/scheduled_tasks.json` | `memory/cron-tasks.json` |
| 触发 | 内置调度器（进程内） | heartbeat 轮询 |
| 精度 | 分钟级 | heartbeat 间隔（约 1-5 分钟） |
| 重启恢复 | durable 任务自动恢复 | 读文件即恢复 |
| 最大任务数 | 50 | 无硬限制 |
