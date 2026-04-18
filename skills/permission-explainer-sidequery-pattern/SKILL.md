# Permission Explainer SideQuery Pattern Skill

Permission Explainer SideQuery Pattern - generatePermissionExplanation Haiku + forced tool_choice guaranteed structured output + explain_command tool definition + RiskAssessmentSchema lazySchema + sideQuery separate budget + isPermissionExplainerEnabled config toggle + extractConversationContext recent assistant messages + RISK_LEVEL_NUMERIC analytics map + error type codes parse/network/unknown + latency_ms tracking。

## 功能概述

从Claude Code的utils/permissions/permissionExplainer.ts提取的Permission explainer sideQuery模式，用于OpenClaw的权限解释生成。

## 核心机制

### generatePermissionExplanation Haiku

```typescript
export async function generatePermissionExplanation({
  toolName,
  toolInput,
  toolDescription,
  messages,
  signal,
}: GenerateExplanationParams): Promise<PermissionExplanation | null> {
  // Check if feature is enabled
  if (!isPermissionExplainerEnabled()) return null
  
  const model = getMainLoopModel()
  
  // Use sideQuery with forced tool choice
  const response = await sideQuery({
    model,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    tools: [EXPLAIN_COMMAND_TOOL],
    tool_choice: { type: 'tool', name: 'explain_command' },
    signal,
    querySource: 'permission_explainer',
  })
  // ...
}
// generatePermissionExplanation
# sideQuery separate budget
# forced tool_choice
# Guaranteed structured output
```

### forced tool_choice guaranteed structured output

```typescript
const EXPLAIN_COMMAND_TOOL = {
  name: 'explain_command',
  description: 'Provide an explanation of a shell command',
  input_schema: {
    type: 'object' as const,
    properties: {
      explanation: { type: 'string', description: 'What this command does (1-2 sentences)' },
      reasoning: { type: 'string', description: 'Why YOU are running this command. Start with "I"' },
      risk: { type: 'string', description: 'What could go wrong, under 15 words' },
      riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    },
    required: ['explanation', 'reasoning', 'risk', 'riskLevel'],
  },
}

// Use tool_choice: { type: 'tool', name: 'explain_command' } for guaranteed structured output
// forced tool_choice
# Guaranteed JSON output
# No beta required
# Structured response
```

### explain_command tool definition

```typescript
const EXPLAIN_COMMAND_TOOL = {
  name: 'explain_command',
  input_schema: {
    properties: {
      explanation: { type: 'string' },
      reasoning: { type: 'string' },
      risk: { type: 'string' },
      riskLevel: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
    },
    required: ['explanation', 'reasoning', 'risk', 'riskLevel'],
  },
}
// explain_command tool
# explanation + reasoning + risk + riskLevel
# Required fields
# Enum for riskLevel
```

### RiskAssessmentSchema lazySchema

```typescript
const RiskAssessmentSchema = lazySchema(() =>
  z.object({
    riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
    explanation: z.string(),
    reasoning: z.string(),
    risk: z.string(),
  }),
)

const result = RiskAssessmentSchema().safeParse(toolUseBlock.input)
// lazySchema
# Lazy evaluation
# Zod validation
# SafeParse
```

### sideQuery separate budget

```typescript
const response = await sideQuery({
  model,
  system: SYSTEM_PROMPT,
  messages: [{ role: 'user', content: userPrompt }],
  tools: [EXPLAIN_COMMAND_TOOL],
  tool_choice: { type: 'tool', name: 'explain_command' },
  signal,
  querySource: 'permission_explainer',  // Separate budget tracking
})
// sideQuery
# querySource: 'permission_explainer'
# Separate budget
# Not main query cost
```

### isPermissionExplainerEnabled config toggle

```typescript
export function isPermissionExplainerEnabled(): boolean {
  return getGlobalConfig().permissionExplainerEnabled !== false
}
// isPermissionExplainerEnabled
# Global config toggle
# Default enabled
# Opt-out via config
```

### extractConversationContext recent assistant messages

