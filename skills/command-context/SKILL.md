---
name: command-context
description: "Context命令模式。管理上下文相关命令，查看和压缩上下文以控制token使用。Use when managing context via commands."
---

# Command Context

## 功能

管理上下文命令。

### 核心命令

- /context - 查看当前上下文状态
- /compact - 执行上下文压缩
- /clear - 清除上下文历史
- /context save - 保存上下文快照

### 使用示例

```
用户: /context
显示: 当前上下文 165k/180k (91%)

用户: /compact
执行: Level 0压缩，节省5000 tokens

用户: /clear
结果: 上下文已清除
```

### 压缩级别

- Level 0 - 清除旧工具结果
- Level 1 - 压缩消息历史
- Level 2 - 选择性删除
- Level 3 - 摘要替换

---

来源: Claude Code commands/context.ts