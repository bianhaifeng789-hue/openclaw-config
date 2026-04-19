# Branded IDs Skill

品牌化ID类型 - Branded type + Compile-time safety + Pattern validation + Cast functions。

## 功能概述

从Claude Code的Branded ID系统提取的类型安全模式，用于OpenClaw的ID管理。

## 核心机制

### Branded Type Pattern

```typescript
export type SessionId = string & { readonly __brand: 'SessionId' }
export type AgentId = string & { readonly __brand: 'AgentId' }
// Nominal typing via brand
// Compile-time safety
// 防止ID混用
```

### Cast Functions

```typescript
export function asSessionId(id: string): SessionId {
  return id as SessionId
}
export function asAgentId(id: string): AgentId {
  return id as AgentId
}
// Use sparingly
// Prefer getSessionId()/createAgentId()
```

### Pattern Validation

```typescript
const AGENT_ID_PATTERN = /^a(?:.+-)?[0-9a-f]{16}$/
export function toAgentId(s: string): AgentId | null {
  return AGENT_ID_PATTERN.test(s) ? (s as AgentId) : null
}
// a + optional label- + 16 hex chars
// null if doesn't match
```

### Discriminator Usage

```typescript
// AgentId presence indicates subagent context (not main session)
// When present, indicates the context is a subagent
// Compile-time type narrowing
```

## 实现建议

### OpenClaw适配

1. **brandedType**: Branded type pattern
2. **castFunctions**: Cast functions
3. **patternValidation**: Pattern validation
4. **compileTimeSafety**: Compile-time safety

### 状态文件示例

```json
{
  "sessionId": "sess-123",
  "agentId": "a-researcher-abc123def456",
  "branded": true,
  "patternValid": true
}
```

## 关键模式

### Nominal Typing via Brand

```
string & { readonly __brand: 'SessionId' }
// 编译时区分
// 不混淆不同ID类型
```

### Pattern-based Validation

```
toAgentId(s) → AgentId | null
// 验证格式
// 返回null而不是throw
```

### Cast Sparingly

```
asAgentId(id) → prefer createAgentId()
// 少用cast
// 优先用factory
```

## 借用价值

- ⭐⭐⭐⭐⭐ Branded type pattern
- ⭐⭐⭐⭐ Pattern validation (return null)
- ⭐⭐⭐⭐ Cast sparingly principle

## 来源

- Claude Code: `types/ids.ts`
- 分析报告: P39-2