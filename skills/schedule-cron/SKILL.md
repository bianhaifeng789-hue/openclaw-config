---
name: schedule-cron
description: "AI dynamically creates cron tasks. Use when: user requests reminders, periodic checks, scheduled tasks. Supports one-shot and recurring schedules."
metadata:
  openclaw:
    emoji: "⏰"
    triggers: [reminder, periodic, scheduled]
    feishuCard: true
---

# Schedule Cron Skill - AI 动态 Cron 任务

AI 可以动态创建定时任务，提醒、定期检查、周期执行。

## 为什么需要这个？

**场景**：
- "5分钟后提醒我"
- "每小时检查一次邮件"
- "每天早上9点汇报进度"

**Claude Code 方案**：ScheduleCronTool + durable 存储
**OpenClaw 飞书适配**：exec + cron + 飞书卡片通知

---

## Cron 表达式

使用标准 5 字段 cron（用户本地时间）：

```
分钟 小时 日 月 星期

*    *    *  *  *     # 每分钟
0    *    *  *  *     # 每小时
0    9    *  *  *     # 每天 9:00
0    9    *  *  1-5   # 工作日 9:00
*/5  *    *  *  *     # 每 5 分钟
30   14   11  4  *    # 4月11日 14:30（一次性）
```

---

## 任务类型

### One-shot（一次性）

```
用户：5分钟后提醒我检查部署

Agent:
→ 计算：当前 23:21，5分钟后 = 23:26
→ cron: "26 23 11 4 *"（4月11日 23:26）
→ recurring: false
→ 创建任务
→ 23:26 触发 → 发送飞书卡片提醒
→ 任务自动删除
```

### Recurring（周期性）

```
用户：每小时检查一次邮件

Agent:
→ cron: "7 * * * *"（每小时，避开 :00）
→ recurring: true
→ 创建任务
→ 每小时触发 → 检查邮件 → 飞书卡片通知
→ 14天后过期
```

---

## 避开整点

Claude Code 建议：避开 :00 和 :30 分钟标记（API 负载高峰）

**推荐做法**：
```
用户说 "9am" → 用 "57 8" 或 "3 9"（不是 "0 9"）
用户说 "hourly" → 用 "7 * * * *"（不是 "0 * * * *"）
用户说 "5分钟后" → 用当前分钟+5，不取整
```

---

## 飞书卡片格式

### 任务创建卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏰ 定时任务已创建**\n\n**任务**：检查邮件\n**时间**：每小时（避开整点）\n**类型**：周期性\n**过期**：14天后\n\n**cron 表达式**：`7 * * * *`\n\n任务 ID: `cron-mail-check`"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "查看任务"},
          "type": "primary",
          "value": {"action": "view_cron", "taskId": "cron-mail-check"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "取消任务"},
          "type": "default",
          "value": {"action": "cancel_cron", "taskId": "cron-mail-check"}
        }
      ]
    }
  ]
}
```

### 任务触发卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏰ 定时任务触发**\n\n**任务**：检查邮件\n**时间**：2026-04-11 23:07\n\n**结果**：\n✅ 无新邮件\n\n下次触发：2026-04-12 00:07"
      }
    }
  ]
}
```

### 提醒卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏰ 提醒**\n\n**内容**：检查部署状态\n**时间**：2026-04-11 23:26\n\n任务已完成，已自动删除。"
      }
    }
  ]
}
```

---

## 实现方案

### 方案 1：exec + cron

```bash
# 创建 cron 任务
exec({
  command: `(crontab -l 2>/dev/null; echo "7 * * * * cd /path && openclaw cron-trigger mail-check") | crontab -`
})

# 任务触发脚本
# openclaw cron-trigger <taskId>
# → 发送飞书卡片
# → 执行任务逻辑
```

### 方案 2：OpenClaw 内置定时器

```typescript
// 使用 OpenClaw 的任务调度系统
// 类似 Claude Code 的 cronScheduler
// 需要检查 OpenClaw 是否有内置支持
```

---

## 持久化存储

```json
// memory/cron-state.json
{
  "tasks": [
    {
      "id": "cron-mail-check",
      "prompt": "检查邮件",
      "cron": "7 * * * *",
      "recurring": true,
      "durable": true,
      "createdAt": "2026-04-11T23:00:00Z",
      "expiresAt": "2026-04-25T23:00:00Z",
      "lastRun": null,
      "nextRun": "2026-04-12T00:07:00Z",
      "status": "active"
    },
    {
      "id": "cron-deploy-reminder",
      "prompt": "检查部署状态",
      "cron": "26 23 11 4 *",
      "recurring": false,
      "durable": false,
      "createdAt": "2026-04-11T23:21:00Z",
      "expiresAt": "2026-04-11T23:26:00Z",
      "status": "pending"
    }
  ],
  "stats": {
    "tasksCreated": 0,
    "tasksTriggered": 0,
    "tasksCancelled": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| ScheduleCronTool | exec + cron 或内置 |
| durable: true/false | memory/cron-state.json |
| .claude/scheduled_tasks.json | memory/cron-state.json |
| REPL idle trigger | 需要实现触发机制 |
| GrowthBook gate | 无 gate |

---

## Durability（持久性）

**session-only**（durable: false）：
- 任务只在当前会话有效
- 会话结束任务消失
- 适合短期提醒

**durable**（durable: true）：
- 任务持久化到文件
- 会话重启后继续
- 适合长期周期任务

---

## 执行流程

### 1. 解析用户请求

```
Agent:
1. 检测关键词："提醒"、"每小时"、"每天"
2. 解析时间：
   - 相对时间（"5分钟后"）
   - 绝对时间（"明天早上9点")
   - 周期时间（"每小时")
3. 生成 cron 表达式
4. 判断 recurring vs one-shot
```

### 2. 创建任务

```
Agent:
1. 生成任务 ID
2. 写入 cron-state.json
3. 注册 cron（exec 或内置）
4. 发送飞书卡片确认
```

### 3. 任务触发

```
定时器:
1. 到达触发时间
2. 读取任务定义
3. 执行任务逻辑
4. 发送飞书卡片通知
5. 如果 one-shot，删除任务
6. 如果 recurring，更新 nextRun
```

---

## 注意事项

1. **避开整点**：使用非 0/30 分钟
2. **14天过期**：周期任务默认过期
3. **idle trigger**：任务只在空闲时触发（需要实现）
4. **durable 检查**：用户明确要求持久化才用 durable
5. **任务 ID**：唯一标识，用于取消

---

## 自动启用

此 Skill 在检测到提醒/定时/周期关键词时自动触发。

---

## 下一步增强

- OpenClaw 内置定时器支持检查
- 飞书按钮回调（取消任务）
- 任务列表查看
- 任务编辑（修改时间）