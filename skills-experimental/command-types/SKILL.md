# Command Types Skill

命令类型系统 - Discriminated command kind + Availability array + Lazy load module + Immediate bypass queue。

## 功能概述

从Claude Code的Command Types提取的命令类型模式，用于OpenClaw的命令系统。

## 核心机制

### Discriminated Command Kind

```typescript
type LocalCommand = { type: 'local', load: () => Promise<LocalCommandModule> }
type LocalJSXCommand = { type: 'local-jsx', load: () => Promise<LocalJSXCommandModule> }
type PromptCommand = { type: 'prompt', getPromptForCommand(...), source, context, agent }

export type Command = CommandBase & (PromptCommand | LocalCommand | LocalJSXCommand)
// type作为discriminator
// 不同command类型
```

### Availability Array

```typescript
export type CommandAvailability = 'claude-ai' | 'console'

export type CommandBase = {
  availability?: CommandAvailability[]
  // Only shown if user matches at least one
  // availability = who can use (auth requirement)
  // isEnabled = is turned on right now (GB, env)
}
// 静态auth requirement
// 与isEnabled分离
```

### Lazy Load Module

```typescript
type LocalCommand = {
  type: 'local'
  load: () => Promise<LocalCommandModule>  // Defer heavy dependencies
}
type LocalJSXCommand = {
  type: 'local-jsx'
  load: () => Promise<LocalJSXCommandModule>
}
// Lazy load until invoked
// 避免启动时加载所有依赖
```

### Immediate Bypass Queue

```typescript
export type CommandBase = {
  immediate?: boolean  // If true, executes immediately without waiting for stop point
  // Bypasses queue
}
// 不等待stop point
// 立即执行
```

### PromptCommand Context

```typescript
export type PromptCommand = {
  context?: 'inline' | 'fork'
  agent?: string  // Agent type when forked
  paths?: string[]  // Glob patterns for file matching
  hooks?: HooksSettings  // Hooks to register
  skillRoot?: string  // Base directory for skill hooks
}
// inline → expands to current conversation
// fork → runs as sub-agent
```

### User Invocable

```typescript
export type CommandBase = {
  userInvocable?: boolean  // Whether users can invoke by typing /skill-name
  disableModelInvocation?: boolean  // Disable model invocation
}
// 用户可调用 vs model可调用
// 分离控制
```

### Sensitive Redaction

```typescript
export type CommandBase = {
  isSensitive?: boolean  // If true, args redacted from conversation history
}
// 敏感命令 → args隐藏
// 保护隐私
```

### Kind Workflow Badge

```typescript
export type CommandBase = {
  kind?: 'workflow'  // Distinguishes workflow-backed commands
  // Badged in autocomplete
}
// workflow标记
// UI badge
```

### Command Result Display

```typescript
export type CommandResultDisplay = 'skip' | 'system' | 'user'
export type LocalJSXCommandOnDone = (
  result?: string,
  options?: { display?: CommandResultDisplay, shouldQuery?: boolean }
)
// skip → 不显示
// system → system message
// user → user message
```

## 实现建议

### OpenClaw适配

1. **discriminatedKind**: Discriminated command kind
2. **availabilityArray**: Availability array
3. **lazyLoad**: Lazy load module
4. **immediateBypass**: Immediate bypass queue

### 状态文件示例

```json
{
  "type": "prompt",
  "context": "fork",
  "agent": "Bash",
  "availability": ["claude-ai", "console"],
  "immediate": false
}
```

## 关键模式

### Discriminated Command Type

```
type: 'local' | 'local-jsx' | 'prompt' → unique shape
// 不同command类型
// 编译时区分
```

### Availability vs isEnabled

```
availability = auth requirement (static)
isEnabled = turned on (dynamic)
// 分离静态vs动态
// 不同gate层级
```

### Lazy Load Pattern

```
load: () => Promise<Module>
// 启动时不加载
// 按需加载依赖
```

### Immediate Bypass

```
immediate: true → bypass queue → immediate execution
// 不等待stop point
// 优先执行
```

### Inline vs Fork Context

```
context: 'inline' → expands to conversation
context: 'fork' → runs as sub-agent
// 执行模式选择
```

## 借用价值

- ⭐⭐⭐⭐⭐ Discriminated command kind
- ⭐⭐⭐⭐⭐ Availability vs isEnabled separation
- ⭐⭐⭐⭐⭐ Lazy load module
- ⭐⭐⭐⭐ Immediate bypass queue
- ⭐⭐⭐⭐ Inline vs fork context

## 来源

- Claude Code: `types/command.ts`
- 分析报告: P39-5