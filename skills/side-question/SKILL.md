# Side Question Skill

**优先级**: P30
**来源**: Claude Code `sideQuestion.ts`
**适用场景**: 飞书快速问答、不打断主对话

---

## 概述

Side Question实现 `/btw` 功能，用户可以快速提问不打断主agent。使用forked agent运行，共享parent's prompt cache，tools blocked，max 1 turn。

---

## 核心功能

### 1. 关键字检测

```typescript
const BTW_PATTERN = /^\/btw\b/gi

export function findBtwTriggerPositions(text: string): Array<{
  word: string
  start: number
  end: number
}>
```

### 2. Forked Agent运行

```typescript
export async function runSideQuestion({
  question,
  cacheSafeParams
}): Promise<SideQuestionResult> {
  // Wrap question with instructions
  const wrappedQuestion = `<system-reminder>
This is a side question from the user.
- You have NO tools available
- This is a one-off response
- Simply answer with what you know
</system-reminder>

${question}`

  return await runForkedAgent({
    promptMessages: [createUserMessage({ content: wrappedQuestion })],
    cacheSafeParams, // Share parent's cache
    canUseTool: async () => ({ behavior: 'deny' }),
    maxTurns: 1,
    skipCacheWrite: true
  })
}
```

---

## 实现要点

### 1. 共享Prompt Cache

```typescript
// Do NOT override thinkingConfig — thinking is part of the API cache key
// Diverging from main thread's config busts the prompt cache
// Adaptive thinking on quick Q&A has negligible overhead
```

### 2. Tools Blocked

```typescript
canUseTool: async () => ({
  behavior: 'deny',
  message: 'Side questions cannot use tools',
  decisionReason: { type: 'other', reason: 'side_question' }
})
```

### 3. Single Turn

```typescript
maxTurns: 1 // Single turn only - no tool use loops
skipCacheWrite: true // No future request shares this suffix
```

---

## OpenClaw应用

### 1. 飞书快速问答

```typescript
// 检测 /btw 关键字
if (userMessage.startsWith('/btw ')) {
  const question = userMessage.slice(5)
  const result = await runSideQuestion({
    question,
    cacheSafeParams
  })
  
  // 发送飞书回复
  await feishuApi.sendMessage({
    content: result.response || '无法回答',
    msg_type: 'text'
  })
}
```

### 2. 不打断主对话

```typescript
// Forked agent独立运行
// 主agent继续工作
// 侧边问答不影响主流程
```

---

## 状态文件

```json
{
  "skill": "side-question",
  "priority": "P30",
  "source": "sideQuestion.ts",
  "enabled": true,
  "trigger": "/btw",
  "maxTurns": 1,
  "toolsBlocked": true,
  "createdAt": "2026-04-12T13:30:00Z"
}
```

---

## 参考

- Claude Code: `sideQuestion.ts`
- Forked Agent: `forkedAgent.ts`