---
name: file-history-checkpointing
description: |
  File edit checkpointing and rollback. Automatically snapshot files before edits, enable per-messageId rewind.
  
  Use when:
  - Before making file edits (auto-snapshot)
  - User asks to undo/revert changes
  - Comparing current state to before a specific message
  - Recovering from bad edits
  
  Keywords: undo, revert, checkpoint, file history, rollback, restore, snapshot
metadata:
  openclaw:
    emoji: "📸"
    source: claude-code-file-history
    triggers: [undo, revert, checkpoint, rollback, file-edit]
    priority: P1
---

# File History Checkpointing

基于 Claude Code `fileHistory.ts` 的文件编辑检查点系统，支持按 messageId 回滚。

## 核心概念（来自 Claude Code）

### 数据结构
```typescript
type FileHistorySnapshot = {
  messageId: UUID           // 关联的消息 ID
  trackedFileBackups: Record<string, FileHistoryBackup>  // 文件路径 → 备份
  timestamp: Date
}

type FileHistoryBackup = {
  backupFileName: string | null  // null = 文件在此版本不存在
  version: number                // 单调递增版本号
  backupTime: Date
}

// 最多保留 100 个快照
const MAX_SNAPSHOTS = 100
```

### 关键操作

**fileHistoryTrackEdit(filePath, messageId)**:
```
在编辑前调用：
1. 如果文件存在：复制到备份目录（硬链接，节省空间）
2. 记录 backup: { backupFileName, version, backupTime }
3. 关联到当前 messageId 的 snapshot
```

**fileHistoryMakeSnapshot(messageId)**:
```
创建新快照：
1. 收集所有已追踪文件的当前备份
2. 写入 snapshot: { messageId, trackedFileBackups, timestamp }
3. 超过 MAX_SNAPSHOTS 时驱逐最旧的
```

**fileHistoryRewind(messageId)**:
```
回滚到指定消息前的状态：
1. 找到 messageId 对应的 snapshot
2. 对每个追踪文件：
   - 如果 backupFileName = null → 删除文件（该版本不存在）
   - 否则 → 从备份恢复
3. 清理该 snapshot 之后的所有快照
```

**fileHistoryGetDiffStats()**:
```
返回自上次快照以来的变更统计：
{ filesChanged: string[], insertions: number, deletions: number }
```

## OpenClaw 适配实现

### 备份目录结构
```
memory/file-history/
  snapshots.json          # 快照元数据
  backups/
    v1_src_utils_foo.ts   # 备份文件（版本号前缀）
    v2_src_utils_foo.ts
    v1_src_index.ts
```

### snapshots.json 格式
```json
{
  "snapshots": [
    {
      "messageId": "msg-abc123",
      "timestamp": "2026-04-13T18:00:00+08:00",
      "trackedFileBackups": {
        "src/utils/foo.ts": {
          "backupFileName": "v1_src_utils_foo.ts",
          "version": 1,
          "backupTime": "2026-04-13T18:00:00+08:00"
        }
      }
    }
  ],
  "snapshotSequence": 3
}
```

### 使用流程

**编辑前自动快照**：
```
1. 用户请求编辑文件
2. 调用 fileHistoryTrackEdit(filePath, currentMessageId)
3. 执行编辑
4. 调用 fileHistoryMakeSnapshot(currentMessageId)
```

**回滚**：
```
用户: "撤销刚才的修改"
1. 找到上一个 messageId 的 snapshot
2. 调用 fileHistoryRewind(messageId)
3. 报告恢复了哪些文件
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 备份存储 | 硬链接（节省空间） | 文件复制 |
| 最大快照数 | 100 | 可配置（默认 20） |
| 触发时机 | FileEdit/FileWrite 工具自动触发 | 手动调用或 hook |
| diff 统计 | 精确行级 diff | 文件级统计 |
| 跨会话 | 不支持（内存状态） | 支持（文件持久化） |
