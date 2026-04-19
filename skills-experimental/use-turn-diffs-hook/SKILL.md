---
name: use-turn-diffs-hook
description: "Turn差异Hook。检测每次对话的变化，记录差异。Use when tracking conversation changes."
---

# Use Turn Diffs Hook

## 功能

记录对话差异。

### 记录内容

- 新增消息
- 删除消息
- 修改内容
- 工具调用变化

### 示例

```javascript
const diffs = getTurnDiffs(previousTurn, currentTurn);

// 返回
[
  { type: 'add', message: '用户询问ROI' },
  { type: 'tool', name: 'read', added: true }
]
```

---

来源: Claude Code hooks/useTurnDiffs.ts