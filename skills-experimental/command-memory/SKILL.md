---
name: command-memory
description: "Memory命令模式。管理记忆系统，查看、提取和压缩持久记忆。Use when managing memory via commands."
---

# Command Memory

## 功能

管理记忆命令。

### 核心命令

- /memory - 查看记忆状态
- /memory extract - 提取对话中的记忆
- /memory compact - 压缩记忆数据
- /memory export - 导出记忆文件

### 使用示例

```
用户: /memory
显示:
📝 记忆状态

• 长期记忆: 23条
• 短期记忆: 5条
• 待整理: 2条
• 最近更新: 2026-04-15

用户: /memory extract
结果: 从最近对话提取3条新记忆
```

### 记忆类型

- 长期记忆 - MEMORY.md
- 短期记忆 - 当前会话
- 工作记忆 - 任务上下文

---

来源: Claude Code commands/memory.ts