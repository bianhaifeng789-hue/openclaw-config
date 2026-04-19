# Typeahead Hook Skill

Typeahead Hook - Debounced suggestion + Unicode regex + Progressive argument hint + Path completion metadata。

## 功能概述

从Claude Code的useTypeahead hook提取的typeahead模式，用于OpenClaw的命令补全系统。

## 核心机制

### Unicode-Aware Regex

```typescript
// Unicode-aware character class for file path tokens:
// \p{L} = letters (CJK, Latin, Cyrillic, etc.)
// \p{N} = numbers (incl. fullwidth)
// \p{M} = combining marks (macOS NFD accents, Devanagari vowel signs)
const AT_TOKEN_HEAD_RE = /^@[\p{L}\p{N}\p{M}_\-./\\()[\]~:]*/u
const PATH_CHAR_HEAD_RE = /^[\p{L}\p{N}\p{M}_\-./\\()[\]~:]+/u
const TOKEN_WITH_AT_RE = /(@[\p{L}\p{N}\p{M}_\-./\\()[\]~:]*|[\p{L}\p{N}\p{M}_\-./\\()[\]~:]+)$/u
// Unicode property escapes
// CJK/全角支持
// macOS NFD accents
```

### Debounced Suggestion

```typescript
const debouncedUpdateSuggestions = useDebounceCallback(updateSuggestions, 100)
// Debounce 100ms
// 防止高频update
```

### Progressive Argument Hint

```typescript
function generateProgressiveArgumentHint(command: Command, args: string): string | undefined {
  // Generate argument hints as user types
  // Shows next expected argument
}
// 渐进式参数提示
// 显示下一个期望参数
```

### Path Completion Metadata

```typescript
type PathMetadata = { type: 'directory' | 'file' }
function isPathMetadata(metadata: unknown): metadata is PathMetadata {
  return typeof metadata === 'object' && metadata !== null && 'type' in metadata && (metadata.type === 'directory' || metadata.type === 'file')
}
// Type guard for metadata
// File/directory distinction
```

### Preserved Selection

```typescript
function getPreservedSelection(prevSuggestions: SuggestionItem[], prevSelection: number, newSuggestions: SuggestionItem[]): number {
  // Try to find the same item in new list by ID
  const newIndex = newSuggestions.findIndex(item => item.id === prevSelectedItem.id)
  return newIndex >= 0 ? newIndex : 0
}
// Preserve selection when suggestions update
// Find by ID
```

### Hash Channel Regex

```typescript
const HASH_CHANNEL_RE = /(^|\s)#([a-z0-9][a-z0-9_-]*)$/
// #channel mention pattern
// Slack/Teams channel
```

### Shell Completion Integration

```typescript
const shellCompletions = await getShellCompletions(command, cwd)
type ShellCompletionType = 'command' | 'file' | 'directory' | 'environment_variable' | 'alias'
// Shell completion types
// Bash/Zsh integration
```

### Unified Suggestions

```typescript
const suggestions = generateUnifiedSuggestions({
  input,
  cursorOffset,
  commands,
  agents,
  fileSuggestions,
  shellCompletions,
  directoryCompletions,
  channelSuggestions,
  sessionSuggestions
})
// Combine multiple suggestion sources
// Unified ranking
```

## 实现建议

### OpenClaw适配

1. **unicodeRegex**: Unicode-aware regex
2. **debouncedSuggestion**: Debounced suggestion
3. **progressiveHint**: Progressive argument hint
4. **preservedSelection**: Preserved selection

### 状态文件示例

```json
{
  "debounceMs": 100,
  "unicodeAware": true,
  "progressiveHint": true,
  "preservedSelection": true
}
```

## 关键模式

### Unicode Property Escapes

```
\p{L} + \p{N} + \p{M} → CJK/全角/macOS NFD
// Unicode-aware
// 支持中文输入
```

### Debounced Update

```
useDebounceCallback(updateSuggestions, 100)
// 100ms debounce
// 防止高频触发
```

### Selection Preservation

```
newSuggestions.findIndex(item.id === prevItem.id)
// 保持选中项
// ID-based查找
```

### Progressive Argument Hint

```
generateProgressiveArgumentHint(command, args)
// 渐进提示下一个参数
// 增强用户体验
```

## 借用价值

- ⭐⭐⭐⭐⭐ Unicode-aware regex
- ⭐⭐⭐⭐⭐ Debounced suggestion
- ⭐⭐⭐⭐⭐ Preserved selection
- ⭐⭐⭐⭐ Progressive argument hint
- ⭐⭐⭐⭐ Unified suggestions aggregation

## 来源

- Claude Code: `hooks/useTypeahead.tsx`
- 分析报告: P39-7