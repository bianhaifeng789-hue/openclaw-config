---
name: system-prompt-builder
description: "System prompt builder with priority cascade. buildEffectiveSystemPrompt + Priority: override → coordinator → agent → custom → default + Proactive mode: agent appended + appendSystemPrompt always added. Use when [system prompt builder] is needed."
metadata:
  openclaw:
    emoji: "💬"
    triggers: [prompt-build, system-prompt]
    feishuCard: true
---

# System Prompt Builder Skill - System Prompt Builder

System Prompt Builder 系统提示构建器。

## 为什么需要这个？

**场景**：
- Build system prompt
- Priority cascade
- Override support
- Agent prompt
- Append prompt

**Claude Code 方案**：systemPrompt.ts + 100+ lines
**OpenClaw 飞书适配**：System prompt builder + Priority cascade

---

## Priority Cascade

```
0. Override system prompt (if set, REPLACES all)
1. Coordinator system prompt (if coordinator mode)
2. Agent system prompt (if mainThreadAgentDefinition)
   - Proactive mode: agent APPENDED to default
   - Otherwise: agent REPLACES default
3. Custom system prompt (if --system-prompt)
4. Default system prompt

Plus: appendSystemPrompt always added (except override)
```

---

## Functions

### Build Effective System Prompt

```typescript
function buildEffectiveSystemPrompt({
  mainThreadAgentDefinition,
  toolUseContext,
  customSystemPrompt,
  defaultSystemPrompt,
  appendSystemPrompt,
  overrideSystemPrompt,
}): SystemPrompt {
  // 0. Override (if set, replaces all)
  if (overrideSystemPrompt) {
    return asSystemPrompt([overrideSystemPrompt])
  }

  // 1. Coordinator mode
  if (coordinatorMode) {
    return asSystemPrompt([
      getCoordinatorSystemPrompt(),
      ...(appendSystemPrompt ? [appendSystemPrompt] : []),
    ])
  }

  // 2. Agent prompt
  const agentSystemPrompt = mainThreadAgentDefinition?.getSystemPrompt()

  // Proactive mode: agent appended
  if (agentSystemPrompt && proactiveMode) {
    return asSystemPrompt([
      ...defaultSystemPrompt,
      `\n# Custom Agent Instructions\n${agentSystemPrompt}`,
      ...(appendSystemPrompt ? [appendSystemPrompt] : []),
    ])
  }

  // 3-4. Custom or default
  return asSystemPrompt([
    ...(agentSystemPrompt
      ? [agentSystemPrompt]
      : customSystemPrompt
        ? [customSystemPrompt]
        : defaultSystemPrompt),
    ...(appendSystemPrompt ? [appendSystemPrompt] : []),
  ])
}
```

---

## 飞书卡片格式

### System Prompt Builder 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**💬 System Prompt Builder**\n\n---\n\n**Priority Cascade**：\n```\n0. Override (REPLACES all)\n1. Coordinator mode\n2. Agent prompt\n   - Proactive: APPENDED\n   - Normal: REPLACES\n3. Custom prompt\n4. Default prompt\n\n+ appendSystemPrompt\n```\n\n---\n\n**buildEffectiveSystemPrompt()**：\n• Returns SystemPrompt"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/system-prompt-builder-state.json
{
  "stats": {
    "totalBuilds": 0,
    "overrideUsed": 0,
    "agentUsed": 0,
    "customUsed": 0
  },
  "lastUpdate": "2026-04-12T10:32:00Z",
  "notes": "System Prompt Builder Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| systemPrompt.ts (100+ lines) | Skill + Prompt |
| buildEffectiveSystemPrompt() | Build prompt |
| Priority cascade | 5 levels |
| Proactive mode | Agent appended |

---

## 注意事项

1. **Override replaces** - All other prompts ignored
2. **Proactive mode** - Agent appended (not replaced)
3. **Append always** - Added at end (except override)
4. **Coordinator** - Coordinator prompt if mode active
5. **Agent memory** - Logged for analytics

---

## 自动启用

此 Skill 在 prompt build 时自动运行。

---

## 下一步增强

- 飞书 prompt 集成
- Prompt analytics
- Prompt debugging