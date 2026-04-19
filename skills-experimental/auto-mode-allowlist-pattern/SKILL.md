# Auto Mode Allowlist Pattern Skill

Auto Mode Allowlist Pattern - SAFE_YOLO_ALLOWLISTED_TOOLS Set + read-only file ops + search tools + task management + plan mode UI + swarm coordination + misc safe + ant-only conditional spread + feature DCE + isAutoModeAllowlistedTool + YOLO_CLASSIFIER_TOOL_NAME。

## 功能概述

从Claude Code的utils/permissions/classifierDecision.ts提取的Auto mode allowlist模式，用于OpenClaw的auto mode安全工具列表。

## 核心机制

### SAFE_YOLO_ALLOWLISTED_TOOLS Set

```typescript
const SAFE_YOLO_ALLOWLISTED_TOOLS = new Set([
  FILE_READ_TOOL_NAME,
  GREP_TOOL_NAME,
  GLOB_TOOL_NAME,
  // ... 30+ tools
])
// SAFE_YOLO_ALLOWLISTED_TOOLS
# Set of tool names
# Skip classifier
# Safe operations
```

### read-only file ops

```typescript
// Read-only file operations
FILE_READ_TOOL_NAME,
// Read-only file ops
# No write/edit
# Safe to auto-allow
```

### search tools

```typescript
// Search / read-only
GREP_TOOL_NAME,
GLOB_TOOL_NAME,
LSP_TOOL_NAME,
TOOL_SEARCH_TOOL_NAME,
LIST_MCP_RESOURCES_TOOL_NAME,
'ReadMcpResourceTool',
// Search tools
# Grep, Glob, LSP
# Read-only search
# Safe operations
```

### task management

```typescript
// Task management (metadata only)
TODO_WRITE_TOOL_NAME,
TASK_CREATE_TOOL_NAME,
TASK_GET_TOOL_NAME,
TASK_UPDATE_TOOL_NAME,
TASK_LIST_TOOL_NAME,
TASK_STOP_TOOL_NAME,
TASK_OUTPUT_TOOL_NAME,
// Task management
# Metadata only
# No file writes
# Safe operations
```

### plan mode UI

```typescript
// Plan mode / UI
ASK_USER_QUESTION_TOOL_NAME,
ENTER_PLAN_MODE_TOOL_NAME,
EXIT_PLAN_MODE_TOOL_NAME,
// Plan mode UI
# Ask user
# Enter/exit plan
# Safe UI tools
```

### swarm coordination

```typescript
// Swarm coordination (internal mailbox/team state only — teammates have
// their own permission checks, so no actual security bypass).
TEAM_CREATE_TOOL_NAME,
TEAM_DELETE_TOOL_NAME,
SEND_MESSAGE_TOOL_NAME,
// Swarm coordination
# Internal state
# No security bypass
# Teammates have own checks
```

### misc safe

```typescript
// Misc safe
SLEEP_TOOL_NAME,
// Misc safe
# Sleep is safe
# No side effects
```

### ant-only conditional spread

```typescript
// Ant-only safe tools (gates mirror tools.ts)
...(TERMINAL_CAPTURE_TOOL_NAME ? [TERMINAL_CAPTURE_TOOL_NAME] : []),
...(OVERFLOW_TEST_TOOL_NAME ? [OVERFLOW_TEST_TOOL_NAME] : []),
...(VERIFY_PLAN_EXECUTION_TOOL_NAME ? [VERIFY_PLAN_EXECUTION_TOOL_NAME] : []),
// Ant-only conditional spread
# feature flags
# DCE in external builds
# Conditional require
```

### feature DCE

```typescript
const TERMINAL_CAPTURE_TOOL_NAME = feature('TERMINAL_PANEL')
  ? (require('../../tools/TerminalCaptureTool/prompt.js')).TERMINAL_CAPTURE_TOOL_NAME
  : null
// feature DCE
# feature('TERMINAL_PANEL')
# conditional require
# null in external builds
```

### isAutoModeAllowlistedTool

```typescript
export function isAutoModeAllowlistedTool(toolName: string): boolean {
  return SAFE_YOLO_ALLOWLISTED_TOOLS.has(toolName)
}
// isAutoModeAllowlistedTool
# Set.has() check
# Skip classifier
# Fast path
```

### YOLO_CLASSIFIER_TOOL_NAME

```typescript
// Internal classifier tool
YOLO_CLASSIFIER_TOOL_NAME,
// YOLO_CLASSIFIER_TOOL_NAME
# Internal tool
# classify_result
# Safe by definition
```

## 实现建议

### OpenClaw适配

1. **allowlistSet**: SAFE_YOLO_ALLOWLISTED_TOOLS Set pattern
2. **conditionalSpread**: ...(toolName ? [toolName] : []) pattern
3. **featureDCE**: feature() ? require() : null pattern
4. **isAllowlisted**: Set.has() check pattern
5. **safeCategories**: read-only/search/task/plan/swarm/misc pattern

### 状态文件示例

```json
{
  "allowlistedTools": ["FileRead", "Grep", "Glob", "TaskList"],
  "count": 30,
  "toolName": "FileRead",
  "isAllowlisted": true
}
```

## 关键模式

### Set of Safe Tool Names

```
new Set([FILE_READ_TOOL_NAME, GREP_TOOL_NAME, ...]) → safe tools → skip classifier → fast path
# Set of safe tool names
# 30+ tools
# skip classifier
# fast path
```

### Conditional Spread Ant-Only

```
...(TERMINAL_CAPTURE_TOOL_NAME ? [TERMINAL_CAPTURE_TOOL_NAME] : []) → conditional spread → ant-only → DCE in external
# conditional spread ant-only
# ...(toolName ? [toolName] : [])
# DCE in external builds
```

### feature() Conditional Require

```
feature('TERMINAL_PANEL') ? require('./prompt.js').TOOL_NAME : null → feature DCE → null in external → ant-only
# feature() conditional require
# feature flag
# null in external builds
```

### Set.has() Fast Path Check

```
SAFE_YOLO_ALLOWLISTED_TOOLS.has(toolName) → isAutoModeAllowlistedTool → skip classifier → fast path → safe
# Set.has() fast path check
# O(1) lookup
# skip classifier
```

### Categories: Read/Search/Task/Plan/Swarm/Misc

```
read-only file ops + search tools + task management + plan mode UI + swarm coordination + misc safe → 6 categories → safe tools → allowlist
# categories: read/search/task/plan/swarm/misc
# 6 categories
# safe tools
```

## 借用价值

- ⭐⭐⭐⭐⭐ Set of safe tool names pattern
- ⭐⭐⭐⭐⭐ Conditional spread ant-only pattern
- ⭐⭐⭐⭐⭐ feature() conditional require pattern
- ⭐⭐⭐⭐⭐ Set.has() fast path check pattern
- ⭐⭐⭐⭐ Categories: read/search/task/plan/swarm/misc pattern

## 来源

- Claude Code: `utils/permissions/classifierDecision.ts` (83 lines)
- 分析报告: P59-2