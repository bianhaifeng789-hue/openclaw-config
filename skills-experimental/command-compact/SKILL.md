---
name: command-compact
description: "Compact命令模式。执行上下文压缩，清理冗余内容以释放token空间。Use when compressing context via commands."
---

# Command Compact

## 功能

压缩上下文命令。

### 核心命令

- /compact - 自动选择压缩级别
- /compact level=0 - TimeBasedMC（清除旧工具结果）
- /compact level=1 - MicroCompact（压缩消息历史）
- /compact level=2 - SelectiveCompact（选择性删除）
- /compact level=3 - SummaryCompact（摘要替换）

### 使用示例

```
用户: /compact
执行: 自动检测压力，执行Level 0压缩
结果: 节省5000 tokens

用户: /compact level=2
执行: 选择性删除低价值消息
结果: 节省15000 tokens
```

### 压缩效果

| 级别 | 节省tokens | 损失信息 |
|------|-----------|---------|
| Level 0 | 5-10k | 工具结果 |
| Level 1 | 10-20k | 消息细节 |
| Level 2 | 20-40k | 选择内容 |
| Level 3 | 40-80k | 详细信息 |

---

来源: Claude Code commands/compact.ts