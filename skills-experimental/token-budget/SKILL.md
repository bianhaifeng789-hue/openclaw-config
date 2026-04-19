---
name: token-budget
description: "Parse token budget from text. Support shorthand (+500k, +2M). Support verbose (use/spend 2M tokens). Position tracking for budget markers. Use when [token budget] is needed."
metadata:
  openclaw:
    emoji: "🎯"
    triggers: [budget-request, task-budget]
    feishuCard: true
---

# Token Budget Skill - Token 预算解析

从文本中解析 token 预算，支持多种格式。

## 为什么需要这个？

**场景**：
- 用户指定 token 预算
- 解析 shorthand 格式
- 解析 verbose 格式
- 预算位置追踪

**Claude Code 方案**：tokenBudget.ts + regex
**OpenClaw 飞书适配**：飞书预算解析 + 预算管理

---

## 支持格式

### 1. Shorthand（开头）

```
+500k  → 500,000 tokens
+2M    → 2,000,000 tokens
+1B    → 1,000,000,000 tokens
```

### 2. Shorthand（结尾）

```
... +500k.  → 500,000 tokens
task +2M!   → 2,000,000 tokens
```

### 3. Verbose

```
use 500k tokens  → 500,000 tokens
spend 2M tokens  → 2,000,000 tokens
```

---

## Regex Patterns

```typescript
// Shorthand at start: +500k
const SHORTHAND_START_RE = /^\s*\+(\d+(?:\.\d+)?)\s*(k|m|b)\b/i

// Shorthand at end: +500k.
const SHORTHAND_END_RE = /\s\+(\d+(?:\.\d+)?)\s*(k|m|b)\s*[.!?]?\s*$/i

// Verbose: use/spend 2M tokens
const VERBOSE_RE = /\b(?:use|spend)\s+(\d+(?:\.\d+)?)\s*(k|m|b)\s*tokens?\b/i

// Multipliers
const MULTIPLIERS = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000
}
```

---

## 解析函数

```typescript
function parseTokenBudget(text: string): number | null {
  // Try shorthand start
  const startMatch = text.match(SHORTHAND_START_RE)
  if (startMatch) {
    return parseFloat(startMatch[1]) * MULTIPLIERS[startMatch[2].toLowerCase()]
  }
  
  // Try shorthand end
  const endMatch = text.match(SHORTHAND_END_RE)
  if (endMatch) {
    return parseFloat(endMatch[1]) * MULTIPLIERS[endMatch[2].toLowerCase()]
  }
  
  // Try verbose
  const verboseMatch = text.match(VERBOSE_RE)
  if (verboseMatch) {
    return parseFloat(verboseMatch[1]) * MULTIPLIERS[verboseMatch[2].toLowerCase()]
  }
  
  return null
}
```

---

## 飞书卡片格式

### Token Budget 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🎯 Token Budget Detected**\n\n---\n\n**解析结果**：\n\n| 属性 | 值 |\n|------|------|\n| **输入** | \"+500k\" |\n| **格式** | Shorthand (start) |\n| **预算** | 500,000 tokens |\n| **位置** | [0, 5] |\n\n---\n\n**预算管理**：\n• **已使用**：0 tokens\n• **剩余**：500,000 tokens\n• **进度**：0%\n\n---\n\n**预算追踪已启动**"
      }
    }
  ]
}
```

---

## 执行流程

### 1. 解析文本

```
Token Budget:
1. 射影 regex patterns
2. 尝试 shorthand start/end
3. 尝试 verbose
4. 返回预算值
```

### 2. 预算追踪

```typescript
interface BudgetTracker {
  budget: number
  used: number
  remaining: number
  percent: number
  
  addTokens(count: number): void
  getContinuationMessage(): string
}
```

---

## 持久化存储

```json
// memory/token-budget-state.json
{
  "budgets": [
    {
      "sessionId": "session-1",
      "budget": 500000,
      "used": 120000,
      "remaining": 380000,
      "source": "shorthand",
      "timestamp": "2026-04-12T00:00:00Z"
    }
  ],
  "stats": {
    "totalBudgets": 0,
    "avgBudget": 0,
    "avgUsed": 0
  },
  "config": {
    "defaultBudget": null,
    "maxBudget": 10000000
  }
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| parseTokenBudget() | Skill + 函数 |
| findTokenBudgetPositions() | 位置追踪 |
| getBudgetContinuationMessage() | 继续消息 |
| MULTIPLIERS | 同样 multiplier |

---

## 注意事项

1. **Regex patterns**：三种格式匹配
2. **Multipliers**：k/m/b 转换
3. **Position tracking**：记录位置
4. **飞书卡片**：显示预算进度
5. **Budget tracker**：追踪使用

---

## 自动启用

此 Skill 在用户指定预算时自动触发。

---

## 下一步增强

- 预算警告（超过 80%）
- 预算耗尽提示
- Budget analytics