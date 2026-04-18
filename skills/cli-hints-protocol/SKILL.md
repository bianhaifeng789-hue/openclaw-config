# CLI Hints Protocol Skill

**优先级**: P29
**来源**: Claude Code `claudeCodeHints.ts`
**适用场景**: Feishu卡片协议、CLI/SDK通信

---

## 概述

CLI Hints Protocol允许SDK/CLI通过stderr发送自关闭XML标签 `<claude-code-hint />`，harness扫描处理后将stripped output传给model。hints是harness-only side channel，model不感知。

---

## 核心功能

### 1. Hint标签解析

```typescript
type ClaudeCodeHintType = 'plugin' | 'card' | 'progress'

type ClaudeCodeHint = {
  v: number              // Spec version
  type: ClaudeCodeHintType
  value: string          // name@marketplace 或 card-type
  sourceCommand: string  // 第一个token
}

const HINT_TAG_RE = /^[ \t]*<claude-code-hint\s+([^>]*?)\s*\/>[ \t]*$/gm
const ATTR_RE = /(\w+)=(?:"([^"]*)"|([^\s/>]+))/g

export function extractClaudeCodeHints(
  output: string,
  command: string
): { hints: ClaudeCodeHint[]; stripped: string }
```

### 2. Feishu应用

```typescript
// OpenClaw扩展：Feishu卡片协议
type OpenClawHintType = 'card' | 'progress' | 'notification' | 'action'

type OpenClawHint = {
  v: number
  type: OpenClawHintType
  value: string
  sourceCommand: string
}

// 示例：<openclaw-hint type="card" value="progress" v="1" />
// SDK发送后，harness提取并渲染飞书进度卡片
// model看到的output不含hint（纯净）
```

---

## 实现要点

### 1. 标签格式

```
<openclaw-hint type="card" value="progress" v="1" />
<openclaw-hint type="notification" value="success" v="1" />
```

### 2. Strip逻辑

```typescript
// Fast path: 无标签 → 直接返回
if (!output.includes('<openclaw-hint')) {
  return { hints: [], stripped: output }
}

// 提取hints并strip
const stripped = output.replace(HINT_TAG_RE, rawLine => {
  const attrs = parseAttrs(rawLine)
  hints.push({ v, type, value, sourceCommand })
  return ''
})

// Collapse多余空行
const collapsed = stripped.replace(/\n{3,}/g, '\n\n')
```

### 3. Pending Hint Store

```typescript
let pendingHint: OpenClawHint | null = null
let shownThisSession = false

// Single-slot: 只保存一个pending hint
export function setPendingHint(hint: OpenClawHint): void {
  if (shownThisSession) return
  pendingHint = hint
}

export function getPendingHint(): OpenClawHint | null {
  return pendingHint
}

export function markHintShown(): void {
  shownThisSession = true
  pendingHint = null
}
```

---

## Feishu卡片应用

### 1. 进度卡片

```xml
<openclaw-hint type="card" value="progress" v="1" />
```

SDK发送后，harness渲染飞书进度卡片。

### 2. 成功通知

```xml
<openclaw-hint type="notification" value="success" v="1" />
```

### 3. 操作确认

```xml
<openclaw-hint type="action" value="confirm" v="1" />
```

---

## 状态文件

```json
{
  "skill": "cli-hints-protocol",
  "priority": "P29",
  "source": "claudeCodeHints.ts",
  "enabled": true,
  "hintTypes": ["card", "progress", "notification", "action"],
  "supportedVersions": [1],
  "pendingHint": null,
  "shownThisSession": false,
  "createdAt": "2026-04-12T13:00:00Z"
}
```

---

## 参考

- Claude Code: `claudeCodeHints.ts`
- Spec: `docs/claude-code-hints.md`