```typescript
function extractConversationContext(messages: Message[], maxChars = 1000): string {
  const assistantMessages = messages
    .filter((m): m is AssistantMessage => m.type === 'assistant')
    .slice(-3)  // Last 3 assistant messages

  const contextParts: string[] = []
  let totalChars = 0

  for (const msg of assistantMessages.reverse()) {
    const textBlocks = msg.message.content
      .filter(c => c.type === 'text')
      .map(c => ('text' in c ? c.text : ''))
      .join(' ')

    if (textBlocks && totalChars < maxChars) {
      const remaining = maxChars - totalChars
      const truncated = textBlocks.length > remaining
        ? textBlocks.slice(0, remaining) + '...'
        : textBlocks
      contextParts.unshift(truncated)
      totalChars += truncated.length
    }
  }

  return contextParts.join('\n\n')
}
// extractConversationContext
# Last 3 assistant messages
# maxChars = 1000
# Text blocks only
# Truncate to budget
```

### RISK_LEVEL_NUMERIC analytics map

```typescript
const RISK_LEVEL_NUMERIC: Record<RiskLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

logEvent('tengu_permission_explainer_generated', {
  tool_name: sanitizeToolNameForAnalytics(toolName),
  risk_level: RISK_LEVEL_NUMERIC[explanation.riskLevel],
  latency_ms: latencyMs,
})
// RISK_LEVEL_NUMERIC
# LOW=1, MEDIUM=2, HIGH=3
# Analytics numeric
# Event tracking
```

### error type codes parse/network/unknown

```typescript
const ERROR_TYPE_PARSE = 1
const ERROR_TYPE_NETWORK = 2
const ERROR_TYPE_UNKNOWN = 3

logEvent('tengu_permission_explainer_error', {
  tool_name: sanitizeToolNameForAnalytics(toolName),
  error_type: error instanceof Error && error.name === 'AbortError'
    ? ERROR_TYPE_NETWORK
    : ERROR_TYPE_UNKNOWN,
  latency_ms: latencyMs,
})
// error type codes
# 1=parse, 2=network, 3=unknown
# Analytics error types
```

### latency_ms tracking

```typescript
const startTime = Date.now()

// ... API call ...

const latencyMs = Date.now() - startTime

logEvent('tengu_permission_explainer_generated', {
  latency_ms: latencyMs,
})
// latency_ms tracking
# startTime + endTime
# Analytics latency
```

## 实现建议

### OpenClaw适配

1. **sideQueryBudget**: separate querySource pattern
2. **forcedToolChoice**: guaranteed structured output pattern
3. **lazySchemaValidation**: lazySchema + safeParse pattern
4. **contextExtraction**: recent assistant messages pattern
5. **analyticsTracking**: numeric + error codes + latency pattern

### 状态文件示例

```json
{
  "riskLevel": "MEDIUM",
  "explanation": "This command installs npm dependencies",
  "reasoning": "I need to install the project dependencies",
  "risk": "Could install malicious packages",
  "latency_ms": 450
}
```

## 关键模式

### forced tool_choice Guaranteed JSON

```
tool_choice: { type: 'tool', name: 'explain_command' } → forced tool use → guaranteed JSON output → no beta required → structured response
# forced tool_choice guaranteed JSON
# guaranteed structured output
# no beta endpoints
```

### sideQuery Separate Budget

```
querySource: 'permission_explainer' → separate budget → not main query cost → cost tracking separate → sideQuery pattern
# sideQuery separate budget
# separate cost tracking
# not main query budget
```

### extractConversationContext maxChars Truncate

```
last 3 assistant messages → maxChars=1000 → truncate → context for "why" → text blocks only → extractConversationContext
# extractConversationContext maxChars truncate
# last 3 assistant messages
# truncate to budget
```

### RISK_LEVEL_NUMERIC Analytics Map

```
LOW=1, MEDIUM=2, HIGH=3 → numeric for analytics → logEvent → risk_level field → tracking pattern
# RISK_LEVEL_NUMERIC analytics map
# string → numeric
# analytics friendly
```

### Error Type Codes 1/2/3

```
ERROR_TYPE_PARSE=1, ERROR_TYPE_NETWORK=2, ERROR_TYPE_UNKNOWN=3 → error classification → analytics codes → log pattern
# error type codes 1/2/3
# parse/network/unknown
# analytics classification
```

## 倉用价值

- ⭐⭐⭐⭐⭐ forced tool_choice guaranteed JSON pattern
- ⭐⭐⭐⭐⭐ sideQuery separate budget pattern
- ⭐⭐⭐⭐⭐ extractConversationContext maxChars truncate pattern
- ⭐⭐⭐⭐⭐ RISK_LEVEL_NUMERIC analytics map pattern
- ⭐⭐⭐⭐⭐ Error type codes 1/2/3 pattern

## 来源

- Claude Code: `utils/permissions/permissionExplainer.ts` (181 lines)
- 分析报告: P59-10