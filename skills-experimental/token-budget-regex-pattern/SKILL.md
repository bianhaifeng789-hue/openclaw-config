# Token Budget Regex Pattern Skill

Token Budget Regex Pattern - parseTokenBudget + regex anchored patterns + shorthand +500k anchors + verbose "use/spend 2M tokens" anywhere + k/m/b multipliers + findTokenBudgetPositions + matchAll global + double-count avoid + lookbehind avoid (JSC YARR JIT) + position offsets。

## 功能概述

从Claude Code的utils/tokenBudget.ts提取的Token budget regex模式，用于OpenClaw的Token预算解析。

## 核心机制

### parseTokenBudget

```typescript
export function parseTokenBudget(text: string): number | null {
  const startMatch = text.match(SHORTHAND_START_RE)  // ^\s*\+(\d+)(k|m|b)
  if (startMatch) return parseBudgetMatch(startMatch[1]!, startMatch[2]!)

  const endMatch = text.match(SHORTHAND_END_RE)      // \s\+(\d+)(k|m|b)[.!?]?\s*$
  if (endMatch) return parseBudgetMatch(endMatch[1]!, endMatch[2]!)

  const verboseMatch = text.match(VERBOSE_RE)        // (?:use|spend)\s+(\d+)(k|m|b)\s*tokens?
  if (verboseMatch) return parseBudgetMatch(verboseMatch[1]!, verboseMatch[2]!)

  return null
}
// Parse token budget from text
# Multiple regex patterns
# Try each in sequence
```

### regex Anchored Patterns

```typescript
const SHORTHAND_START_RE = /^\s*\+(\d+(?:\.\d+)?)\s*(k|m|b)\b/i  // Anchored at start
const SHORTHAND_END_RE = /\s\+(\d+(?:\.\d+)?)\s*(k|m|b)\s*[.!?]?\s*$/i  // Anchored at end
const VERBOSE_RE = /\b(?:use|spend)\s+(\d+(?:\.\d+)?)\s*(k|m|b)\s*tokens?\b/i  // Matches anywhere
// Anchored regex patterns
# Start anchor: ^ (false positives avoided)
# End anchor: $ (false positives avoided)
# Verbose: no anchor (natural language)
```

### shorthand +500k Anchors

```typescript
// Shorthand (+500k) anchored to start/end to avoid false positives in natural language.
// "+500k" at start: " +500k tokens" → parse
// "+500k" at end: "work on X +500k." → parse
// Middle: "use +500k in your code" → NOT matched (false positive avoided)
// Anchored shorthand
# Avoid false positives in natural text
# Only match at start/end
```

### verbose "use/spend 2M tokens" anywhere

```typescript
const VERBOSE_RE = /\b(?:use|spend)\s+(\d+(?:\.\d+)?)\s*(k|m|b)\s*tokens?\b/i
// Verbose matches anywhere
# "use 2M tokens" anywhere in text
# Natural language command
```

### k/m/b Multipliers

```typescript
const MULTIPLIERS: Record<string, number> = {
  k: 1_000,
  m: 1_000_000,
  b: 1_000_000_000,
}

function parseBudgetMatch(value: string, suffix: string): number {
  return parseFloat(value) * MULTIPLIERS[suffix.toLowerCase()]!
}
// k/m/b multipliers
# k: thousand
# m: million
# b: billion
```

### findTokenBudgetPositions

```typescript
export function findTokenBudgetPositions(
  text: string,
): Array<{ start: number; end: number }> {
  const positions: Array<{ start: number; end: number }> = []

  // Start match position
  const startMatch = text.match(SHORTHAND_START_RE)
  if (startMatch) {
    const offset = startMatch.index! + startMatch[0].length - startMatch[0].trimStart().length
    positions.push({ start: offset, end: startMatch.index! + startMatch[0].length })
  }

  // End match position (avoid double-counting)
  const endMatch = text.match(SHORTHAND_END_RE)
  if (endMatch) {
    const endStart = endMatch.index! + 1  // +1: regex includes leading \s
    const alreadyCovered = positions.some(p => endStart >= p.start && endStart < p.end)
    if (!alreadyCovered) {
      positions.push({ start: endStart, end: endMatch.index! + endMatch[0].length })
    }
  }

  // Verbose matches (global)
  for (const match of text.matchAll(VERBOSE_RE_G)) {
    positions.push({ start: match.index, end: match.index + match[0].length })
  }

  return positions
}
// Find all budget positions in text
# Multiple pattern matches
# Return position ranges
```

