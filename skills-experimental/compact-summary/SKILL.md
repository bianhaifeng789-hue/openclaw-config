# Compact Summary Skill

Compact Summary - summarizeMetadata + direction (up_to/from_this_point) + userContext + BLACK_CIRCLE indicator。

## 功能概述

从Claude Code的CompactSummary提取的压缩摘要模式，用于OpenClaw的会话压缩显示。

## 核心机制

### summarizeMetadata

```typescript
const metadata = message.summarizeMetadata

if (metadata) {
  return (
    <Box>
      <Text>{BLACK_CIRCLE}</Text>
      <Text bold>Summarized conversation</Text>
      <Text dimColor>Summarized {metadata.messagesSummarized} messages {metadata.direction === "up_to" ? "up to this point" : "from this point"}</Text>
      {metadata.userContext && <Text dimColor>Context: "{metadata.userContext}"</Text>}
    </Box>
  )
}
// metadata attached to user message
// messagesSummarized count
// direction: up_to or from_this_point
// userContext: compression context
```

### Direction Enum

```typescript
metadata.direction === "up_to" ? "up to this point" : "from this point"
// up_to: summarized older messages
// from_this_point: summarized newer messages
// Direction display text
```

### UserContext Field

```typescript
{metadata.userContext && <Text dimColor>Context: "{metadata.userContext}"</Text>}
// Optional user context
// Why compression happened
// Display in quotes
```

### BLACK_CIRCLE Indicator

```typescript
import { BLACK_CIRCLE } from '../constants/figures.js'

<Box minWidth={2}><Text color="text">{BLACK_CIRCLE}</Text></Box>
// Visual indicator for summarized message
// ● BLACK_CIRCLE character
// Fixed width
```

### Transcript Mode Toggle

```typescript
const isTranscriptMode = screen === "transcript"

!isTranscriptMode && <MessageResponse>...</MessageResponse>
isTranscriptMode && <MessageResponse><Text>{textContent}</Text></MessageResponse>

<ConfigurableShortcutHint action="app:toggleTranscript" context="Global" fallback="ctrl+o" description="expand history" />
// Non-transcript: show summary
// Transcript mode: show original text
// ctrl+o toggle hint
```

### ConfigurableShortcutHint

```typescript
<ConfigurableShortcutHint action="app:toggleTranscript" context="Global" fallback="ctrl+o" description="expand history" parens={true} />
// action: keybinding action name
// context: keybinding context
// fallback: default shortcut
// description: hint text
// parens: wrap in parentheses
```

## 实现建议

### OpenClaw适配

1. **summarizeMetadata**: 压缩元数据
2. **directionEnum**: Direction枚举
3. **userContext**: 用户上下文
4. **indicator**: BLACK_CIRCLE指示器

### 状态文件示例

```json
{
  "messagesSummarized": 50,
  "direction": "up_to",
  "userContext": "working on authentication",
  "indicator": "●"
}
```

## 关键模式

### Metadata Attachment

```
message.summarizeMetadata → attached to user message → isMeta placeholder
// 元数据附加到user message
// <collapsed> placeholders不显示
```

### Direction Display

```
up_to → "up to this point", from_this_point → "from this point"
// 方向决定显示文本
// 描述压缩范围
```

### Context Field

```
metadata.userContext → "Context: "...""
// 压缩原因/上下文
// 可选字段
```

### Transcript Toggle

```
screen === "transcript" → show original, else → show summary
// transcript模式显示原文
// 非transcript显示摘要
```

## 借用价值

- ⭐⭐⭐⭐⭐ summarizeMetadata pattern
- ⭐⭐⭐⭐⭐ direction (up_to/from_this_point)
- ⭐⭐⭐⭐⭐ userContext field
- ⭐⭐⭐⭐ ConfigurableShortcutHint
- ⭐⭐⭐⭐ BLACK_CIRCLE indicator

## 来源

- Claude Code: `components/CompactSummary.tsx`
- 分析报告: P41-3