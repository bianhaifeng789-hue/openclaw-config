---
name: use-file-history-snapshot-init-hook
description: "文件历史快照初始化Hook。在会话开始时创建文件快照，用于回滚和版本追踪。Use when initializing file history tracking."
---

# Use File History Snapshot Init Hook

## 功能

初始化文件历史追踪。

### 快照类型

- initial - 会话开始时创建
- checkpoint - 重要操作节点时创建
- final - 会话结束时创建

### 快照内容

- 文件完整内容
- 创建时间戳
- 文件哈希值（用于比对）

### 使用示例

```javascript
// 创建初始快照
createInitialSnapshot();

// 回滚到指定快照
rollbackToSnapshot(snapshotId);

// 查看快照历史
listSnapshots();
```

### 应用场景

- 会话开始时保护文件状态
- 重要修改前创建备份
- 错误恢复时回滚文件

---

来源: Claude Code hooks/useFileHistorySnapshotInit.ts