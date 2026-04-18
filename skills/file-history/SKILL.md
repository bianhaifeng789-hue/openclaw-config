---
name: file-history
description: "Track file modification history with snapshots. Maintain up to 100 backups for diff comparison, change statistics, and version recovery. Use when checking file history, checkpointing changes, or rolling back edits."
metadata:
  openclaw:
    emoji: "📜"
    triggers: [file-edit, file-write]
    feishuCard: true
---

# File History Skill - 文件历史备份

追踪文件修改历史，最多 100 个快照，支持 diff 对比和版本恢复。

## 为什么需要这个？

**场景**：
- 文件修改追踪
- 版本对比（insertions/deletions）
- 变更统计
- 版本恢复

**Claude Code 方案**：fileHistory.ts + MAX_SNAPSHOTS = 100
**OpenClaw 飞书适配**：文件编辑/写入时自动备份

---

## 核心概念

### Snapshot（快照）

每次文件编辑时创建快照：

```typescript
interface FileHistorySnapshot {
  messageId: UUID        // 关联的消息 ID
  trackedFileBackups: Record<string, FileHistoryBackup>
  timestamp: Date
}

interface FileHistoryBackup {
  backupFileName: string | null  // null 表示文件不存在
  version: number
  backupTime: Date
}
```

### MAX_SNAPSHOTS

最多保留 100 个快照：
- 超过 100 时，删除最旧的快照
- 保持 snapshotSequence 计数器单调递增

---

## Diff 统计

使用 diffLines 计算变更：

```typescript
interface DiffStats {
  filesChanged?: string[]
  insertions: number
  deletions: number
}

function computeDiffStats(oldContent: string, newContent: string): DiffStats {
  const diff = diffLines(oldContent, newContent)
  let insertions = 0
  let deletions = 0

  for (const part of diff) {
    if (part.added) insertions += part.count
    if (part.removed) deletions += part.count
  }

  return { insertions, deletions }
}
```

---

## 飞书卡片格式

### 变更统计卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📜 文件变更统计**\n\n**文件**：`MEMORY.md`\n\n**变更**：\n• +15 行插入\n• -3 行删除\n• 2 个文件修改\n\n**快照版本**：#47\n**时间**：2026-04-11 23:30"
      }
    },
    {
      "tag": "action",
      "actions": [
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "查看 Diff"},
          "type": "primary",
          "value": {"action": "view_diff", "snapshotId": "47"}
        },
        {
          "tag": "button",
          "text": {"tag": "plain_text", "content": "恢复版本"},
          "type": "default",
          "value": {"action": "restore_version", "snapshotId": "47"}
        }
      ]
    }
  ]
}
```

### Diff 详情卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**📜 文件 Diff**\n\n**对比**：版本 #46 → #47\n**文件**：`MEMORY.md`\n\n```diff\n- <!-- AUTO_UPDATE: current_focus -->\n- _旧内容_\n+ <!-- AUTO_UPDATE: current_focus -->\n+ _新内容：已实现 13 个功能_\n```\n\n**统计**：+2 -2"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 文件编辑时备份

```
File Edit:
1. 读取文件当前内容
2. 创建备份文件（backupFileName）
3. 更新 trackedFiles Set
4. 创建 FileHistorySnapshot
5. 更新 fileHistoryState
6. 发送飞书卡片（可选）
```

### 2. 快照管理

```
Snapshot Management:
1. snapshotSequence++（单调递增）
2. 如果 snapshots.length > MAX_SNAPSHOTS：
   → 删除最旧的快照
   → 删除对应的备份文件
```

### 3. Diff 计算

```
Diff Computation:
1. 用户请求查看变更
2. 读取两个快照的备份文件
3. 使用 diffLines 计算差异
4. 生成 DiffStats
5. 发送飞书卡片
```

---

## 持久化存储

```json
// memory/file-history-state.json
{
  "snapshots": [
    {
      "messageId": "msg-uuid-47",
      "trackedFileBackups": {
        "MEMORY.md": {
          "backupFileName": "MEMORY.md.v47",
          "version": 47,
          "backupTime": "2026-04-11T23:30:00Z"
        }
      },
      "timestamp": "2026-04-11T23:30:00Z"
    }
  ],
  "trackedFiles": ["MEMORY.md", "HEARTBEAT.md"],
  "snapshotSequence": 47,
  "stats": {
    "snapshotsCreated": 47,
    "filesTracked": 2,
    "diffsComputed": 0
  }
}
```

---

## 备份文件存储

```
memory/backups/
├── MEMORY.md.v1
├── MEMORY.md.v2
├── ...
├── MEMORY.md.v47
├── HEARTBEAT.md.v1
├── ...
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| FileHistoryState（内部） | file-history-state.json |
| MAX_SNAPSHOTS = 100 | 同样 100 |
| diffLines（diff package） | 同样可用 |
| recordFileHistorySnapshot | 文件编辑 hook |
| FileHistoryBackup（内存） | 备份文件存储 |

---

## 注意事项

1. **100 快照限制**：超过时删除最旧
2. **snapshotSequence**：单调递增，即使删除旧快照
3. **备份文件**：实际存储备份内容
4. **trackedFiles**：Set<string>，追踪哪些文件
5. **messageId**：关联到触发编辑的消息

---

## 自动启用

此 Skill 在文件编辑/写入时自动触发备份。

---

## 下一步增强

- 备份文件清理策略
- Diff 可视化（飞书卡片展示）
- 版本恢复功能
- 变更历史图表