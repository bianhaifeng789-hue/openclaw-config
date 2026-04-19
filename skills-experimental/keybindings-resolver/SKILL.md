# Keybindings Resolver Skill

Keybindings Resolver - resolveKey纯函数 + ChordResolveResult discriminated union + last wins override + platform-specific shortcuts + VT mode detection。

## 功能概述

从Claude Code的keybindings/resolver.ts + defaultBindings.ts提取的键盘绑定模式，用于OpenClaw的快捷键系统。

## 核心机制

### resolveKey Pure Function

```typescript
/**
 * Resolve a key input to an action.
 * Pure function - no state, no side effects, just matching logic.
 */
export function resolveKey(
  input: string,
  key: Key,
  activeContexts: KeybindingContextName[],
  bindings: ParsedBinding[],
): ResolveResult {
  // Find matching bindings (last one wins for user overrides)
  let match: ParsedBinding | undefined
  const ctxSet = new Set(activeContexts)

  for (const binding of bindings) {
    if (binding.chord.length !== 1) continue  // Single keystroke only
    if (!ctxSet.has(binding.context)) continue

    if (matchesBinding(input, key, binding)) {
      match = binding
    }
  }

  if (!match) return { type: 'none' }
  if (match.action === null) return { type: 'unbound' }

  return { type: 'match', action: match.action }
}
// Pure function - no state
// Last wins for user overrides
// Single keystroke only
```

### ResolveResult Discriminated Union

```typescript
export type ResolveResult =
  | { type: 'match'; action: string }
  | { type: 'none' }
  | { type: 'unbound' }

export type ChordResolveResult =
  | { type: 'match'; action: string }
  | { type: 'none' }
  | { type: 'unbound' }
  | { type: 'chord_started'; pending: ParsedKeystroke[] }
  | { type: 'chord_cancelled' }
// Discriminated union by type field
// match: action found
// none: no binding
// unbound: null action
// chord_started: multi-key chord in progress
// chord_cancelled: chord interrupted
```

### last wins Override

```typescript
// Find matching bindings (last one wins for user overrides)
for (const binding of bindings) {
  if (matchesBinding(input, key, binding)) {
    match = binding  // Overwrite - last wins
  }
}
// Iterate all bindings
// Overwrite on match
// Last binding wins
// User overrides take precedence
```

### Platform-Specific Shortcuts

```typescript
// Platform-specific image paste shortcut:
// - Windows: alt+v (ctrl+v is system paste)
// - Other platforms: ctrl+v
const IMAGE_PASTE_KEY = getPlatform() === 'windows' ? 'alt+v' : 'ctrl+v'

// Platform-specific mode cycle shortcut:
// - Windows without VT mode: meta+m (shift+tab doesn't work reliably)
// - Other platforms: shift+tab
const MODE_CYCLE_KEY = SUPPORTS_TERMINAL_VT_MODE ? 'shift+tab' : 'meta+m'
// Platform detection
// Different shortcuts per platform
// Windows special handling
```

### VT Mode Detection

```typescript
// Node enabled VT mode in 24.2.0 / 22.17.0
// Bun enabled VT mode in 1.2.23
const SUPPORTS_TERMINAL_VT_MODE =
  getPlatform() !== 'windows' ||
  (isRunningWithBun()
    ? satisfies(process.versions.bun, '>=1.2.23')
    : satisfies(process.versions.node, '>=22.17.0 <23.0.0 || >=24.2.0'))

// Modifier-only chords may fail on Windows Terminal without VT mode
// See: https://github.com/microsoft/terminal/issues/879
// Version detection
// Bun vs Node version check
// Windows Terminal workaround
```

### Context-Based Bindings

```typescript
export const DEFAULT_BINDINGS: KeybindingBlock[] = [
  {
    context: 'Global',
    bindings: {
      'ctrl+c': 'app:interrupt',
      'ctrl+d': 'app:exit',
      'ctrl+l': 'app:redraw',
      'ctrl+t': 'app:toggleTodos',
      'ctrl+o': 'app:toggleTranscript',
      'ctrl+r': 'history:search',
    },
  },
  {
    context: 'Chat',
    bindings: {
      escape: 'chat:cancel',
      enter: 'chat:submit',
      up: 'history:previous',
      down: 'history:next',
    },
  },
  {
    context: 'Autocomplete',
    bindings: { ... },
  },
]
// Context-based grouping
// Global vs Chat vs Autocomplete
// Different bindings per context
```

### Feature-Gated Bindings

```typescript
...(feature('KAIROS') || feature('KAIROS_BRIEF')
  ? { 'ctrl+shift+b': 'app:toggleBrief' as const }
  : {})

...(feature('QUICK_SEARCH')
  ? {
      'ctrl+shift+f': 'app:globalSearch' as const,
      'cmd+shift+f': 'app:globalSearch' as const,
    }
  : {})
// Feature flag conditional
// Only include if feature enabled
// Spread into bindings object
```

## 实现建议

### OpenClaw适配

1. **resolveKeyPure**: resolveKey纯函数
2. **discriminatedUnion**: ResolveResult discriminated union
3. **lastWins**: last wins override pattern
4. **platformSpecific**: Platform-specific shortcuts
5. **vtModeDetection**: VT mode detection

### 状态文件示例

```json
{
  "platform": "darwin",
  "vtModeSupported": true,
  "imagePasteKey": "ctrl+v",
  "modeCycleKey": "shift+tab"
}
```

## 关键模式

### Pure Function Resolver

```
resolveKey(input, key, contexts, bindings) → no state, no side effects
// 纯函数resolver
// 无状态，无副作用
```

### Discriminated Union Result

```
match | none | unbound | chord_started | chord_cancelled
// type字段作为discriminant
// 每种result不同字段
```

### Last Wins Override

```
for bindings → overwrite on match → last wins
// 迭代覆盖
// 最后一个binding生效
// User override优先
```

### Platform Detection

```
getPlatform() + version check → platform-specific shortcuts
// 平台检测
// 版本检查
// 不同平台不同快捷键
```

## 借用价值

- ⭐⭐⭐⭐⭐ resolveKey pure function
- ⭐⭐⭐⭐⭐ ResolveResult discriminated union
- ⭐⭐⭐⭐⭐ Last wins override pattern
- ⭐⭐⭐⭐⭐ Platform-specific shortcuts
- ⭐⭐⭐⭐ VT mode detection

## 来源

- Claude Code: `keybindings/resolver.ts`, `keybindings/defaultBindings.ts`
- 分析报告: P44-2