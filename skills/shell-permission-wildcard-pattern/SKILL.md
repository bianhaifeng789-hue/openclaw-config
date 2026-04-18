# Shell Permission Wildcard Pattern Skill

Shell Permission Wildcard Pattern - ShellPermissionRule discriminated union exact/prefix/wildcard + hasWildcards unescaped * check + matchWildcardPattern null-byte placeholders + ESCAPED_STAR/BACKSLASH_PLACEHOLDER + parsePermissionRule legacy :* prefix + matchWildcardPattern regex conversion + trailing ' *' optional args + suggestionForExactCommand/suggestionForPrefix。

## 功能概述

从Claude Code的utils/permissions/shellRuleMatching.ts提取的Shell permission wildcard模式，用于OpenClaw的Shell工具权限匹配。

## 核心机制

### ShellPermissionRule discriminated union exact/prefix/wildcard

```typescript
export type ShellPermissionRule =
  | {
      type: 'exact'
      command: string
    }
  | {
      type: 'prefix'
      prefix: string
    }
  | {
      type: 'wildcard'
      pattern: string
    }

// discriminated union
# type field discriminates
# exact: command string
# prefix: legacy :* syntax
# wildcard: new * syntax
```

### hasWildcards unescaped * check

```typescript
export function hasWildcards(pattern: string): boolean {
  // If it ends with :*, it's legacy prefix syntax, not wildcard
  if (pattern.endsWith(':*')) return false
  
  // Check for unescaped * anywhere in the pattern
  // An asterisk is unescaped if it's not preceded by a backslash,
  // or if it's preceded by an even number of backslashes (escaped backslashes)
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '*') {
      // Count backslashes before this asterisk
      let backslashCount = 0
      let j = i - 1
      while (j >= 0 && pattern[j] === '\\') {
        backslashCount++
        j--
      }
      // If even number of backslashes (including 0), the asterisk is unescaped
      if (backslashCount % 2 === 0) return true
    }
  }
  return false
}
// hasWildcards
# ends with :* → false (legacy)
# odd backslashes → escaped
# even backslashes → unescaped
```

### matchWildcardPattern null-byte placeholders

```typescript
const ESCAPED_STAR_PLACEHOLDER = '\x00ESCAPED_STAR\x00'
const ESCAPED_BACKSLASH_PLACEHOLDER = '\x00ESCAPED_BACKSLASH\x00'

// Null-byte sentinel placeholders for wildcard pattern escaping — module-level
// so the RegExp objects are compiled once instead of per permission check.
// null-byte placeholders
# \x00 sentinel
# Module-level RegExp
# Compile once
```

### ESCAPED_STAR/BACKSLASH_PLACEHOLDER

```typescript
// Process the pattern to handle escape sequences: \* and \\
let processed = ''
let i = 0

while (i < trimmedPattern.length) {
  const char = trimmedPattern[i]

  if (char === '\\' && i + 1 < trimmedPattern.length) {
    const nextChar = trimmedPattern[i + 1]
    if (nextChar === '*') {
      // \* -> literal asterisk placeholder
      processed += ESCAPED_STAR_PLACEHOLDER
      i += 2
      continue
    } else if (nextChar === '\\') {
      // \\ -> literal backslash placeholder
      processed += ESCAPED_BACKSLASH_PLACEHOLDER
      i += 2
      continue
    }
  }

  processed += char
  i++
}
// ESCAPED_STAR/BACKSLASH_PLACEHOLDER
# \* → ESCAPED_STAR_PLACEHOLDER
# \\ → ESCAPED_BACKSLASH_PLACEHOLDER
# Replace then restore
```

### parsePermissionRule legacy :* prefix

```typescript
export function parsePermissionRule(permissionRule: string): ShellPermissionRule {
  // Check for legacy :* prefix syntax first (backwards compatibility)
  const prefix = permissionRuleExtractPrefix(permissionRule)
  if (prefix !== null) {
    return {
      type: 'prefix',
      prefix,
    }
  }

  // Check for new wildcard syntax (contains * but not :* at end)
  if (hasWildcards(permissionRule)) {
    return {
      type: 'wildcard',
      pattern: permissionRule,
    }
  }

  // Otherwise, it's an exact match
  return {
    type: 'exact',
    command: permissionRule,
  }
}

export function permissionRuleExtractPrefix(permissionRule: string): string | null {
  const match = permissionRule.match(/^(.+):\*$/)
  return match?.[1] ?? null
}
// parsePermissionRule
# legacy :* → prefix type
# new * → wildcard type
# neither → exact type
```

### matchWildcardPattern regex conversion

