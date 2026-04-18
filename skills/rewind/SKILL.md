---
name: rewind
description: "Restore code and conversation to a previous checkpoint. Rewind to specific snapshot, restore files, revert conversation history. Use when something went wrong."
metadata:
  openclaw:
    emoji: "⏪"
    triggers: [rewind-request, checkpoint-restore]
    feishuCard: true
---

# Rewind Skill - 回滚机制

恢复代码和对话到之前的 checkpoint。

## 为什么需要这个？

**场景**：
- 代码修改出错
- 需要回退到之前状态
- 对话历史回滚
- 撤销错误操作

**Claude Code 方案**：rewind 命令 + checkpoint 系统
**OpenClaw 飞书适配**：File History + 飞书卡片选择

---

## Checkpoint 类型

### 1. Code Checkpoint

- 文件状态快照
- Git commit 引用
- 文件备份版本

### 2. Conversation Checkpoint

- 对话历史快照
- Message history
- Tool call history

### 3. Full Checkpoint

- 代码 + 对话完整快照
- Context 状态
- Memory 状态

---

## 飞书卡片格式

### Rewind 选择卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏪ Rewind - 回滚选择**\n\n**可用 Checkpoints**：\n\n**#1 - 10 分钟前**\n• 文件：`MEMORY.md`, `HEARTBEAT.md`\n• 操作：记忆维护更新\n\n**#2 - 30 分钟前**\n• 文件：`skills/todo-write/SKILL.md`\n• 操作：创建 TodoWrite Skill\n\n**#3 - 1 小时前**\n• 文件：`memory/heartbeat-state.json`\n• 操作：初始化状态文件\n\n---\n\n**选择要回滚的 checkpoint**："
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "#1 (10分钟前)"},
          "type": "primary",
          "value": {"action": "rewind", "checkpoint": "1"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "#2 (30分钟前)"},
          "type": "default",
          "value": {"action": "rewind", "checkpoint": "2"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "#3 (1小时前)"},
          "type": "default",
          "value": {"action": "rewind", "checkpoint": "3"}
        }
      ]
    }
  ]
}
```

### Rewind 完成卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**⏪ Rewind 完成**\n\n**回滚到**：Checkpoint #2 (30 分钟前)\n\n**恢复文件**：\n✅ `skills/todo-write/SKILL.md` - 已恢复\n✅ `memory/todo-state.json` - 已恢复\n\n**恢复对话**：\n✅ Message history - 已回滚\n\n**当前状态**：已恢复到 30 分钟前"
      }
    },
    {
      "tag": "note",
      "elements": [
        {"tag": "plain_text", "content": "警告：回滚后的新操作会覆盖 checkpoint"}
      ]
    }
  ]
}
```

---

## 执行流程

### 1. 列出 Checkpoints

```
Rewind:
1. 读取 file-history-state.json
2. 列出最近的 snapshots
3. 显示时间、文件、操作
4. 发送飞书卡片选择
```

### 2. 选择 Checkpoint

```
用户选择 checkpoint：
1. 解析选择（checkpoint ID）
2. 读取对应的 snapshot
3. 准备恢复文件
```

### 3. 执行 Rewind

```
Rewind 执行：
1. 恢复文件内容：
   - 从备份文件读取
   - 写入当前文件
2. 恢复对话历史：
   - 截断 message history
   - 更新 session state
3. 更新状态文件
4. 发送完成卡片
```

---

## File History 集成

使用 File History Skill 的备份：

```json
// memory/file-history-state.json
{
  "snapshots": [
    {
      "id": "snapshot-1",
      "timestamp": "2026-04-11T23:00:00Z",
      "files": {
        "MEMORY.md": {
          "backupFile": "MEMORY.md.v1",
          "content": "备份内容..."
        }
      }
    }
  ]
}
```

---

## Git Rewind（可选）

如果项目有 Git：

```bash
# Git checkpoint
git stash push -m "checkpoint-$(date +%s)"

# Git rewind
git stash pop
git reset --hard <commit>
```

---

## 持久化存储

```json
// memory/rewind-state.json
{
  "checkpoints": [
    {
      "id": "checkpoint-1",
      "timestamp": "2026-04-11T23:00:00Z",
      "filesBackedUp": ["MEMORY.md", "HEARTBEAT.md"],
      "description": "记忆维护更新",
      "gitCommit": "abc123"  // 可选
    }
  ],
  "rewindsPerformed": [
    {
      "checkpointId": "checkpoint-2",
      "filesRestored": ["skills/todo-write/SKILL.md"],
      "timestamp": "2026-04-11T23:30:00Z"
    }
  ],
  "stats": {
    "checkpointsCreated": 0,
    "rewindsPerformed": 0
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| /rewind 命令 | Skill + 飞书卡片 |
| checkpoint 文件 | file-history-state.json |
| Terminal UI | 飞书卡片选择 |
| git stash | 可选 Git 支持 |

---

## 注意事项

1. **Checkpoint 创建**：定期创建 checkpoint
2. **备份文件**：实际存储备份内容
3. **对话回滚**：截断 message history
4. **Git 支持**：可选 Git checkpoint
5. **覆盖警告**：回滚后新操作覆盖 checkpoint

---

## 自动启用

此 Skill 在用户请求 rewind 时自动触发。

---

## 下一步增强

- 自动 checkpoint（定时创建）
- 部分回滚（只恢复部分文件）
- Rewind 预览（diff 比较）
- Rewind 历史记录