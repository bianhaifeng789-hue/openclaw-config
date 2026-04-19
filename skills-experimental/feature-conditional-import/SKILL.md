# Feature Conditional Import Skill

Feature Conditional Import - feature() + require() + null fallback + Dead Code Elimination + External Build Protection。

## 功能概述

从Claude Code的多个文件提取的Feature Conditional Import模式，用于OpenClaw的条件导入。

## 核心机制

### feature() Check

```typescript
import { feature } from 'bun:bundle'

const proactiveModule = feature('PROACTIVE') || feature('KAIROS')
  ? require('../proactive/index.js')
  : null
// Bun feature flag
// Conditional import
// null fallback
```

### Dead Code Elimination

```typescript
/* eslint-disable @typescript-eslint/no-require-imports */
const reactiveCompact = feature('REACTIVE_COMPACT')
  ? require('./services/compact/reactiveCompact.js')
  : null
const contextCollapse = feature('CONTEXT_COLLAPSE')
  ? require('./services/contextCollapse/index.js')
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
// Bun compiler eliminates dead branches
// External builds don't include module
// No code leak
```

### External Build Protection

```typescript
// Importing from BriefTool.ts would leak tool-name strings into external builds
// Single spinner instance → hooks stay unconditional
// Inlined isBriefEnabled() logic instead of import
// Prevent tool name leakage
// Inline logic for sensitive modules
```

### Type Casting

```typescript
const skillPrefetch = feature('EXPERIMENTAL_SKILL_SEARCH')
  ? (require('./services/skillSearch/prefetch.js') as typeof import('./services/skillSearch/prefetch.js'))
  : null
// Type cast for TypeScript
// typeof import pattern
// Null-safe
```

### Multiple Features OR

```typescript
feature('KAIROS') || feature('KAIROS_BRIEF')
  ? (require('../tools/BriefTool/prompt.js')).BRIEF_TOOL_NAME
  : null
// Multiple feature flags
// OR logic
// Extract specific constant
```

### ESLint Disable Pattern

```typescript
/* eslint-disable @typescript-eslint/no-require-imports */
const module = feature('X') ? require('./module.js') : null
/* eslint-enable @typescript-eslint/no-require-imports */
// Disable require import rule
// Conditional require
// Re-enable after
```

### Hook Integration

```typescript
const useVoiceIntegration: typeof import('../hooks/useVoiceIntegration.js').useVoiceIntegration = 
  feature('VOICE_MODE') 
    ? require('../hooks/useVoiceIntegration.js').useVoiceIntegration 
    : () => ({ stripTrailing: () => 0, handleKeyEvent: () => {} })
// Function type annotation
// Default stub implementation
// No-op when feature disabled
```

## 实现建议

### OpenClaw适配

1. **featureCheck**: feature() check
2. **requireConditional**: require() conditional
3. **nullFallback**: null fallback
4. **typeCast**: typeof import cast
5. **eslintPattern**: ESLint disable pattern

### 状态文件示例

```json
{
  "features": ["VOICE_MODE", "KAIROS"],
  "importCondition": true,
  "externalBuild": true,
  "deadCodeElim": true
}
```

## 关键模式

### feature() OR Logic

```
feature('KAIROS') || feature('KAIROS_BRIEF') → multiple flags
// OR logic for多个feature
// 任一启用即import
```

### typeof import Cast

```
require() as typeof import('...') → type-safe
// TypeScript类型转换
// typeof import pattern
```

### Null Fallback

```
feature() ? require() : null → safe access
// null fallback防止crash
// 使用时需null check
```

### Stub Implementation

```
() => ({ stripTrailing: () => 0 }) → no-op stub
// feature disabled时的stub实现
// 返回默认值
```

### Dead Code Elimination

```
Bun compiler → eliminate false branches → no external leak
// Bun编译器消除false分支
// 外部build不包含module
```

## 借用价值

- ⭐⭐⭐⭐⭐ feature() conditional import
- ⭐⭐⭐⭐⭐ Dead code elimination
- ⭐⭐⭐⭐⭐ External build protection
- ⭐⭐⭐⭐ typeof import type cast
- ⭐⭐⭐⭐ Null fallback pattern

## 来源

- Claude Code: `components/Messages.tsx`, `components/Spinner.tsx`, `query.ts`
- 分析报告: P43-3