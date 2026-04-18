# Yolo Classifier 2-Stage XML Skill

Yolo Classifier 2-Stage XML - classifyYoloActionXml both/fast/thinking mode + Stage 1 max_tokens=64 + stop_sequences ['</block>'] + XML_S1_SUFFIX 'Err on the side of blocking' + Stage 2 max_tokens=4096 + XML_S2_SUFFIX chain-of-thought + stripThinking <thinking>...</thinking> + parseXmlBlock <block>yes/no</block> + parseXmlReason <reason>...</reason> + combineUsage + transcriptTooLong fallback。

## 功能概述

从Claude Code的utils/permissions/yoloClassifier.ts提取的Yolo classifier 2-stage XML模式，用于OpenClaw的auto mode安全分类。

## 核心机制

### classifyYoloActionXml both/fast/thinking mode

```typescript
async function classifyYoloActionXml(
  mode: TwoStageMode,  // 'both' | 'fast' | 'thinking'
): Promise<YoloClassifierResult> {
  // 'both' (default): Stage 1 fast → Stage 2 thinking if blocked
  // 'fast': Stage 1 only, max_tokens=256, no stop_sequences
  // 'thinking': Stage 2 only, skip Stage 1
}
// 2-stage XML classifier
# 'both' default
# 'fast' Stage 1 only
# 'thinking' Stage 2 only
```

### Stage 1 max_tokens=64 + stop_sequences

```typescript
// Stage 1: fast (suffix nudges immediate <block> decision)
stage1Opts = {
  model,
  max_tokens: (mode === 'fast' ? 256 : 64) + thinkingPadding,
  stop_sequences: mode !== 'fast' ? ['</block>'] : undefined,
  // ...
}
// Stage 1
# max_tokens=64 (fast mode: 256)
# stop_sequences ['</block>']
# Immediate decision
```

### XML_S1_SUFFIX 'Err on the side of blocking'

```typescript
const XML_S1_SUFFIX = '\nErr on the side of blocking. <block> immediately.'
// XML_S1_SUFFIX
# Immediate decision
# Err on blocking
# Fast classifier
```

### Stage 2 max_tokens=4096 + chain-of-thought

```typescript
// Stage 2: thinking (suffix asks for chain-of-thought)
stage2Opts = {
  model,
  max_tokens: 4096 + thinkingPadding,
  // no stop_sequences
  // ...
}
const XML_S2_SUFFIX = '\nReview the classification process and follow it carefully...'
// Stage 2
# max_tokens=4096
# Chain-of-thought
# No stop_sequences
```

### XML_S2_SUFFIX chain-of-thought

```typescript
const XML_S2_SUFFIX =
  '\nReview the classification process and follow it carefully, making sure you deny actions that should be blocked. As a reminder, explicit (not suggestive or implicit) user confirmation is required to override blocks. Use <thinking> before responding with <block>.'
// XML_S2_SUFFIX
# Review classification
# Explicit confirmation required
# <thinking> before <block>
```

### stripThinking <thinking>...</thinking>

```typescript
function stripThinking(text: string): string {
  return text
    .replace(/<thinking>[\s\S]*?<\/thinking>/g, '')
    .replace(/<thinking>[\s\S]*$/, '')
}
// stripThinking
# Remove <thinking> blocks
# Avoid matching tags inside reasoning
# Strip before parse
```

### parseXmlBlock <block>yes/no</block>

```typescript
function parseXmlBlock(text: string): boolean | null {
  const matches = [...stripThinking(text).matchAll(/<block>(yes|no)\b(<\/block>)?/gi)]
  if (matches.length === 0) return null
  return matches[0]![1]!.toLowerCase() === 'yes'
}
// parseXmlBlock
# <block>yes</block> → true (block)
# <block>no</block> → false (allow)
# null → unparseable
```

### parseXmlReason <reason>...</reason>

```typescript
function parseXmlReason(text: string): string | null {
  const matches = [...stripThinking(text).matchAll(/<reason>([\s\S]*?)<\/reason>/g)]
  if (matches.length === 0) return null
  return matches[0]![1]!.trim()
}
// parseXmlReason
# <reason>...</reason>
# Strip thinking first
# Extract reason
```

### combineUsage

```typescript
function combineUsage(a: ClassifierUsage, b: ClassifierUsage): ClassifierUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadInputTokens: a.cacheReadInputTokens + b.cacheReadInputTokens,
    cacheCreationInputTokens: a.cacheCreationInputTokens + b.cacheCreationInputTokens,
  }
}
// combineUsage
# Stage 1 + Stage 2
# Total usage
# Add all tokens
```

