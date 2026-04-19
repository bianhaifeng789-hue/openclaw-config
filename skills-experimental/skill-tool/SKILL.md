# Skill Tool Skill

Skill执行工具 - Inline + Forked双模式 + Permission safe-properties。

## 功能概述

从Claude Code的SkillTool提取的skill执行模式，用于OpenClaw的技能调用。

## 核心机制

### 双执行模式

```typescript
// Inline模式：prompt注入main session
return {
  data: { success: true, commandName, allowedTools, model },
  newMessages,
  contextModifier(ctx) { ... }
}

// Forked模式：独立sub-agent
await executeForkedSkill(command, commandName, args, context)
// context: 'fork' 触发forked execution
```

### Safe Properties Auto-allow

```typescript
const SAFE_SKILL_PROPERTIES = new Set([
  'type', 'progressMessage', 'contentLength', 'argNames',
  'model', 'effort', 'source', 'pluginInfo', ...
])

function skillHasOnlySafeProperties(command): boolean {
  // Allowlist check - 新属性默认需要permission
}
```

### Permission Rule Matching

```typescript
const ruleMatches = (ruleContent: string): boolean => {
  // Normalize: strip leading slash
  // Exact match
  // Prefix match: rule.endsWith(':*')
}
// skill或skill:*匹配
```

### Forked Agent Execution

```typescript
for await (const message of runAgent({
  agentDefinition,
  promptMessages,
  toolUseContext: { ...context, getAppState: modifiedGetAppState },
  canUseTool,
  model: command.model
})) {
  agentMessages.push(message)
}
// 异步迭代器收集forked agent输出
```

### Remote Skill（Ant-only）

```typescript
if (stripCanonicalPrefix(commandName)) {
  const { content } = await loadRemoteSkill(slug, meta.url)
  // Cache + GCS/AKI backend
  return { data: { success: true }, newMessages: [content] }
}
// _canonical_<slug>格式的远程skill
```

## 实现建议

### OpenClaw适配

1. **dualMode**: inline + forked
2. **safeProperties**: auto-allow allowlist
3. **permission**: rule matching
4. **remote**: Optional remote skill

### 状态文件示例

```json
{
  "commandName": "commit",
  "status": "inline",
  "allowedTools": ["Bash(git:*)"],
  "model": "opus"
}
```

## 关键模式

### Context Modifier Chain

```typescript
contextModifier(ctx) {
  let modified = ctx
  if (allowedTools.length > 0) {
    modified = { ...modified, getAppState: () => ({
      ...prevGetAppState(),
      toolPermissionContext: { ... }
    })}
  }
  if (model) modified = { ...modified, options: { mainLoopModel } }
  return modified
}
// 链式修改，保留previousGetAppState
```

### Safe Properties Allowlist

```
New properties default to requiring permission
// 安全默认值
// 显式allowlist才允许
```

## 借用价值

- ⭐⭐⭐⭐⭐ Dual execution mode
- ⭐⭐⭐⭐⭐ Safe properties auto-allow
- ⭐⭐⭐⭐⭐ Permission rule matching
- ⭐⭐⭐⭐ Context modifier chain
- ⭐⭐⭐⭐ Forked agent execution

## 来源

- Claude Code: `tools/SkillTool/SkillTool.ts` (50KB)
- 分析报告: P38-2