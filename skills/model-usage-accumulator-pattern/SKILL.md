# Model Usage Accumulator Pattern Skill

Model Usage Accumulator Pattern - addToTotalModelUsage + shortName accumulate + getCanonicalName grouping + getUsageForModel + ModelUsage type + formatModelUsage display + model by short name + contextWindow + maxOutputTokens + advisor usage loop + unknown model cost。

## 功能概述

从Claude Code的cost-tracker.ts提取的Model usage accumulator模式，用于OpenClaw的模型使用统计。

## 核心机制

### addToTotalModelUsage

```typescript
function addToTotalModelUsage(
  cost: number,
  usage: Usage,
  model: string,
): ModelUsage {
  const modelUsage = getUsageForModel(model) ?? {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadInputTokens: 0,
    cacheCreationInputTokens: 0,
    webSearchRequests: 0,
    costUSD: 0,
    contextWindow: 0,
    maxOutputTokens: 0,
  }

  modelUsage.inputTokens += usage.input_tokens
  modelUsage.outputTokens += usage.output_tokens
  modelUsage.cacheReadInputTokens += usage.cache_read_input_tokens ?? 0
  modelUsage.cacheCreationInputTokens += usage.cache_creation_input_tokens ?? 0
  modelUsage.webSearchRequests += usage.server_tool_use?.web_search_requests ?? 0
  modelUsage.costUSD += cost
  modelUsage.contextWindow = getContextWindowForModel(model, getSdkBetas())
  modelUsage.maxOutputTokens = getModelMaxOutputTokens(model).default

  return modelUsage
}
// Accumulate model usage
# Get or create modelUsage
# Add tokens + cost
# Update contextWindow/maxOutputTokens
```

### shortName Accumulate

```typescript
// Accumulate usage by short name
const usageByShortName: { [shortName: string]: ModelUsage } = {}
for (const [model, usage] of Object.entries(modelUsageMap)) {
  const shortName = getCanonicalName(model)
  if (!usageByShortName[shortName]) {
    usageByShortName[shortName] = { /* initial */ }
  }
  const accumulated = usageByShortName[shortName]
  accumulated.inputTokens += usage.inputTokens
  // ...
}
// Accumulate by shortName
# Multiple model variants → same shortName
# Group by canonical name
```

### getCanonicalName Grouping

```typescript
const shortName = getCanonicalName(model)
// claude-3-5-sonnet-20241022 → claude-3.5-sonnet
// claude-sonnet-4-20250514 → claude-sonnet-4
// Group by canonical/short name
# Multiple variants → single display
```

### getUsageForModel

```typescript
const modelUsage = getUsageForModel(model) ?? { /* initial */ }
// Get existing usage for model
# ?? null → create new
# Accumulate on existing
```

### ModelUsage Type

```typescript
type ModelUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  webSearchRequests: number
  costUSD: number
  contextWindow: number
  maxOutputTokens: number
}
// Model usage type
# Input/output tokens
# Cache tokens
# Web search requests
# Cost + context info
```

### formatModelUsage Display

```typescript
function formatModelUsage(): string {
  const modelUsageMap = getModelUsage()

  // Accumulate usage by short name
  const usageByShortName: { [shortName: string]: ModelUsage } = {}
  // ...

  let result = 'Usage by model:'
  for (const [shortName, usage] of Object.entries(usageByShortName)) {
    const usageString =
      `  ${formatNumber(usage.inputTokens)} input, ` +
      `${formatNumber(usage.outputTokens)} output, ` +
      `${formatNumber(usage.cacheReadInputTokens)} cache read, ` +
      `${formatNumber(usage.cacheCreationInputTokens)} cache write` +
      (usage.webSearchRequests > 0 ? `, ${formatNumber(usage.webSearchRequests)} web search` : '') +
      ` (${formatCost(usage.costUSD)})`
    result += `\n` + `${shortName}:`.padStart(21) + usageString
  }
  return result
}
// Format model usage display
# Accumulate by shortName
# Format numbers with Intl.NumberFormat
# Web search optional
```

### model by short name

```typescript
// Display by short name, not full model name
# User-friendly display
# Multiple variants → single entry
```

### contextWindow + maxOutputTokens

```typescript
modelUsage.contextWindow = getContextWindowForModel(model, getSdkBetas())
modelUsage.maxOutputTokens = getModelMaxOutputTokens(model).default
// Context window and max output
# Model-specific constants
# Added to usage record
```

### advisor usage loop

```typescript
let totalCost = cost
for (const advisorUsage of getAdvisorUsage(usage)) {
  const advisorCost = calculateUSDCost(advisorUsage.model, advisorUsage)
  logEvent('tengu_advisor_tool_token_usage', { /* ... */ })
  totalCost += addToTotalSessionCost(advisorCost, advisorUsage, advisorUsage.model)
}
return totalCost
// Advisor usage loop
# getAdvisorUsage extracts advisor usage
# Log + accumulate
# Total cost includes advisor
```

### unknown model cost

```typescript
export function hasUnknownModelCost(): boolean
// Check if unknown model used
# Unknown model = cost may be inaccurate
# Display warning
```

## 实现建议

### OpenClaw适配

1. **modelUsageAcc**: addToTotalModelUsage pattern
2. **shortNameGroup**: getCanonicalName + shortName accumulate pattern
3. **formatUsage**: formatModelUsage display pattern
4. **advisorLoop**: advisor usage loop pattern
5. **unknownModel**: hasUnknownModelCost pattern

### 状态文件示例

```json
{
  "model": "claude-3-5-sonnet-20241022",
  "shortName": "claude-3.5-sonnet",
  "inputTokens": 1000,
  "outputTokens": 500,
  "costUSD": 0.01
}
```

## 关键模式

### Accumulate by shortName

```
getCanonicalName(model) → shortName → group variants → single display → user-friendly
# shortName accumulate
# 多个variants group成single
# user-friendly display
```

### ?? null Create Pattern

```
getUsageForModel(model) ?? {initial} → existing or create → accumulate → null coalescing
# ?? null create pattern
# existing或create new
# accumulate on existing
```

### Intl.NumberFormat Format

```
formatNumber(usage.inputTokens) → Intl.NumberFormat → compact display → 1,000 → "1k"
# Intl.NumberFormat format
# compact display
# readable numbers
```

### advisor usage loop Total

```
for (advisorUsage of getAdvisorUsage(usage)) → log + addToTotalCost → totalCost includes advisor
# advisor usage loop
# log + accumulate
# total cost includes advisor
```

### Web Search Optional Display

```
usage.webSearchRequests > 0 ? ", X web search" : "" → optional display → only if > 0
# web search optional display
# > 0时显示
# optional field
```

## 借用价值

- ⭐⭐⭐⭐⭐ Accumulate by shortName pattern
- ⭐⭐⭐⭐⭐ ?? null create pattern
- ⭐⭐⭐⭐⭐ Intl.NumberFormat format pattern
- ⭐⭐⭐⭐ advisor usage loop pattern
- ⭐⭐⭐⭐ Web search optional display pattern

## 来源

- Claude Code: `cost-tracker.ts` (308 lines)
- 分析报告: P56-6