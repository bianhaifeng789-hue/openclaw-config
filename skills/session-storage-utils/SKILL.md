---
name: session-storage-utils
description: "Session storage utilities. Transcript type + isTranscriptMessage + MAX_TOMBSTONE_REWRITE_BYTES=50MB + SKIP_FIRST_PROMPT_PATTERN + loadTranscriptFile + saveMessage + insertMessageChain + parentUuid chain + JSONL format + Session persistence + Session project dir + Session ID/Agent ID. Use when [session storage utils] is needed."
metadata:
  openclaw:
    emoji: "💾"
    triggers: [session-storage, transcript]
    feishuCard: true
---

# Session Storage Utils Skill - Session Storage Utils

Session Storage Utils 会话存储工具。

## 为什么需要这个？

**场景**：
- Transcript persistence
- Session state storage
- JSONL format
- parentUuid chain
- Message history

**Claude Code 方案**：sessionStorage.ts + 5000+ lines
**OpenClaw 飞书适配**：Session storage + Transcript

---

## Constants

```typescript
const MAX_TOMBSTONE_REWRITE_BYTES = 50 * 1024 * 1024 // 50MB
```

---

## Types

### Transcript

```typescript
type Transcript = (
  | UserMessage
  | AssistantMessage
  | AttachmentMessage
  | SystemMessage
)[]
```

---

## Functions

### 1. Is Transcript Message

```typescript
export function isTranscriptMessage(entry: Entry): entry is TranscriptMessage {
  return (
    entry.type === 'user' ||
    entry.type === 'assistant' ||
    entry.type === 'attachment' ||
    entry.type === 'system'
  )
}
```

### 2. Load Transcript File

```typescript
export async function loadTranscriptFile(
  sessionId: SessionId,
  options?: LoadOptions,
): Promise<TranscriptLoadResult> {
  // Implementation...
}
```

### 3. Save Message

```typescript
export async function saveMessage(
  message: Message,
  options?: SaveOptions,
): Promise<void> {
  // Implementation...
}
```

### 4. Insert Message Chain

```typescript
export function insertMessageChain(
  messages: Message[],
  parentUuid?: UUID,
): UUID[] {
  // Implementation...
}
```

---

## JSONL Format

```
{"type":"user","uuid":"xxx","parentUuid":"yyy","message":{...}}
{"type":"assistant","uuid":"xxx","parentUuid":"yyy","message":{...}}
{"type":"system","uuid":"xxx","parentUuid":"yyy","message":{...}}
```

---

## parentUuid Chain

- Each message has `uuid` and `parentUuid`
- Chain starts with `parentUuid: undefined`
- Enables message ancestry tracking
- Supports conversation branching

---

## SKIP_FIRST_PROMPT_PATTERN

```typescript
const SKIP_FIRST_PROMPT_PATTERN =
  /^(?:\s*<[a-z][\w-]*[\s>]|\[Request interrupted by user[^\]]*\])/
```

- Skip IDE context
- Skip hook output
- Skip task notifications
- Skip interrupt markers

---

## 飞书卡片格式

### Session Storage Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**💾 Session Storage Utils**\n\n---\n\n**Constants**：\n• MAX_TOMBSTONE_REWRITE_BYTES = 50MB\n\n---\n\n**Types**：\n• Transcript\n• TranscriptMessage\n\n---\n\n**Functions**：\n• isTranscriptMessage()\n• loadTranscriptFile()\n• saveMessage()\n• insertMessageChain()\n\n---\n\n**Format**：\n• JSONL\n• parentUuid chain\n\n---\n\n**Skip Pattern**：\n• SKIP_FIRST_PROMPT_PATTERN"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/session-storage-utils-state.json
{
  "stats": {
    "totalSessions": 0,
    "totalMessages": 0,
    "tombstoneRewrites": 0
  },
  "lastUpdate": "2026-04-12T12:37:00Z",
  "notes": "Session Storage Utils Skill 创建完成。"
}