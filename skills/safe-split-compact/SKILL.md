# Safe Split Index + Role-Based Compact Skill

## 功能概述

增强compact-cli.js的两个关键功能：

1. **safe_split_index**: 避免破坏tool_call/tool_result配对
2. **角色差异化压缩**: 不同Agent角色保留不同比例历史

## 来源

- **仓库**: Harness Engineering (lazyFrogLOL/Harness_Engineering)
- **文件**: context.py（compact_messages方法）
- **移植日期**: 2026-04-17

---

## 1. safe_split_index

### 问题背景

OpenAI API要求tool results必须紧跟在请求它们的assistant消息后面。

如果在压缩时分割点落在tool消息上，会破坏配对，导致API错误。

### 解决方案

向后扫描找到安全分割点：
- 如果是tool响应 → 向后移动（需要与assistant配对）
- 如果是assistant且有tool_calls → 向后移动（其tool响应紧随）
- 否则 → 安全分割点

### 实现

```javascript
function safeSplitIndex(messages, targetIdx) {
  let idx = Math.max(0, Math.min(targetIdx, messages.length));
  
  while (idx > 0 && idx < messages.length) {
    const msg = messages[idx];
    
    if (msg.role === 'tool') {
      idx -= 1;
    } else if (msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0) {
      idx -= 1;
    } else {
      break;
    }
  }
  
  return idx;
}
```

### 测试结果

```json
{
  "targetIdx": 2,
  "safeSplitIdx": 0,
  "messageAtTarget": "tool",
  "messageAtSafe": "user",
  "explanation": "Adjusted to avoid breaking tool_call/tool pair"
}
```

✅ 成功避免破坏配对

---

## 2. 角色差异化压缩

### 保留比例

| 角色 | 保留比例 | 原因 |
|------|----------|------|
| **Evaluator** | 50% | 跨轮对比需要历史 |
| **Builder** | 20% | 旧调试无用 |
| **Default** | 30% | 平衡保留 |

### 角色特定摘要指令

**Evaluator**:
```
Preserve: all scores given, bugs found, quality assessments, 
and cross-round comparisons. The evaluator needs this history 
to track improvement trends.
```

**Builder**:
```
Preserve: files created/modified, current architecture decisions, 
and the latest error states. Discard intermediate debugging steps 
and superseded code.
```

**Default**:
```
Preserve: key decisions, files created/modified, current progress, 
and errors encountered.
```

### 用法

```bash
# 查看角色压缩配置
node impl/bin/compact-cli.js role-config evaluator

# 测试 safe_split_index
node impl/bin/compact-cli.js safe-split
```

### 测试结果

```json
{
  "role": "evaluator",
  "retention": 0.5,
  "keepCount": 4,
  "splitIdx": 3,
  "summarizeInstruction": "Preserve: all scores given..."
}
```

✅ 角色感知压缩配置正确

---

## 重要性

⭐⭐ 中优先级

防止压缩错误 + 优化不同Agent的压缩策略

---

## 集成到compact-cli.js

已集成到 `impl/bin/compact-cli.js`

新增命令：
- `role-config <role>` - 查看角色压缩配置
- `safe-split` - 测试safe_split_index

---

移植完成：2026-04-17
状态：就绪 ✅