# Commands Registry Pattern Skill

Commands Registry Pattern - getCommands + filterCommandsForRemoteMode + Dead code elimination imports + memoize + Command type + Non-interactive variants。

## 功能概述

从Claude Code的commands.ts提取的命令注册模式，用于OpenClaw的命令系统。

## 核心机制

### getCommands

```typescript
export function getCommands(): Command[] {
  return [
    addDir,
    autofixPr,
    backfillSessions,
    btw,
    goodClaude,
    issue,
    feedback,
    clear,
    color,
    commit,
    copy,
    desktop,
    commitPushPr,
    compact,
    config,
    context,
    cost,
    diff,
    ctx_viz,
    doctor,
    memory,
    help,
    ide,
    init,
    initVerifiers,
    keybindings,
    login,
    logout,
    // ... 50+ commands
  ].filter(Boolean)  // Filter null imports (feature-gated)
}
// Array of all commands
// filter(Boolean) removes nulls
// Feature-gated commands
```

### Dead Code Elimination Imports

```typescript
/* eslint-disable @typescript-eslint/no-require-imports */
const proactive =
  feature('PROACTIVE') || feature('KAIROS')
    ? require('./commands/proactive.js').default
    : null

const briefCommand =
  feature('KAIROS') || feature('KAIROS_BRIEF')
    ? require('./commands/brief.js').default
    : null

const assistantCommand = feature('KAIROS')
  ? require('./commands/assistant/index.js').default
  : null

const voiceCommand = feature('VOICE_MODE')
  ? require('./commands/voice/index.js').default
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
// Conditional require based on feature flags
// null fallback for disabled features
// Bun compiler eliminates dead branches
```

### filterCommandsForRemoteMode

```typescript
export function filterCommandsForRemoteMode(
  commands: Command[],
  isRemote: boolean,
): Command[] {
  if (!isRemote) return commands
  // Filter out commands not available in remote mode
  return commands.filter(cmd => cmd.isAvailableInRemoteMode !== false)
}
// Remote mode command filtering
// isAvailableInRemoteMode flag
```

### Command Type

```typescript
type Command = {
  type: 'prompt' | 'action' | 'interactive'
  name: string
  description: string
  aliases?: string[]
  hasUserSpecifiedDescription?: boolean
  isAvailableInRemoteMode?: boolean
  // ... more fields
}
// Command type definition
// type: prompt/action/interactive
// Remote mode availability
```

### Non-Interactive Variants

```typescript
import { context, contextNonInteractive } from './commands/context/index.js'

// Some commands have non-interactive variants for scripts
// contextNonInteractive: for headless execution
```

### memoize Pattern

```typescript
import memoize from 'lodash-es/memoize.js'

// Commands can be memoized for performance
// Avoid repeated command building
```

### Conditional User-Type Imports

```typescript
const agentsPlatform =
  process.env.USER_TYPE === 'ant'
    ? require('./commands/agents-platform/index.js').default
    : null
// User-type conditional import
// Ant-only commands
```

## 实现建议

### OpenClaw适配

1. **commandsRegistry**: getCommands pattern
2. **deadCodeElim**: Feature-gated imports
3. **remoteModeFilter**: filterCommandsForRemoteMode
4. **commandType**: Command type definition
5. **nonInteractive**: Non-interactive variants

### 状态文件示例

```json
{
  "commandCount": 50,
  "remoteMode": false,
  "featureCommands": ["proactive", "brief", "voice"]
}
```

## 关键模式

### filter(Boolean) Null Removal

```
[cmd1, cmd2, null, cmd3].filter(Boolean) → remove null imports
// filter(Boolean)移除null
// Feature-gated imports返回null
```

### Feature OR Logic

```
feature('PROACTIVE') || feature('KAIROS') → require → OR pattern
// 多feature OR逻辑
// 任一启用即import
```

### Remote Mode Filter

```
isAvailableInRemoteMode !== false → include in remote mode
// isAvailableInRemoteMode flag
// false excluded from remote
```

### User-Type Conditional

```
process.env.USER_TYPE === 'ant' → ant-only commands
// 环境变量判断用户类型
// ant专用commands
```

## 借用价值

- ⭐⭐⭐⭐⭐ Dead code elimination imports pattern
- ⭐⭐⭐⭐⭐ filter(Boolean) null removal
- ⭐⭐⭐⭐⭐ filterCommandsForRemoteMode
- ⭐⭐⭐⭐ Command type definition
- ⭐⭐⭐⭐ Feature OR logic pattern

## 来源

- Claude Code: `commands.ts` (700+ lines)
- 分析报告: P47-3