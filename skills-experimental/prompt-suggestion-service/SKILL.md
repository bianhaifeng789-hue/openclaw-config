---
name: prompt-suggestion-service
description: |
  Generate next-step prompt suggestions after assistant responses using a forked Haiku agent. Runs in background without blocking main conversation.
  
  Use when:
  - Suggesting what the user might want to do next
  - Generating follow-up action recommendations
  - Providing proactive next-step hints after task completion
  
  Keywords: prompt suggestion, next step, follow-up, proactive suggestion, user intent
metadata:
  openclaw:
    emoji: "💡"
    source: claude-code-prompt-suggestion
    triggers: [next-step, suggestion, follow-up, proactive]
    priority: P2
---

# Prompt Suggestion Service

基于 Claude Code `services/PromptSuggestion/promptSuggestion.ts` 的下一步建议生成服务。

## 核心机制（来自 Claude Code）

### 工作流程
```
1. 用户收到 assistant 响应后
2. 后台启动 forked Haiku agent（不阻塞主对话）
3. Haiku 分析对话历史，生成 2-3 个下一步建议
4. 建议显示在输入框下方（UI 层）
5. 用户可点击直接发送
```

### 触发条件
```
- 非交互式会话（SDK/CCR）→ 禁用
- 团队成员（teammate）→ 禁用
- Agent swarms 启用时 → 禁用
- 功能开关关闭 → 禁用
```

### 变体类型
```typescript
type PromptVariant = 'user_intent' | 'stated_intent'
// 当前默认: 'user_intent'（推断用户意图）
```

## OpenClaw 适配实现

### 触发时机
```javascript
// 在 assistant 响应完成后调用
async function generatePromptSuggestions(conversationHistory, lastAssistantText) {
  // 检查是否应该生成建议
  if (!shouldGenerateSuggestions()) return null
  
  // 防止并发：取消上一次未完成的建议
  currentAbortController?.abort()
  currentAbortController = new AbortController()
  
  try {
    return await runSuggestionAgent(
      conversationHistory,
      lastAssistantText,
      currentAbortController.signal
    )
  } catch (err) {
    if (err.name === 'AbortError') return null
    logError(err)
    return null
  }
}
```

### 建议生成 Prompt
```
System: 你是一个助手，根据对话历史推断用户接下来最可能想做什么。
        生成 2-3 个简短的下一步建议（每个不超过 15 字）。
        格式：每行一个建议，不加序号。

User: [对话历史摘要]
      用户最后的意图：[lastAssistantText 前 200 字]
      
      请生成下一步建议：
```

### 飞书展示格式
```javascript
// 将建议作为快捷回复按钮展示
function formatSuggestionsAsFeishuCard(suggestions) {
  return {
    type: 'interactive',
    card: {
      elements: suggestions.map(s => ({
        tag: 'button',
        text: { content: s, tag: 'plain_text' },
        type: 'default',
        value: { action: 'send_suggestion', text: s }
      }))
    }
  }
}
```

## 与 Claude Code 的差异

| 特性 | Claude Code | OpenClaw 适配 |
|------|-------------|---------------|
| 展示方式 | 输入框下方 UI 按钮 | 飞书卡片按钮 |
| 模型 | Haiku（小型快速） | haiku-4-5 |
| 运行方式 | forked agent（进程内） | sessions_spawn subagent |
| 取消机制 | AbortController | sessions_spawn + kill |
| 触发时机 | 每次 assistant 响应后 | heartbeat on-event |