### matchAll Global

```typescript
const VERBOSE_RE_G = new RegExp(VERBOSE_RE.source, 'gi')
for (const match of text.matchAll(VERBOSE_RE_G)) {
  positions.push({ start: match.index, end: match.index + match[0].length })
}
// Global regex for multiple matches
# matchAll iteration
# Find all verbose matches
```

### double-count Avoid

```typescript
// Avoid double-counting when input is just "+500k"
// If start match already covers end match position, skip
const alreadyCovered = positions.some(p => endStart >= p.start && endStart < p.end)
if (!alreadyCovered) {
  positions.push(...)
}
// Avoid double-counting
# Single "+500k" matches both start and end
# Only add once
```

### lookbehind Avoid (JSC YARR JIT)

```typescript
// Lookbehind (?<=\s) is avoided — it defeats YARR JIT in JSC, and the
// interpreter scans O(n) even with the $ anchor. Capture the whitespace
// instead; callers offset match.index by 1 where position matters.
const SHORTHAND_END_RE = /\s\+(\d+)(k|m|b)\s*[.!?]?\s*$/i
// Avoid lookbehind
# JavaScriptCore YARR JIT defeated
# O(n) scan even with $ anchor
# Capture whitespace instead
```

### position Offsets

```typescript
// Callers offset match.index by 1 where position matters
const endStart = endMatch.index! + 1  // +1: regex includes leading \s
// Position offset
# Whitespace captured, not lookbehind
# offset by 1 to skip leading space
```

## 实现建议

### OpenClaw适配

1. **budgetRegex**: parseTokenBudget regex pattern
2. **anchoredPatterns**: Anchored shorthand patterns
3. **kmbMultipliers**: k/m/b multipliers pattern
4. **findPositions**: findTokenBudgetPositions pattern
5. **lookbehindAvoid**: lookbehind avoid JSC JIT pattern

### 状态文件示例

```json
{
  "budget": 500000,
  "matchType": "shorthand_start",
  "position": {"start": 0, "end": 6}
}
```

## 关键模式

### Anchored Regex False Positive Avoid

```
^\s*\+ → anchored at start | \s\+$ → anchored at end → false positives avoided in natural language
# anchored regex避免false positives
# natural language中"+500k"不误匹配
# 只匹配start/end
```

### Verbose Matches Anywhere

```
(?:use|spend)\s+(\d+)(k|m|b)\s*tokens? → natural language → anywhere → no anchor
# verbose pattern matches anywhere
# natural language command
# "use 2M tokens"
```

### k/m/b Multiplier Table

```
{k:1000, m:1000000, b:1000000000} → parseFloat(value) * multiplier → parse
# k/m/b multiplier table
# thousand/million/billion
```

### matchAll + double-count Avoid

```
positions.some(p => endStart >= p.start) → already covered → skip → avoid double-count
# double-count避免
# single "+500k"只count一次
```

### lookbehind Avoid JSC JIT

```
(?<=\s) lookbehind → defeats YARR JIT → O(n) scan → capture whitespace instead → offset +1
# lookbehind避免JSC JIT问题
# capture whitespace替代
# offset调整position
```

## 借用价值

- ⭐⭐⭐⭐⭐ Anchored regex false positive avoid pattern
- ⭐⭐⭐⭐⭐ k/m/b multiplier pattern
- ⭐⭐⭐⭐⭐ matchAll + double-count avoid pattern
- ⭐⭐⭐⭐⭐ lookbehind avoid JSC JIT pattern
- ⭐⭐⭐⭐ Verbose natural language pattern

## 来源

- Claude Code: `utils/tokenBudget.ts` (80 lines)
- 分析报告: P56-2