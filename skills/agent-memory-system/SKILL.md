---
name: agent-memory-system
description: "Agent记忆系统。管理Agent的持久记忆，存储重要信息。Use when storing and retrieving agent memories."
---

# Agent Memory System

## 功能

管理Agent记忆。

### 记忆类型

- 短期记忆 - 当前会话
- 长期记忆 - MEMORY.md
- 工作记忆 - 任务上下文

### 示例

```javascript
// 存储记忆
storeMemory({
  type: 'long-term',
  content: '用户偏好ROI计算工具',
  importance: 0.8
});

// 检索记忆
const memories = retrieveMemory('ROI');
```

---

来源: Claude Code memory/agentMemory.ts