```typescript
// Escape regex special characters except *
const escaped = processed.replace(/[.+?^${}()|[\]\\'"]/g, '\\$&')

// Convert unescaped * to .* for wildcard matching
const withWildcards = escaped.replace(/\*/g, '.*')

// Convert placeholders back to escaped regex literals
let regexPattern = withWildcards
  .replace(ESCAPED_STAR_PLACEHOLDER_RE, '\\*')
  .replace(ESCAPED_BACKSLASH_PLACEHOLDER_RE, '\\\\')

// Create regex that matches the entire string
const regex = new RegExp(`^${regexPattern}$`, 's')
return regex.test(command)
// regex conversion
# Escape regex chars
# * → .*
# Replace placeholders back
# ^...$ anchor
```

### trailing ' *' optional args

```typescript
// When a pattern ends with ' *' (space + unescaped wildcard) AND the trailing
// wildcard is the ONLY unescaped wildcard, make the trailing space-and-args
// optional so 'git *' matches both 'git add' and bare 'git'.
// This aligns wildcard matching with prefix rule semantics (git:*).
const unescapedStarCount = (processed.match(/\*/g) || []).length
if (regexPattern.endsWith(' .*') && unescapedStarCount === 1) {
  regexPattern = regexPattern.slice(0, -3) + '( .*)?'
}
// trailing ' *' optional
# git * → matches 'git' AND 'git add'
# Align with git:* prefix
# Single wildcard special case
```

### suggestionForExactCommand

```typescript
export function suggestionForExactCommand(
  toolName: string,
  command: string,
): PermissionUpdate[] {
  return [
    {
      type: 'addRules',
      rules: [{ toolName, ruleContent: command }],
      behavior: 'allow',
      destination: 'localSettings',
    },
  ]
}
// suggestionForExactCommand
# Add exact rule
# localSettings destination
# Single suggestion
```

### suggestionForPrefix

```typescript
export function suggestionForPrefix(
  toolName: string,
  prefix: string,
): PermissionUpdate[] {
  return [
    {
      type: 'addRules',
      rules: [{ toolName, ruleContent: `${prefix}:*` }],
      behavior: 'allow',
      destination: 'localSettings',
    },
  ]
}
// suggestionForPrefix
# Add prefix rule
# prefix:* syntax
# localSettings destination
```

## 实现建议

### OpenClaw适配

1. **ruleTypeUnion**: ShellPermissionRule discriminated union pattern
2. **wildcardDetection**: hasWildcards pattern
3. **nullBytePlaceholder**: ESCAPED_STAR/BACKSLASH_PLACEHOLDER pattern
4. **regexConversion**: matchWildcardPattern pattern
5. **trailingOptional**: ' *' optional args pattern

### 状态文件示例

```json
{
  "type": "wildcard",
  "pattern": "git*",
  "command": "git add",
  "matches": true
}
```

## 关键模式

### Discriminated Union Exact/Prefix/Wildcard

```
{ type: 'exact', command } | { type: 'prefix', prefix } | { type: 'wildcard', pattern } → discriminated union → type field → ShellPermissionRule
# discriminated union exact/prefix/wildcard
# type field discriminates
# three rule types
```

### Odd/Even Backslash Unescaped Check

```
backslashCount % 2 === 0 → unescaped | odd → escaped → count backslashes → even = unescaped
# odd/even backslash unescaped check
# even backslashes = unescaped *
# odd backslashes = escaped *
```

### Null-Byte Placeholder Compile Once

```
\x00ESCAPED_STAR\x00 + \x00ESCAPED_BACKSLASH\x00 → null-byte sentinel → module-level RegExp → compile once → not per check
# null-byte placeholder compile once
# sentinel placeholders
# module-level constants
```

### Trailing ' *' Optional Args

```
regexPattern.endsWith(' .*') + unescapedStarCount === 1 → ( .*)? → optional args → git * matches git AND git add → align with prefix
# trailing ' *' optional args
# single wildcard special
# align with prefix semantics
```

### Replace Placeholder → Regex Literal

```
ESCAPED_STAR_PLACEHOLDER_RE → \\* | ESCAPED_BACKSLASH_PLACEHOLDER_RE → \\\\ → replace placeholders → regex literals → restore escaped
# replace placeholder → regex literal
# sentinel → escaped regex
```

## 借用价值

- ⭐⭐⭐⭐⭐ Discriminated union exact/prefix/wildcard pattern
- ⭐⭐⭐⭐⭐ Odd/even backslash unescaped check pattern
- ⭐⭐⭐⭐⭐ Null-byte placeholder compile once pattern
- ⭐⭐⭐⭐⭐ Trailing ' *' optional args pattern
- ⭐⭐⭐⭐⭐ Replace placeholder → regex literal pattern

## 来源

- Claude Code: `utils/permissions/shellRuleMatching.ts` (156 lines)
- 分析报告: P59-13