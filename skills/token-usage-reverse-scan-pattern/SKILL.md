# Token Usage Reverse Scan Pattern Skill

Token Usage Reverse Scan Pattern - tokenCountWithEstimation + reverse scan last API response + parallel tool call walk-back + sibling message.id grouping + interleaved tool_results estimation + getTokenCountFromUsage + SYNTHETIC_MESSAGES skip + finalContextTokensFromLastResponse + iterations[-1]。

## 功能概述

从Claude Code的utils/tokens.ts提取的Token usage reverse scan模式，用于OpenClaw的Token计数。

## 核心机制

### tokenCountWithEstimation

```typescript
export function tokenCountWithEstimation(messages: readonly Message[]): number {
  let i = messages.length - 1
  while (i >= 0) {
    const message = messages[i]
    const usage = message ? getTokenUsage(message) : undefined
    if (message && usage) {
      // Walk back past any earlier sibling records split from the same API
      // response (same message.id) so interleaved tool_results between them
      // are included in the estimation slice.
      const responseId = getAssistantMessageId(message)
      if (responseId) {
        let j = i - 1
        while (j >= 0) {
          const prior = messages[j]
          const priorId = prior ? getAssistantMessageId(prior) : undefined
          if (priorId === responseId) {
            // Earlier split of the same API response — anchor here instead.
            i = j
          } else if (priorId !== undefined) {
            // Hit a different API response — stop walking.
            break
          }
          j--
        }
      }
      return (
        getTokenCountFromUsage(usage) +
        roughTokenCountEstimationForMessages(messages.slice(i + 1))
      )
    }
    i--
  }
  return roughTokenCountEstimationForMessages(messages)
}
// Reverse scan for last API response with usage
# Plus estimate for messages after
# Canonical context size function
```

### reverse Scan Last API Response

```typescript
let i = messages.length - 1
while (i >= 0) {
  const message = messages[i]
  const usage = message ? getTokenUsage(message) : undefined
  if (usage) {
    // Found last API response with usage
    return getTokenCountFromUsage(usage) + estimate(messages.slice(i + 1))
  }
  i--
}
// Reverse scan from end
# Find last assistant message with usage
# Most recent token count
```

### parallel Tool Call Walk-Back

```typescript
// Walk back past any earlier sibling records split from the same API response
// (same message.id) so interleaved tool_results between them are included
const responseId = getAssistantMessageId(message)
if (responseId) {
  let j = i - 1
  while (j >= 0) {
    const priorId = getAssistantMessageId(messages[j])
    if (priorId === responseId) {
      i = j  // Anchor here instead
    } else if (priorId !== undefined) {
      break  // Hit different API response
    }
    j--
  }
}
// Parallel tool calls walk-back
# Same message.id = split from same response
# Interleaved tool_results need estimation
# Walk to first sibling
```

### sibling message.id Grouping

```typescript
// message.id identifies split assistant records from same API response
// Parallel tool calls → multiple assistant records with same message.id
getAssistantMessageId(message) → responseId
// message.id grouping
# Same API response splits share message.id
# Group by message.id
```

### interleaved tool_results Estimation

```typescript
// Messages array looks like:
// [..., assistant(id=A), user(result), assistant(id=A), user(result), ...]
// If we stop at LAST assistant record, we only estimate one tool_result
// Walk back to FIRST sibling so all interleaved tool_results are included
return getTokenCountFromUsage(usage) + roughTokenCountEstimationForMessages(messages.slice(i + 1))
// Interleaved tool_results estimation
# slice(i + 1) includes all results after first sibling
```

### getTokenCountFromUsage

```typescript
export function getTokenCountFromUsage(usage: Usage): number {
  return (
    usage.input_tokens +
    (usage.cache_creation_input_tokens ?? 0) +
    (usage.cache_read_input_tokens ?? 0) +
    usage.output_tokens
  )
}
// Full context size from usage
# input + cache_creation + cache_read + output
# All tokens in context window
```

