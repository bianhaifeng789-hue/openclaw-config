---
name: memory-age
description: "| Use when [memory age] is needed."
  Calculate and format memory file age for staleness warnings.
  Used when injecting memory content to warn about potentially outdated information.
metadata:
  openclaw:
    emoji: "⏰"
    source: claude-code-memdir
    triggers: [internal]
    priority: P2
---

# Memory Age

计算记忆文件年龄，生成新鲜度警告。

## 逻辑（来自 Claude Code memoryAge.ts）

```
ageDays = floor((now - mtime) / 86400000)
ageDays = max(0, ageDays)  // 防止时钟偏差

if ageDays == 0: "today"
if ageDays == 1: "yesterday"
else: "${ageDays} days ago"
```

## 新鲜度警告

**超过1天**的记忆需要附加警告：

```
这条记忆已有 {X} 天。记忆是时间点快照，不是实时状态——
关于代码行为或文件位置的描述可能已过时，请在断言前验证。
```

**今天/昨天**的记忆：不加警告（噪音）。

## 使用场景

在 find-relevant-memories 注入记忆内容时，对每条记忆附加年龄信息：

```
[来自 2026-04-11.md，2天前]
⚠️ 这条记忆已有2天，代码状态可能已变化。
...记忆内容...
```
