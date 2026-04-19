# Prompt Suggestion Core Skill

智能建议生成 - 使用cache-safe fork预测用户下一个输入。

## 功能概述

从Claude Code的promptSuggestion.ts提取的智能建议模式，用于OpenClaw的用户体验增强。

## 核心机制

### 启用条件

```typescript
shouldEnablePromptSuggestion():
  // 禁用条件（优先级）
  - envOverride falsy → false
  - envOverride truthy → true
  - GrowthBook feature off → false
  - non-interactive session → false
  - swarm teammate → false  // 只有leader显示
  - settings.promptSuggestionEnabled === false → false
```

### 抑制检查

运行时检查：

```typescript
getSuggestionSuppressReason(appState):
  'disabled'           // 功能关闭
  'pending_permission' // 等待权限
  'elicitation_active' // 问答进行中
  'plan_mode'          // 计划模式
  'rate_limit'         // 速率限制
```

### Cache-Safe Fork（关键！）

**不修改任何API参数**，借用parent的prompt cache：

```typescript
runForkedAgent({
  cacheSafeParams,  // 不override tools/thinking - 会bust cache!
  canUseTool: async () => ({ behavior: 'deny' }),
  skipCacheWrite: true,
})
```

错误做法（PR #18143教训）：
- 设置effort:'low' → 45x cache writes spike（92.7%→61% hit rate）
- 覆盖maxOutputTokens → bust cache

### 过滤器

```typescript
shouldFilterSuggestion(suggestion):
  'done'           // "done"
  'meta_text'      // "nothing found", "stay silent"
  'meta_wrapped'   // (silence...), [no suggestion]
  'error_message'  // API errors
  'prefixed_label' // "Label: text"
  'too_few_words'  // 单词<2（排除slash commands和ALLOWED_SINGLE_WORDS）
  'too_many_words' // 单词>12
  'too_long'       // 长度>=100
  'multiple_sentences' // 有句号+大写
  'has_formatting' // 有换行/*
  'evaluative'     // "thanks", "looks good", "nice"
  'claude_voice'   // "Let me...", "I'll...", "Here's..."
```

ALLOWED_SINGLE_WORDS:
```
yes, yeah, yep, yea, yup, sure, ok, okay
push, commit, deploy, stop, continue, check, exit, quit
no
```

### Speculation（预执行）

```typescript
if (isSpeculationEnabled() && suggestion) {
  void startSpeculation(suggestion, context, ...)
}
```

### Outcome Logging

```typescript
logSuggestionOutcome(suggestion, userInput, emittedAt):
  similarity = userInput.length / suggestion.length
  wasAccepted = userInput === suggestion
  timeToAcceptMs / timeToIgnoreMs
```

## 实现建议

### OpenClaw适配

1. **触发时机**: postSampling hook
2. **fork**: sessions_spawn with lightContext
3. **cache**: 不修改任何参数
4. **过滤**: 同样的过滤器

### 状态文件示例

```json
{
  "enabled": true,
  "lastSuggestion": "run the tests",
  "acceptedCount": 12,
  "ignoredCount": 34,
  "suppressedCount": 8
}
```

## 关键模式

### Cache Piggyback

最关键的模式 - 不修改API参数，100%借用parent cache。

### Parent Cache Check

```typescript
getParentCacheSuppressReason(lastAssistantMessage):
  inputTokens + cacheWriteTokens + outputTokens > MAX_PARENT_UNCACHED_TOKENS(10000)
  → 'cache_cold'  // 父turn太贵，跳过
```

## 借用价值

- ⭐⭐⭐⭐⭐ Cache-safe是核心成本节省
- ⭐⭐⭐⭐ 过滤器提升建议质量
- ⭐⭐⭐⭐ Outcome tracking用于优化

## 来源

- Claude Code: `services/PromptSuggestion/promptSuggestion.ts`
- 分析报告: P33-3