### SYNTHETIC_MESSAGES Skip

```typescript
if (
  message?.type === 'assistant' &&
  'usage' in message.message &&
  !(
    message.message.content[0]?.type === 'text' &&
    SYNTHETIC_MESSAGES.has(message.message.content[0].text)
  ) &&
  message.message.model !== SYNTHETIC_MODEL
) {
  return message.message.usage
}
return undefined
// Skip synthetic messages
# SYNTHETIC_MESSAGES: fake messages for UI
# SYNTHETIC_MODEL: placeholder model
# Don't count synthetic usage
```

### finalContextTokensFromLastResponse

```typescript
export function finalContextTokensFromLastResponse(messages: Message[]): number {
  let i = messages.length - 1
  while (i >= 0) {
    const usage = getTokenUsage(messages[i])
    if (usage) {
      const iterations = (usage as { iterations?: Array<{input_tokens: number, output_tokens: number}> | null }).iterations
      if (iterations && iterations.length > 0) {
        const last = iterations.at(-1)!
        return last.input_tokens + last.output_tokens  // Final iteration
      }
      // No iterations → top-level usage IS final window
      return usage.input_tokens + usage.output_tokens
    }
    i--
  }
  return 0
}
// Final context from usage.iterations[-1]
# Server tool loops → iterations array
# Last iteration = final context
# Exclude cache tokens
```

### iterations[-1]

```typescript
const iterations = usage.iterations
if (iterations && iterations.length > 0) {
  const last = iterations.at(-1)!
  return last.input_tokens + last.output_tokens
}
// Server tool loop iterations
# Each iteration: input + output
# Last iteration = final context window
```

## 实现建议

### OpenClaw适配

1. **tokenReverseScan**: tokenCountWithEstimation reverse scan pattern
2. **parallelWalkBack**: parallel tool call walk-back pattern
3. **siblingGrouping**: sibling message.id grouping pattern
4. **syntheticSkip**: SYNTHETIC_MESSAGES skip pattern
5. **finalContext**: finalContextTokensFromLastResponse pattern

### 状态文件示例

```json
{
  "lastUsage": {"input_tokens": 1000, "output_tokens": 500},
  "estimatedMessages": 5,
  "totalTokens": 1050,
  "iterations": 3
}
```

## 关键模式

### Reverse Scan Last Usage

```
messages.length - 1 → reverse scan → getTokenUsage → first with usage → last API response
# reverse scan找last usage
# 最后有usage的message
# last API response
```

### Parallel Tool Call Walk-Back

```
same message.id → walk back → first sibling → interleaved tool_results → all estimated
# parallel tool call walk-back
# same message.id分组
# interleaved tool_results都estimated
```

### Canonical Context Size Function

```
tokenCountWithEstimation: last usage + estimate new messages → threshold checks → autocompact/memory init
# canonical function for context size
# 用于threshold checks
# autocompact, session memory init
```

### SYNTHETIC_MESSAGES Skip Logic

```
SYNTHETIC_MESSAGES.has(text) || model === SYNTHETIC_MODEL → skip → don't count → fake UI messages
# SYNTHETIC_MESSAGES skip
# fake messages不count
# UI placeholder
```

### iterations[-1] Final Context

```
usage.iterations → server tool loops → iterations.at(-1) → final context → exclude cache
# iterations[-1] final context
# server tool loops的iterations
# exclude cache tokens
```

## 借用价值

- ⭐⭐⭐⭐⭐ Reverse scan last usage pattern
- ⭐⭐⭐⭐⭐ Parallel tool call walk-back pattern
- ⭐⭐⭐⭐⭐ Canonical context size function pattern
- ⭐⭐⭐⭐⭐ SYNTHETIC_MESSAGES skip pattern
- ⭐⭐⭐⭐⭐ iterations[-1] final context pattern

## 来源

- Claude Code: `utils/tokens.ts` (298 lines)
- 分析报告: P56-1