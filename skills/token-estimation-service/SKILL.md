# Token Estimation Service Skill

**优先级**: P32
**来源**: Claude Code `tokenEstimation.ts`
**适用场景**: 跨provider token计数

---

## 概述

Token Estimation Service提供跨provider token计数功能，支持Anthropic API、Bedrock、Vertex。检测thinking blocks，strip tool search fields，使用VCR wrapper录制/回放。

---

## 核心功能

### 1. 跨Provider计数

```typescript
export async function countMessagesTokensWithAPI(
  messages: BetaMessageParam[],
  tools: BetaToolUnion[]
): Promise<number | null> {
  const model = getMainLoopModel()
  const betas = getModelBetas(model)
  const containsThinking = hasThinkingBlocks(messages)
  
  if (getAPIProvider() === 'bedrock') {
    return countTokensWithBedrock(messages, tools, model)
  }
  
  if (getAPIProvider() === 'vertex') {
    return countTokensWithVertex(messages, tools, model)
  }
  
  // Anthropic API
  const response = await client.beta.messages.countTokens({
    model, messages, tools, betas,
    thinking: containsThinking
      ? { type: 'enabled', budget_tokens: 1024 }
      : undefined
  })
  
  return response.input_tokens
}
```

### 2. Thinking Blocks检测

```typescript
function hasThinkingBlocks(messages: BetaMessageParam[]): boolean {
  for (const message of messages) {
    if (message.role === 'assistant' && Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === 'thinking' || block.type === 'redacted_thinking') {
          return true
        }
      }
    }
  }
  return false
}
```

### 3. Tool Search Fields Strip

```typescript
function stripToolSearchFieldsFromMessages(
  messages: BetaMessageParam[]
): BetaMessageParam[] {
  return messages.map(message => {
    if (!Array.isArray(message.content)) return message
    
    return {
      ...message,
      content: message.content.map(block => {
        if (block.type === 'tool_use') {
          // Strip 'caller' field
          return { type: 'tool_use', id, name, input }
        }
        if (block.type === 'tool_result') {
          // Strip 'tool_reference' blocks
          const filtered = content.filter(c => !isToolReferenceBlock(c))
          return { ...block, content: filtered }
        }
        return block
      })
    }
  })
}
```

---

## OpenClaw应用

### 1. Token预算估算

```typescript
// 估算当前对话token数
const tokens = await countMessagesTokensWithAPI(messages, tools)

if (tokens && tokens > tokenBudget) {
  // 超预算警告
}
```

---

## 状态文件

```json
{
  "skill": "token-estimation-service",
  "priority": "P32",
  "source": "tokenEstimation.ts",
  "enabled": true,
  "providers": ["anthropic", "bedrock", "vertex"],
  "thinkingBudget": 1024,
  "createdAt": "2026-04-12T14:00:00Z"
}
```

---

## 参考

- Claude Code: `tokenEstimation.ts`