# Token Budget Parser Skill

**优先级**: P31
**来源**: Claude Code `tokenBudget.ts`
**适用场景**: token预算语法解析、UI高亮

---

## 概述

Token Budget Parser解析"+500k"、"use 2M tokens"等语法，提取token预算值。支持多种格式：shorthand（开头/结尾）、verbose（任意位置）。

---

## 核心功能

### 1. 语法解析

```typescript
const SHORTHAND_START_RE = /^\s*\+(\d+(?:\.\d+)?)\s*(k|m|b)\b/i
const SHORTHAND_END_RE = /\s\+(\d+(?:\.\d+)?)\s*(k|m|b)\s*[.!?]?\s*$/i
const VERBOSE_RE = /\b(?:use|spend)\s+(\d+(?:\.\d+)?)\s*(k|m|b)\s*tokens?\b/i

const MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000
}

export function parseTokenBudget(text: string): number | null {
  // "+500k" at start → 500,000
  // "+1m" at end → 1,000,000
  // "use 2M tokens" → 2,000,000
}
```

### 2. UI高亮位置

```typescript
export function findTokenBudgetPositions(text: string): Array<{
  start: number
  end: number
}>
```

### 3. 预算耗尽提示

```typescript
export function getBudgetContinuationMessage(
  pct: number,
  turnTokens: number,
  budget: number
): string {
  return `Stopped at ${pct}% of token target (${turnTokens} / ${budget}). Keep working — do not summarize.`
}
```

---

## OpenClaw应用

### 1. 飞书Token预算

```typescript
// 用户输入 "+500k" 设置预算
const budget = parseTokenBudget(userMessage)
if (budget) {
  // 设置session token预算
  session.tokenBudget = budget
}

// UI高亮
const positions = findTokenBudgetPositions(userMessage)
// 渲染高亮显示 "+500k" 部分
```

---

## 状态文件

```json
{
  "skill": "token-budget-parser",
  "priority": "P31",
  "source": "tokenBudget.ts",
  "enabled": true,
  "multipliers": {"k": 1000, "m": 1000000, "b": 1000000000},
  "createdAt": "2026-04-12T13:50:00Z"
}
```

---

## 参考

- Claude Code: `tokenBudget.ts`