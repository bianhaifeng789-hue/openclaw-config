---
name: skill-budget
description: "Skill budget allocation. 1% context window. 250 chars per entry cap. Format commands within budget. Skill discovery optimization. Use when [skill budget] is needed."
metadata:
  openclaw:
    emoji: "🎨"
    triggers: [skill-discovery, skill-listing]
    feishuCard: true
---

# Skill Budget Skill - 技能预算分配

技能预算分配，优化技能发现。

## 为什么需要这个？

**场景**：
- 技能发现与列表
- 上下文预算管理
- 限制描述长度
- 优化 cache tokens
- 避免 waste

**Claude Code 方案**：SkillTool/prompt.ts + Budget allocation
**OpenClaw 飞书适配**：技能预算 + 发现优化

---

## 预算常量

```typescript
// 1% of context window for skill listing
const SKILL_BUDGET_CONTEXT_PERCENT = 0.01

// Characters per token estimate
const CHARS_PER_TOKEN = 4

// Default fallback: 1% of 200k × 4
const DEFAULT_CHAR_BUDGET = 8_000

// Per-entry hard cap
const MAX_LISTING_DESC_CHARS = 250
```

---

## Functions

### 1. Calculate Char Budget

```typescript
function getCharBudget(contextWindowTokens?: number): number {
  // Env override
  if (Number(process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET)) {
    return Number(process.env.SLASH_COMMAND_TOOL_CHAR_BUDGET)
  }
  
  // Context window based
  if (contextWindowTokens) {
    return Math.floor(
      contextWindowTokens * CHARS_PER_TOKEN * SKILL_BUDGET_CONTEXT_PERCENT
    )
  }
  
  // Default fallback
  return DEFAULT_CHAR_BUDGET
}
```

### 2. Format Commands Within Budget

```typescript
function formatCommandsWithinBudget(
  commands: Command[],
  contextWindowTokens?: number
): string {
  if (commands.length === 0) return ''
  
  const budget = getCharBudget(contextWindowTokens)
  
  // Full descriptions first
  const fullEntries = commands.map(cmd => ({
    cmd,
    full: formatCommandDescription(cmd)
  }))
  
  const fullTotal =
    fullEntries.reduce((sum, e) => sum + stringWidth(e.full), 0) +
    (fullEntries.length - 1)
  
  if (fullTotal <= budget) {
    return fullEntries.map(e => e.full).join('\n')
  }
  
  // Partition: bundled (never truncated) vs rest
  // ...
}
```

### 3. Truncate Description

```typescript
function getCommandDescription(cmd: Command): string {
  const desc = cmd.whenToUse
    ? `${cmd.description} - ${cmd.whenToUse}`
    : cmd.description
    
  return desc.length > MAX_LISTING_DESC_CHARS
    ? desc.slice(0, MAX_LISTING_DESC_CHARS - 1) + '\u2026' // '…'
    : desc
}
```

---

## 飞书卡片格式

### Skill Budget Status 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🎨 Skill Budget**\n\n---\n\n**预算分配**：\n\n| 参数 | 值 |\n|------|------|\n| **Context percent** | 1% |\n| **Chars per token** | 4 |\n| **Default budget** | 8,000 chars |\n| **Max desc chars** | 250 |\n\n---\n\n**当前预算**：\n```\nContext: 200k tokens\nBudget: 8,000 chars\nSkills: 25\nUsage: 6,250 chars (78%)\n```\n\n---\n\n**优化**：\n• Bundled skills never truncated\n• Custom skills truncate if needed\n• Cache tokens saved"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/skill-budget-state.json
{
  "lastDiscovery": null,
  "stats": {
    "totalSkills": 0,
    "budgetUsed": 0,
    "budgetTotal": 8000,
    "truncatedCount": 0
  },
  "config": {
    "contextPercent": 0.01,
    "charsPerToken": 4,
    "maxDescChars": 250,
    "defaultBudget": 8000
  },
  "lastUpdate": "2026-04-12T00:50:00Z",
  "notes": "Skill Budget Skill 创建完成。等待 skill discovery 触发。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| SkillTool/prompt.ts | Skill + Budget |
| SKILL_BUDGET_CONTEXT_PERCENT | 1% |
| MAX_LISTING_DESC_CHARS | 250 |
| formatCommandsWithinBudget() | 同样逻辑 |

---

## 注意事项

1. **Per-entry cap**：250 chars max
2. **Bundled skills**：Never truncated
3. **Custom skills**：Truncate if needed
4. **Cache tokens**：预算优化节省 cache tokens
5. **Env override**：SLASH_COMMAND_TOOL_CHAR_BUDGET

---

## 自动启用

此 Skill 在技能发现时自动计算预算。

---

## 下一步增强

- 飞书技能发现
- Budget analytics
- Cache tracking