---
name: post-compact-cleanup-service
description: "压缩后清理服务。清理压缩产生的临时数据，释放系统资源。Use when cleaning up after compression."
---

# Post Compact Cleanup Service

## 功能

清理压缩后残留数据。

### 清理项目

- 临时文件 - 压缩过程中生成的临时文件
- 缓存数据 - 旧的缓存记录
- 快照备份 - 不再需要的快照
- 工具结果 - 已压缩的工具调用记录

### 清理示例

```javascript
// 执行清理
cleanupAfterCompact({
  compactLevel: 2,
  tokensSaved: 15000
});

// 返回清理结果
{
  tempFilesDeleted: 5,
  cacheEntriesRemoved: 20,
  snapshotsPruned: 3,
  spaceSavedMB: 2.5
}
```

### 清理时机

- 压缩完成后自动执行
- 定期清理任务
- 用户手动触发

---

来源: Claude Code services/compact/postCleanup.ts