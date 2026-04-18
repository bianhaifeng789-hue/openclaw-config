# Status Line Command Skill

Status Line Command - buildStatusLineCommandInput + statusLineShouldDisplay + Model/Cost/Context + Rate Limits + Vim Mode。

## 功能概述

从Claude Code的StatusLine.tsx提取的状态栏模式，用于OpenClaw的状态展示。

## 核心机制

### buildStatusLineCommandInput

```typescript
function buildStatusLineCommandInput(
  permissionMode: PermissionMode,
  exceeds200kTokens: boolean,
  settings: ReadonlySettings,
  messages: Message[],
  addedDirs: string[],
  mainLoopModel: ModelName,
  vimMode?: VimMode
): StatusLineCommandInput {
  const runtimeModel = getRuntimeMainLoopModel({ permissionMode, mainLoopModel, exceeds200kTokens })
  const currentUsage = getCurrentUsage(messages)
  const contextWindowSize = getContextWindowForModel(runtimeModel, getSdkBetas())
  const contextPercentages = calculateContextPercentages(currentUsage, contextWindowSize)
  
  return {
    ...createBaseHookInput(),
    model: { id: runtimeModel, display_name: renderModelName(runtimeModel) },
    workspace: { current_dir: getCwd(), project_dir: getOriginalCwd(), added_dirs: addedDirs },
    cost: { total_cost_usd: getTotalCost(), total_duration_ms: getTotalDuration() },
    context_window: { used_percentage, remaining_percentage },
    rate_limits: { five_hour, seven_day },
    permission_mode: permissionMode,
    output_style: { name: outputStyleName },
    vim_mode: vimMode
  }
}
// Comprehensive status input builder
// Model + Workspace + Cost + Context + Rate Limits + Permission + Vim
```

### statusLineShouldDisplay

```typescript
export function statusLineShouldDisplay(settings: ReadonlySettings): boolean {
  // Assistant mode: statusline fields reflect REPL/daemon process, not agent child
  if (feature('KAIROS') && getKairosActive()) return false
  return settings?.statusLine !== undefined
}
// Hide in assistant mode (agent child)
// Check settings.statusLine defined
```

### Rate Limits Structure

```typescript
const rawUtil = getRawUtilization()
const rateLimits: StatusLineCommandInput['rate_limits'] = {
  ...(rawUtil.five_hour && {
    five_hour: {
      used_percentage: rawUtil.five_hour.utilization * 100,
      resets_at: rawUtil.five_hour.resets_at
    }
  }),
  ...(rawUtil.seven_day && {
    seven_day: {
      used_percentage: rawUtil.seven_day.utilization * 100,
      resets_at: rawUtil.seven_day.resets_at
    }
  })
}
// Optional five_hour + seven_day
// used_percentage + resets_at
// Conditional spreading
```

### Context Window Fields

```typescript
context_window: {
  total_input_tokens: getTotalInputTokens(),
  total_output_tokens: getTotalOutputTokens(),
  context_window_size: contextWindowSize,
  current_usage: currentUsage,
  used_percentage: contextPercentages.used,
  remaining_percentage: contextPercentages.remaining
}
// Complete context window stats
// Input + Output + Size + Usage + Percentages
```

### Cost Fields

```typescript
cost: {
  total_cost_usd: getTotalCost(),
  total_duration_ms: getTotalDuration(),
  total_api_duration_ms: getTotalAPIDuration(),
  total_lines_added: getTotalLinesAdded(),
  total_lines_removed: getTotalLinesRemoved()
}
// Total cost + duration + API duration + lines
```

### Session Name

```typescript
const sessionId = getSessionId()
const sessionName = getCurrentSessionTitle(sessionId)
...(sessionName && { session_name: sessionName })
// Optional session name
// Conditional spreading
```

## 实现建议

### OpenClaw适配

1. **statusLineInput**: buildStatusLineCommandInput
2. **shouldDisplay**: statusLineShouldDisplay
3. **rateLimits**: Rate limits结构
4. **contextWindow**: Context window fields

### 状态文件示例

```json
{
  "model": "claude-3-opus",
  "workspace": "/Users/mac/project",
  "cost_usd": 0.05,
  "context_used": 45,
  "context_remaining": 55
}
```

## 关键模式

### Comprehensive Status Builder

```
buildStatusLineCommandInput → model + workspace + cost + context + rate_limits + permission + vim
// 一次性构建完整状态
// 所有字段集中
```

### Conditional Spreading

```
...(rawUtil.five_hour && { five_hour: {...} })
// Optional fields with spreading
// Avoid undefined values
```

### Assistant Mode Hide

```
feature('KAIROS') && getKairosActive() → return false
// Assistant模式隐藏
// REPL/daemon显示，agent child不显示
```

### Runtime Model

```
getRuntimeMainLoopModel({ permissionMode, mainLoopModel, exceeds200kTokens }) → actual model
// Runtime model selection
// Based on permission + main loop + token count
```

## 借用价值

- ⭐⭐⭐⭐⭐ buildStatusLineCommandInput pattern
- ⭐⭐⭐⭐⭐ statusLineShouldDisplay gate
- ⭐⭐⭐⭐⭐ Rate limits structure (five_hour + seven_day)
- ⭐⭐⭐⭐⭐ Context window comprehensive fields
- ⭐⭐⭐⭐ Cost fields pattern

## 来源

- Claude Code: `components/StatusLine.tsx`
- 分析报告: P42-2