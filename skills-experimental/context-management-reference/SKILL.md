---
name: context-management-reference
description: "上下文管理参考文档。Context压缩策略参考，详解4层压缩方法和阈值。Use when implementing context compression."
---

# Context Management Reference

## 功能

上下文压缩策略完整参考。

### 4层压缩策略详解

#### Level 0: TimeBasedMC
- 清除超过1小时的工具结果
- 保留消息历史
- 节省：5-10k tokens

#### Level 1: MicroCompact
- 压缩消息历史为摘要
- 合并相似消息
- 节省：10-20k tokens

#### Level 2: SelectiveCompact
- 选择性删除低价值内容
- 保留关键信息
- 节省：20-40k tokens

#### Level 3: SummaryCompact
- 全部替换为摘要
- 最大压缩
- 节省：40-80k tokens

### 阈值配置

| 阈值 | Token数 | 百分比 | 动作 |
|------|---------|--------|------|
| auto | 167k | 93% | 自动压缩 |
| warning | 160k | 89% | 发送警告 |
| error | 160k | 89% | 强制压缩 |

---

来源: Claude Code context/management.ts