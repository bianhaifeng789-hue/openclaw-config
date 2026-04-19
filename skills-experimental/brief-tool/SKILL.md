# Brief Tool Skill

消息发送工具 - Entitlement check + Activation gate + GB kill-switch + Optional field evolution。

## 功能概述

从Claude Code的BriefTool提取的用户消息发送模式，用于OpenClaw的可见输出通道。

## 核心机制

### Entitlement Check (是否允许使用)

```typescript
export function isBriefEntitled(): boolean {
  return feature('KAIROS') || feature('KAIROS_BRIEF')
    ? getKairosActive() || isEnvTruthy(process.env.CLAUDE_CODE_BRIEF) ||
      getFeatureValue_CACHED_WITH_REFRESH('tengu_kairos_brief', false, KAIROS_BRIEF_REFRESH_MS)
    : false
}
// Build-time feature OR-gated
// Runtime GB gate + env bypass
// 决定opt-in是否被honored
```

### Activation Gate (是否实际启用)

```typescript
export function isBriefEnabled(): boolean {
  return feature('KAIROS') || feature('KAIROS_BRIEF')
    ? (getKairosActive() || getUserMsgOptIn()) && isBriefEntitled()
    : false
}
// opt-in + entitlement
// GB作为kill-switch (5分钟refresh)
// 即使opted-in也会在GB off时disable
```

### GB Kill-Switch

```typescript
const KAIROS_BRIEF_REFRESH_MS = 5 * 60 * 1000
getFeatureValue_CACHED_WITH_REFRESH('tengu_kairos_brief', false, KAIROS_BRIEF_REFRESH_MS)
// 5分钟refresh
// flip GB → mid-session disable
// Kill-switch pattern
```

### Optional Field Evolution

```typescript
// attachments MUST remain optional — resumed sessions replay pre-attachment outputs verbatim
attachments: z.array(...).optional().describe('...')
// 新field → optional
// compat旧transcripts
```

### Status Enum

```typescript
status: z.enum(['normal', 'proactive'])
// 'proactive' → surfacing something user hasn't asked for
// task completion while away, blocker, unsolicited update
// 'normal' → replying to user's message
```

### Attachment Validation

```typescript
async validateInput({ attachments }, _context): Promise<ValidationResult> {
  if (!attachments || attachments.length === 0) return { result: true }
  return validateAttachmentPaths(attachments)
}
// attachments → path validation
// 防止无效路径
```

### Alias Compatibility

```typescript
aliases: [LEGACY_BRIEF_TOOL_NAME]
// SendUserMessage → Brief别名
// SDK平滑迁移
```

## 实现建议

### OpenClaw适配

1. **entitlementCheck**: Entitlement检查
2. **activationGate**: Activation gate
3. **gbKillSwitch**: GB kill-switch
4. **statusEnum**: Status enum

### 状态文件示例

```json
{
  "entitled": true,
  "optedIn": true,
  "gbEnabled": true,
  "status": "proactive",
  "attachmentCount": 2
}
```

## 关键模式

### Entitlement vs Activation

```
isBriefEntitled() → can use (GB + env)
isBriefEnabled() → is active (opt-in + entitlement)
// 两个level
// Entitlement决定能否opt-in
// Activation决定实际启用
```

### GB Kill-Switch

```
GB flip off → 5分钟内tool disabled (即使opted-in)
// 运行时control
// 不需要restart
```

### Status Proactive

```
proactive → unsolicited update
normal → direct response
// 区分主动vs被动
```

### Alias Pattern

```
aliases: ['SendUserMessage'] → backward compat
// SDK平滑迁移
```

## 借用价值

- ⭐⭐⭐⭐⭐ Entitlement vs Activation separation
- ⭐⭐⭐⭐⭐ GB kill-switch pattern
- ⭐⭐⭐⭐ Status proactive/normal
- ⭐⭐⭐⭐ Alias compatibility

## 来源

- Claude Code: `tools/BriefTool/BriefTool.ts` (8KB+)
- 分析报告: P38-31