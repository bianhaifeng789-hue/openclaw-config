# Bootstrap State Skill

Bootstrap State - 全局状态单例 + 1758行 + DO NOT ADD MORE STATE原则 + createSignal信号 + Counter类型 + platform detection。

## 功能概述

从Claude Code的bootstrap/state.ts提取的全局状态管理模式，用于OpenClaw的核心状态管理。

## 核心机制

### DO NOT ADD MORE STATE原则

```typescript
// DO NOT ADD MORE STATE HERE - BE JUDICIOUS WITH GLOBAL STATE
// 1758 lines of state definitions
// Strict discipline on additions
// Global state is expensive
```

### State Type Definition

```typescript
type State = {
  originalCwd: string
  projectRoot: string           // Stable - set once at startup
  totalCostUSD: number
  totalAPIDuration: number
  totalAPIDurationWithoutRetries: number
  totalToolDuration: number
  turnHookDurationMs: number
  turnToolDurationMs: number
  turnClassifierDurationMs: number
  turnToolCount: number
  turnHookCount: number
  turnClassifierCount: number
  startTime: number
  lastInteractionTime: number
  totalLinesAdded: number
  totalLinesRemoved: number
  hasUnknownModelCost: boolean
  cwd: string
  modelUsage: { [modelName: string]: ModelUsage }
  mainLoopModelOverride: ModelSetting | undefined
  initialMainLoopModel: ModelSetting
  modelStrings: ModelStrings | null
  isInteractive: boolean
  kairosActive: boolean
  strictToolResultPairing: boolean
  sdkAgentProgressSummariesEnabled: boolean
  userMsgOptIn: boolean
  clientType: string
  sessionSource: string | undefined
  questionPreviewFormat: 'markdown' | 'html' | undefined
  flagSettingsPath: string | undefined
  flagSettingsInline: Record<string, unknown> | null
  allowedSettingSources: SettingSource[]
  sessionIngressToken: string | null | undefined
  oauthTokenFromFd: string | null | undefined
  apiKeyFromFd: string | null | undefined
  // Telemetry state
  meter: Meter | null
  sessionCounter: AttributedCounter | null
  locCounter: AttributedCounter | null
  prCounter: AttributedCounter | null
  commitCounter: AttributedCounter | null
  costCounter: AttributedCounter | null
  tokenCounter: AttributedCounter | null
  codeEditToolDecisionCounter: AttributedCounter | null
  activeTimeCounter: AttributedCounter | null
  statsStore: { observe(name: string, value: number): void } | null
  sessionId: SessionId
  parentSessionId: SessionId | undefined
  // Logger state
  loggerProvider: LoggerProvider | null
  eventLogger: ReturnType<typeof logs.getLogger> | null
  // Meter provider state
  meterProvider: MeterProvider | null
  // Tracer provider state
  tracerProvider: BasicTracerProvider | null
  // Agent color state
  agentColorMap: Map<string, AgentColorName>
  agentColorIndex: number
  // Last API request for bug reports
  lastAPIRequest: Omit<BetaMessageStreamParams, 'messages'> | null
  lastAPIRequestMessages: BetaMessageStreamParams['messages'] | null
  lastClassifierRequests: unknown[] | null
  // ... more fields
}
// 1758 lines defining comprehensive global state
```

### AttributedCounter Type

```typescript
export type AttributedCounter = {
  add(value: number, additionalAttributes?: Attributes): void
}
// OpenTelemetry counter wrapper
// Attributes for dimensional metrics
// add() increments with optional attributes
```

### ChannelEntry Type

```typescript
export type ChannelEntry =
  | { kind: 'plugin'; name: string; marketplace: string; dev?: boolean }
  | { kind: 'server'; name: string; dev?: boolean }

// dev: true on entries from --dangerously-load-development-channels
// Allowlist gate checks per-entry
// Prevents allowlist-bypass leak
```

### projectRoot vs cwd

```typescript
// Stable project root - set once at startup (including by --worktree flag)
// NEVER updated by mid-session EnterWorktreeTool.
// Use for project identity (history, skills, sessions) not file operations.

projectRoot: string  // Stable, set once
cwd: string          // Dynamic, updated by EnterWorktreeTool
// projectRoot: project identity
// cwd: current working directory (file operations)
```

### createSignal Pattern

```typescript
import { createSignal } from 'src/utils/signal.js'

// Signal for event emission
// No stored state
// Subscribe/emit/clear pattern
```

### resetSettingsCache Integration

```typescript
import { resetSettingsCache } from 'src/utils/settings/settingsCache.js'
// Settings cache reset
// On state changes
// Prevent stale cache
```

## 实现建议

### OpenClaw适配

1. **globalState**: 全局状态单例
2. **stateDiscipline**: DO NOT ADD MORE STATE原则
3. **counterType**: AttributedCounter类型
4. **projectRootCwd**: projectRoot vs cwd区分

### 状态文件示例

```json
{
  "projectRoot": "/Users/mac/project",
  "cwd": "/Users/mac/project/src",
  "sessionId": "sess_xxx",
  "totalCostUSD": 0.05,
  "startTime": 1744400000
}
```

## 关键模式

### Global State Discipline

```
DO NOT ADD MORE STATE - 1758 lines → strict discipline
// 全局状态昂贵
// 严格纪律避免膨胀
```

### Project Root Stability

```
projectRoot set once → EnterWorktreeTool updates cwd only
// projectRoot稳定（设置一次）
// cwd动态（EnterWorktreeTool更新）
```

### AttributedCounter

```
{ add(value, attributes) } → OpenTelemetry dimensional metrics
// Attributes维度指标
// add()带可选attributes
```

### ChannelEntry dev Flag

```
dev: true → allowlist gate checks per-entry → prevents bypass leak
// dev flag标记开发channel
// 每entry独立检查
```

## 借用价值

- ⭐⭐⭐⭐⭐ DO NOT ADD MORE STATE discipline
- ⭐⭐⭐⭐⭐ projectRoot vs cwd separation
- ⭐⭐⭐⭐⭐ AttributedCounter pattern
- ⭐⭐⭐⭐⭐ State comprehensive (1758 lines)
- ⭐⭐⭐⭐ ChannelEntry dev flag

## 来源

- Claude Code: `bootstrap/state.ts` (1758 lines)
- 分析报告: P44-1