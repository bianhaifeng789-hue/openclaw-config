---
name: session-memory-compact-service
description: "会话记忆压缩服务。压缩会话记忆数据，减少存储空间占用。Use when compressing session memory."
---

# Session Memory Compact Service

## 功能

压缩会话记忆数据。

### 压缩策略

- 合并相似记忆条目
- 提取关键信息要点
- 删除冗余详细描述
- 保留重要决策记录

### 使用示例

```javascript
// 压缩会话记忆
const result = compactSessionMemory(sessionId);

// 返回压缩结果
{
  originalSize: 5000,
  compressedSize: 2000,
  tokensSaved: 3000,
  memoriesKept: 15,
  memoriesMerged: 10
}
```

### 保留规则

- 用户决策 - 必须保留
- 重要结论 - 必须保留
- 关键错误 - 必须保留
- 日常对话 - 可合并压缩

---

来源: Claude Code services/sessionMemoryCompact.ts