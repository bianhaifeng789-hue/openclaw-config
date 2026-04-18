---
name: micro-compact-service
description: "Micro Compact服务。执行最小化压缩，清除冗余消息节省tokens。Use when performing lightweight context compression."
---

# Micro Compact Service

## 功能

执行轻量级压缩。

### 压缩策略

- 合并相似消息 - 相同类型消息合并
- 删除重复内容 - 去除重复信息
- 压缩工具结果 - 简化工具输出
- 提取关键信息 - 保留要点删除细节

### 使用示例

```javascript
// 执行压缩
const result = microCompact(messages);

// 返回结果
{
  originalTokens: 50000,
  compressedTokens: 45000,
  tokensSaved: 5000,
  messagesMerged: 10,
  duplicatesRemoved: 5
}
```

### 应用时机

- Level 1压缩触发
- 上下文增长过快时
- 定期清理任务

---

来源: Claude Code services/compact/microCompact.ts