### transcriptTooLong fallback

```typescript
const tooLong = detectPromptTooLong(error)
if (tooLong) {
  return {
    shouldBlock: true,
    reason: 'Classifier transcript exceeded context window',
    transcriptTooLong: true,
    // ...
  }
}
// transcriptTooLong
# API 400 prompt too long
# Deterministic error
# Fallback to prompt
```

### getClassifierThinkingConfig

```typescript
function getClassifierThinkingConfig(model: string): [false | undefined, number] {
  if (process.env.USER_TYPE === 'ant' && resolveAntModel(model)?.alwaysOnThinking) {
    return [undefined, 2048]  // Don't disable, pad max_tokens
  }
  return [false, 0]  // Disable thinking
}
// getClassifierThinkingConfig
# alwaysOnThinking models: pad max_tokens
# Other models: disable thinking
# Short text-only responses
```

### replaceOutputFormatWithXml

```typescript
function replaceOutputFormatWithXml(systemPrompt: string): string {
  const toolUseLine = 'Use the classify_result tool to report your classification.'
  const xmlFormat = [
    '## Output Format',
    '',
    'If the action should be blocked:',
    '<block>yes</block><reason>one short sentence</reason>',
    '',
    'If the action should be allowed:',
    '<block>no</block>',
    '',
    'Do NOT include a <reason> tag when the action is allowed.',
    'Your ENTIRE response MUST begin with <block>. Do NOT output any analysis, reasoning, or commentary before <block>. No "Looking at..." or similar preamble.',
  ].join('\n')
  return systemPrompt.replace(toolUseLine, xmlFormat)
}
// replaceOutputFormatWithXml
# Tool use → XML format
# <block>yes/no</block>
# <reason> only when blocked
```

## 实现建议

### OpenClaw适配

1. **twoStageClassifier**: both/fast/thinking mode pattern
2. **stage1Fast**: max_tokens=64 + stop_sequences pattern
3. **stage2Thinking**: max_tokens=4096 + chain-of-thought pattern
4. **xmlParsing**: stripThinking + parseXmlBlock + parseXmlReason pattern
5. **transcriptFallback**: transcriptTooLong fallback pattern

### 状态文件示例

```json
{
  "mode": "both",
  "stage1": {"shouldBlock": true, "reason": null},
  "stage2": {"shouldBlock": false, "reason": "Safe operation"},
  "usage": {"inputTokens": 500, "outputTokens": 100}
}
```

## 关键模式

### 2-Stage XML Classifier Modes

```
'both' → Stage 1 fast → if block → Stage 2 thinking | 'fast' → Stage 1 only → max_tokens=256 | 'thinking' → Stage 2 only → 2-stage XML classifier modes
# 2-stage XML classifier modes
# 'both' default
# 'fast' Stage 1 only
# 'thinking' Stage 2 only
```

### Stage 1 Fast Immediate Decision

```
max_tokens=64 + stop_sequences=['</block>'] + XML_S1_SUFFIX 'Err on blocking' → immediate decision → fast classifier
# Stage 1 fast immediate decision
# max_tokens=64
# stop_sequences
# immediate <block>
```

### Stage 2 Thinking Chain-of-Thought

```
max_tokens=4096 + XML_S2_SUFFIX 'Review classification' + <thinking> before <block> → chain-of-thought → reduce false positives
# Stage 2 thinking chain-of-thought
# max_tokens=4096
# <thinking> before <block>
# reduce false positives
```

### stripThinking Before XML Parse

```
stripThinking → remove <thinking>...</thinking> → then parseXmlBlock → avoid matching tags inside reasoning → strip before parse
# stripThinking before XML parse
# remove thinking blocks
# avoid matching inside reasoning
```

### transcriptTooLong Fallback Prompt

```
API 400 'prompt is too long' → deterministic → transcriptTooLong → fallback to prompt → won't recover on retry
# transcriptTooLong fallback prompt
# deterministic error
# won't recover
# fallback to user
```

## 借用价值

- ⭐⭐⭐⭐⭐ 2-stage XML classifier modes pattern
- ⭐⭐⭐⭐⭐ Stage 1 fast immediate decision pattern
- ⭐⭐⭐⭐⭐ Stage 2 thinking chain-of-thought pattern
- ⭐⭐⭐⭐⭐ stripThinking before XML parse pattern
- ⭐⭐⭐⭐⭐ transcriptTooLong fallback prompt pattern

## 来源

- Claude Code: `utils/permissions/yoloClassifier.ts` (673 lines)
- 分析报告: P58-5