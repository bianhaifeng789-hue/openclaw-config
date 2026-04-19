# Permission Pipeline Steps Skill

Permission Pipeline Steps - 1a deny rule → 1b ask rule → 1c tool checkPermissions → 1d tool deny → 1e requiresUserInteraction → 1f content ask rules → 1g safetyCheck bypass-immune → 2a mode allow → 2b always-allowed rule → 3 passthrough → ask + dontAsk deny + auto classifier + acceptEdits fast-path + allowlist fast-path + classifier fallback。

## 功能概述

从Claude Code的utils/permissions/permissions.ts提取的Permission pipeline steps，用于OpenClaw的权限检查流程。

## 核心机制

### 1a deny rule

```typescript
// 1a. Entire tool is denied by rule
const denyRule = getDenyRuleForTool(appState.toolPermissionContext, tool)
if (denyRule) {
  return { behavior: 'deny', decisionReason: { type: 'rule', rule: denyRule } }
}
// Step 1a deny rule
# Entire tool denied
# Return immediately
```

### 1b ask rule

```typescript
// 1b. Entire tool should always ask for permission
const askRule = getAskRuleForTool(appState.toolPermissionContext, tool)
if (askRule) {
  // Sandbox auto-allow bypasses ask rule
  const canSandboxAutoAllow = tool.name === BASH_TOOL_NAME && SandboxManager.isSandboxingEnabled() && shouldUseSandbox(input)
  if (!canSandboxAutoAllow) {
    return { behavior: 'ask', decisionReason: { type: 'rule', rule: askRule } }
  }
}
// Step 1b ask rule
# Entire tool ask
# Sandbox can bypass
```

### 1c tool checkPermissions

```typescript
// 1c. Ask the tool implementation for a permission result
let toolPermissionResult: PermissionResult = { behavior: 'passthrough', message: createPermissionRequestMessage(tool.name) }
try {
  const parsedInput = tool.inputSchema.parse(input)
  toolPermissionResult = await tool.checkPermissions(parsedInput, context)
} catch (e) {
  if (e instanceof AbortError || e instanceof APIUserAbortError) throw e
  logError(e)
}
// Step 1c tool checkPermissions
# Tool-specific check
# inputSchema.parse first
# AbortError rethrow
```

### 1d tool deny

```typescript
// 1d. Tool implementation denied permission
if (toolPermissionResult?.behavior === 'deny') {
  return toolPermissionResult
}
// Step 1d tool deny
# Tool says deny
# Return immediately
```

### 1e requiresUserInteraction

```typescript
// 1e. Tool requires user interaction even in bypass mode
if (tool.requiresUserInteraction?.() && toolPermissionResult?.behavior === 'ask') {
  return toolPermissionResult
}
// Step 1e requiresUserInteraction
# Force prompt
# Even in bypass
```

### 1f content ask rules

```typescript
// 1f. Content-specific ask rules from tool.checkPermissions take precedence
// over bypassPermissions mode. When a user explicitly configures a
// content-specific ask rule (e.g. Bash(npm publish:*)), the tool's
// checkPermissions returns {behavior:'ask', decisionReason:{type:'rule', rule:{ruleBehavior:'ask'}}}.
if (toolPermissionResult?.behavior === 'ask' &&
    toolPermissionResult.decisionReason?.type === 'rule' &&
    toolPermissionResult.decisionReason.rule.ruleBehavior === 'ask') {
  return toolPermissionResult
}
// Step 1f content ask rules
# Bash(npm publish:*)
# Precedence over bypass
```

### 1g safetyCheck bypass-immune

```typescript
// 1g. Safety checks (e.g. .git/, .claude/, .vscode/, shell configs) are
// bypass-immune — they must prompt even in bypassPermissions mode.
// checkPathSafetyForAutoEdit returns {type:'safetyCheck'} for these paths.
if (toolPermissionResult?.behavior === 'ask' &&
    toolPermissionResult.decisionReason?.type === 'safetyCheck') {
  return toolPermissionResult
}
// Step 1g safetyCheck bypass-immune
# .git/, .claude/, .vscode/
# Shell configs
# Bypass-immune
```

### 2a mode allow

```typescript
// 2a. Check if mode allows the tool to run
const shouldBypassPermissions =
  appState.toolPermissionContext.mode === 'bypassPermissions' ||
  (appState.toolPermissionContext.mode === 'plan' &&
   appState.toolPermissionContext.isBypassPermissionsModeAvailable)
if (shouldBypassPermissions) {
  return { behavior: 'allow', decisionReason: { type: 'mode', mode: appState.toolPermissionContext.mode } }
}
// Step 2a mode allow
# bypassPermissions mode
# plan + isBypassPermissionsModeAvailable
```

### 2b always-allowed rule

```typescript
// 2b. Entire tool is allowed
const alwaysAllowedRule = toolAlwaysAllowedRule(appState.toolPermissionContext, tool)
if (alwaysAllowedRule) {
  return { behavior: 'allow', decisionReason: { type: 'rule', rule: alwaysAllowedRule } }
}
// Step 2b always-allowed rule
# Tool-wide allow
# Return immediately
```

