# Cost Tracker Pattern Skill

Cost Tracker Pattern - StoredCostState + addToTotalCostState + ModelUsage + formatCost + resetCostState + calculateUSDCost。

## 功能概述

从Claude Code的cost-tracker.ts提取的成本追踪模式，用于OpenClaw的使用统计。

## 核心机制

### StoredCostState

```typescript
type StoredCostState = {
  totalCostUSD: number
  totalAPIDuration: number
  totalAPIDurationWithoutRetries: number
  totalToolDuration: number
  totalLinesAdded: number
  totalLinesRemoved: number
  lastDuration: number | undefined
  modelUsage: { [modelName: string]: ModelUsage } | undefined
}
// Complete cost state for persistence
// USD cost + durations + lines + model usage
```

### Exported Functions

```typescript
export {
  getTotalCostUSD as getTotalCost,
  getTotalDuration,
  getTotalAPIDuration,
  getTotalAPIDurationWithoutRetries,
  addToTotalLinesChanged,
  getTotalLinesAdded,
  getTotalLinesRemoved,
  getTotalInputTokens,
  getTotalOutputTokens,
  getTotalCacheReadInputTokens,
  getTotalCacheCreationInputTokens,
  getTotalWebSearchRequests,
  formatCost,
  hasUnknownModelCost,
  resetStateForTests,
  resetCostState,
  setHasUnknownModelCost,
  getModelUsage,
  getUsageForModel,
}
// Comprehensive exports
// Cost + Duration + Tokens + Lines + Web Search + Cache
```

### ModelUsage Type

```typescript
type ModelUsage = {
  inputTokens: number
  outputTokens: number
  cacheCreationInputTokens: number
  cacheReadInputTokens: number
  cost: number
  apiDuration: number
  apiDurationWithoutRetries: number
  toolDuration: number
  webSearchRequests: number
}
// Per-model usage tracking
// Input/Output + Cache + Duration + Web Search
```

### addToTotalCostState

```typescript
// Import from bootstrap/state.js
addToTotalCostState(usage)
// Add usage to totals
// Called after each API call
```

### calculateUSDCost

```typescript
import { calculateUSDCost } from './utils/modelCost.js'
// Calculate USD cost from usage
// Model-specific pricing
// Per-model rates
```

### formatCost

```typescript
import { formatNumber } from './utils/format.js'
// Format cost for display
// Number formatting
// Human-readable
```

### resetCostState

```typescript
resetCostState()
setCostStateForRestore(state)
// Reset/restore cost state
// Session restore support
// Test isolation
```

### getSdkBetas

```typescript
import { getSdkBetas } from './bootstrap/state.js'
// SDK betas affect pricing
// Beta features may have different costs
```

## 实现建议

### OpenClaw适配

1. **storedCostState**: StoredCostState类型
2. **modelUsage**: ModelUsage类型
3. **addToTotal**: addToTotalCostState
4. **calculateCost**: calculateUSDCost

### 状态文件示例

```json
{
  "totalCostUSD": 0.05,
  "totalAPIDuration": 3000,
  "totalLinesAdded": 150,
  "totalLinesRemoved": 20,
  "modelUsage": {
    "claude-3-opus": {
      "inputTokens": 10000,
      "outputTokens": 5000,
      "cost": 0.05
    }
  }
}
```

## 关键模式

### Comprehensive State

```
totalCostUSD + durations + lines + modelUsage → complete state
// 完整状态包含所有cost相关字段
// Per-model usage tracking
```

### Duration Types

```
totalAPIDuration + totalAPIDurationWithoutRetries + totalToolDuration
// API duration (with retries)
// API duration (without retries)
// Tool execution duration
```

### Cache Tokens

```
getTotalCacheReadInputTokens + getTotalCacheCreationInputTokens
// Cache read tokens (cheaper)
// Cache creation tokens (expensive)
```

### Model-Specific Usage

```
modelUsage[modelName] → per-model tracking
// 每个model独立统计
// 精确cost计算
```

## 借用价值

- ⭐⭐⭐⭐⭐ StoredCostState comprehensive
- ⭐⭐⭐⭐⭐ ModelUsage per-model tracking
- ⭐⭐⭐⭐⭐ Export comprehensive functions
- ⭐⭐⭐⭐ Duration types (API/Tool/Retries)
- ⭐⭐⭐⭐ Cache token tracking

## 来源

- Claude Code: `cost-tracker.ts`
- 分析报告: P43-2