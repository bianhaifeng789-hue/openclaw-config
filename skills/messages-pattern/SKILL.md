# Messages Pattern Skill

Messages Pattern - LogoHeader memo + filterForBriefTool + Collapse系列 + isMeta placeholders + seenDirtyChild cascade。

## 功能概述

从Claude Code的Messages.tsx提取的消息列表模式，用于OpenClaw的对话显示。

## 核心机制

### LogoHeader Memo

```typescript
// Memoed logo header: this box is the FIRST sibling before all MessageRows
// in main-screen mode. If it becomes dirty on every Messages re-render,
// renderChildren's seenDirtyChild cascade disables prevScreen (blit) for
// ALL subsequent siblings — every MessageRow re-writes from scratch.
// In long sessions (~2800 messages) this is 150K+ writes/frame and pegs CPU at 100%.

const LogoHeader = React.memo(function LogoHeader({ agentDefinitions }) {
  return (
    <OffscreenFreeze>
      <LogoV2 />
      <StatusNotices agentDefinitions={agentDefinitions} />
    </OffscreenFreeze>
  )
})
// LogoV2/StatusNotices internally subscribe to useAppState/useSettings
// Memo prevents seenDirtyChild cascade
// Critical for long sessions (2800 messages → 150K+ writes/frame)
```

### filterForBriefTool

```typescript
/**
 * In brief-only mode, filter messages to show ONLY Brief tool_use blocks,
 * their tool_results, and real user input. All assistant text is dropped —
 * if the model forgets to call Brief, the user sees nothing for that turn.
 * That's on the model to get right; the filter does not second-guess it.
 */
// Brief-only: show only Brief tool_use + tool_results + real user input
// Assistant text dropped entirely
// Model responsibility to call Brief
```

### Collapse系列

```typescript
import { collapseBackgroundBashNotifications } from '../utils/collapseBackgroundBashNotifications.js'
import { collapseHookSummaries } from '../utils/collapseHookSummaries.js'
import { collapseReadSearchGroups } from '../utils/collapseReadSearch.js'
import { collapseTeammateShutdowns } from '../utils/collapseTeammateShutdowns.js'
// Multiple collapse utilities
// Group/collapse similar messages
// Reduce visual noise
```

### seenDirtyChild Cascade

```typescript
// If LogoHeader becomes dirty on every re-render:
// - seenDirtyChild cascade disables prevScreen (blit)
// - ALL subsequent siblings re-write from scratch
// - 2800 messages → 150K+ writes/frame → 100% CPU
// Memo on agentDefinitions prevents cascade
// Critical performance pattern
```

### Dead Code Elimination

```typescript
/* eslint-disable @typescript-eslint/no-require-imports */
const proactiveModule = feature('PROACTIVE') || feature('KAIROS') 
  ? require('../proactive/index.js') 
  : null
const BRIEF_TOOL_NAME: string | null = feature('KAIROS') || feature('KAIROS_BRIEF')
  ? (require('../tools/BriefTool/prompt.js')).BRIEF_TOOL_NAME
  : null
/* eslint-enable @typescript-eslint/no-require-imports */
// Feature flag conditional imports
// Dead code elimination
// External builds don't leak tool names
```

### isMeta Filtering

```typescript
// isMeta: true → hidden from conversation view
// <collapsed> placeholders are isMeta
// Only visible in specific components
// Not in Messages.tsx
```

## 实现建议

### OpenClaw适配

1. **logoHeaderMemo**: LogoHeader memo
2. **filterBrief**: Brief-only filter
3. **collapseSeries**: Collapse系列
4. **deadCodeElim**: Dead code elimination

### 状态文件示例

```json
{
  "logoHeaderMemo": true,
  "briefOnly": false,
  "collapseBackground": true,
  "collapseHooks": true
}
```

## 关键模式

### Memo Anti-Cascade

```
React.memo(LogoHeader) → prevents seenDirtyChild → blit preserved → 150K writes avoided
// LogoHeader必须是memo
// 否则cascade导致全量重写
// 性能critical
```

### Brief-Only Filter

```
Brief tool_use + tool_results + user input → all else dropped
// Brief模式只显示Brief相关
// Assistant text完全丢弃
```

### Collapse Utilities

```
collapseBackgroundBashNotifications + collapseHookSummaries + collapseReadSearchGroups + collapseTeammateShutdowns
// 多种collapse utility
// 减少视觉噪音
```

### Feature Conditional Import

```
feature('KAIROS') ? require(...) : null → dead code elimination
// Feature flag决定import
// 外部build不泄露
```

## 借用价值

- ⭐⭐⭐⭐⭐ LogoHeader memo (anti-cascade)
- ⭐⭐⭐⭐⭐ filterForBriefTool pattern
- ⭐⭐⭐⭐⭐ Collapse series pattern
- ⭐⭐⭐⭐⭐ Dead code elimination
- ⭐⭐⭐⭐ seenDirtyChild cascade awareness

## 来源

- Claude Code: `components/Messages.tsx`
- 分析报告: P42-1