### 3 passthrough → ask

```typescript
// 3. Convert "passthrough" to "ask"
const result: PermissionDecision =
  toolPermissionResult.behavior === 'passthrough'
    ? { ...toolPermissionResult, behavior: 'ask' as const, message: createPermissionRequestMessage(tool.name, toolPermissionResult.decisionReason) }
    : toolPermissionResult
// Step 3 passthrough → ask
# Default behavior
# Prompt user
```

### dontAsk deny

```typescript
// Apply dontAsk mode transformation: convert 'ask' to 'deny'
if (result.behavior === 'ask') {
  if (appState.toolPermissionContext.mode === 'dontAsk') {
    return { behavior: 'deny', decisionReason: { type: 'mode', mode: 'dontAsk' }, message: DONT_ASK_REJECT_MESSAGE(tool.name) }
  }
}
// dontAsk deny
# 'ask' → 'deny'
# No prompts
```

### auto classifier

```typescript
// Apply auto mode: use AI classifier instead of prompting user
if (feature('TRANSCRIPT_CLASSIFIER') &&
    (appState.toolPermissionContext.mode === 'auto' ||
     (appState.toolPermissionContext.mode === 'plan' && autoModeStateModule?.isAutoModeActive()))) {
  // Run classifier...
}
// auto classifier
# TRANSCRIPT_CLASSIFIER feature
# AI decides
# No prompt
```

### acceptEdits fast-path

```typescript
// Before running the auto mode classifier, check if acceptEdits mode would
// allow this action. This avoids expensive classifier API calls for safe
// operations like file edits in the working directory.
if (result.behavior === 'ask' && tool.name !== AGENT_TOOL_NAME && tool.name !== REPL_TOOL_NAME) {
  const acceptEditsResult = await tool.checkPermissions(parsedInput, {
    ...context,
    getAppState: () => {
      const state = context.getAppState()
      return { ...state, toolPermissionContext: { ...state.toolPermissionContext, mode: 'acceptEdits' as const } }
    },
  })
  if (acceptEditsResult.behavior === 'allow') {
    return { behavior: 'allow', decisionReason: { type: 'mode', mode: 'auto' } }
  }
}
// acceptEdits fast-path
# Skip classifier
# Safe file edits
# AGENT/REPL excluded
```

### allowlist fast-path

```typescript
// Allowlisted tools are safe and don't need YOLO classification.
if (classifierDecisionModule!.isAutoModeAllowlistedTool(tool.name)) {
  return { behavior: 'allow', decisionReason: { type: 'mode', mode: 'auto' } }
}
// allowlist fast-path
# Safe tools
# Skip classifier
# isAutoModeAllowlistedTool
```

### classifier fallback

```typescript
// Run the auto mode classifier
const classifierResult = await classifyYoloAction(messages, action, tools, context, signal)
// classifier fallback
# YOLO classifier
# Final decision
```

## 实现建议

### OpenClaw适配

1. **permissionPipeline**: 17-step pipeline pattern
2. **denyFirst**: 1a-1g deny/ask steps pattern
3. **bypassMode**: 2a-2b bypass mode pattern
4. **passthroughDefault**: 3 passthrough → ask pattern
5. **autoClassifier**: auto mode classifier pattern

### 状态文件示例

```json
{
  "step": "2b",
  "behavior": "allow",
  "decisionReason": {"type": "rule", "rule": "Bash"},
  "mode": "auto"
}
```

## 关键模式

### 17-Step Pipeline Sequence

```
1a → 1b → 1c → 1d → 1e → 1f → 1g → 2a → 2b → 3 → dontAsk → auto → acceptEdits → allowlist → classifier → done
# 17-step pipeline sequence
# 每step独立check
# Return immediately on match
```

### deny/ask First (1a-1g)

```
deny rule → ask rule → checkPermissions → tool deny → requiresUserInteraction → content ask → safetyCheck → deny/ask first
# deny/ask first
# 1a-1g先check deny/ask
# bypass-immune safetyCheck
```

### Bypass Mode (2a-2b)

```
bypassPermissions || plan+isBypass → allow → always-allowed rule → allow → bypass mode
# bypass mode
# 2a-2b bypass checks
# mode allows
```

### Passthrough Default to Ask

```
passthrough → ask → default behavior → prompt user → no rule matched → passthrough default
# passthrough default to ask
# 无rule匹配时prompt
```

### Auto Mode Classifier Chain

```
dontAsk: ask→deny | auto: classifier | acceptEdits fast-path | allowlist fast-path | classifier fallback → auto mode
# auto mode classifier chain
# 多层fast-path
# 最终classifier决定
```

## 借用价值

- ⭐⭐⭐⭐⭐ 17-step pipeline sequence pattern
- ⭐⭐⭐⭐⭐ deny/ask first pattern
- ⭐⭐⭐⭐⭐ bypass mode pattern
- ⭐⭐⭐⭐⭐ passthrough default pattern
- ⭐⭐⭐⭐⭐ auto mode classifier chain pattern

## 来源

- Claude Code: `utils/permissions/permissions.ts` (817 lines)
- 分析报告: P58-1