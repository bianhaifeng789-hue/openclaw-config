# Worktree Slug Validation Pattern Skill

Worktree Slug Validation Pattern - validateWorktreeSlug + VALID_WORKTREE_SLUG_SEGMENT regex + MAX_WORKTREE_SLUG_LENGTH 64 + path traversal check + segment split validation + '.' and '..' reject + leading/trailing slash reject + absolute path reject + path.join escape prevention。

## 功能概述

从Claude Code的utils/worktree.ts提取的Worktree slug validation模式，用于OpenClaw的Worktree命名验证。

## 核心机制

### validateWorktreeSlug

```typescript
export function validateWorktreeSlug(slug: string): void {
  if (slug.length > MAX_WORKTREE_SLUG_LENGTH) {
    throw new Error(
      `Invalid worktree name: must be ${MAX_WORKTREE_SLUG_LENGTH} characters or fewer (got ${slug.length})`,
    )
  }

  // Leading or trailing `/` would make path.join produce an absolute path
  // or a dangling segment. Splitting and validating each segment rejects
  // both (empty segments fail the regex) while allowing `user/feature`.
  for (const segment of slug.split('/')) {
    if (segment === '.' || segment === '..') {
      throw new Error(
        `Invalid worktree name "${slug}": must not contain "." or ".." path segments`,
      )
    }
    if (!VALID_WORKTREE_SLUG_SEGMENT.test(segment)) {
      throw new Error(
        `Invalid worktree name "${slug}": segment "${segment}" contains invalid characters`,
      )
    }
  }
}
// Validate worktree slug
# Length check + segment validation
```

### VALID_WORKTREE_SLUG_SEGMENT regex

```typescript
const VALID_WORKTREE_SLUG_SEGMENT = /^[a-zA-Z0-9._-]+$/
// Regex: alphanumeric, underscore, hyphen, dot
# Allowlist pattern
```

### MAX_WORKTREE_SLUG_LENGTH 64

```typescript
const MAX_WORKTREE_SLUG_LENGTH = 64
// Max 64 characters
# Prevent long names
```

### path traversal check

```typescript
// The slug is joined into `.claude/worktrees/<slug>` via path.join, which
// normalizes `..` segments — so `../../../target` would escape the worktrees
// directory. Similarly, an absolute path (leading `/` or `C:\`) would discard
// the prefix entirely.
// path.join normalizes `..` → escape
# Path traversal attack
```

### segment split validation

```typescript
for (const segment of slug.split('/')) {
  if (segment === '.' || segment === '..') {
    throw new Error(...)
  }
  if (!VALID_WORKTREE_SLUG_SEGMENT.test(segment)) {
    throw new Error(...)
  }
}
// Split by `/` and validate each segment
# Allow nested slugs (user/feature)
# Each segment validated
```

### '.' and '..' reject

```typescript
if (segment === '.' || segment === '..') {
  throw new Error(
    `Invalid worktree name "${slug}": must not contain "." or ".." path segments`,
  )
}
// Reject '.' and '..' segments
# Prevent path traversal
```

### leading/trailing slash reject

```typescript
// Leading or trailing `/` would make path.join produce an absolute path
// or a dangling segment. Splitting and validating each segment rejects
// both (empty segments fail the regex) while allowing `user/feature`.
// Empty segments fail regex
# `/foo` → ['' , 'foo'] → '' fails regex
# `foo/` → ['foo', ''] → '' fails regex
```

### absolute path reject

```typescript
// Similarly, an absolute path (leading `/` or `C:\`) would discard
// the prefix entirely.
// path.join('/absolute', 'prefix') → '/absolute' (prefix discarded)
# Absolute path discards prefix
```

### path.join escape prevention

```typescript
// path.join normalizes `..` segments — so `../../../target` would escape
// the worktrees directory.
// path.join('.claude/worktrees', '../../../target') → 'target'
# path.join normalizes ..
# Escape worktrees directory
```

## 实现建议

### OpenClaw适配

1. **slugValidation**: validateWorktreeSlug pattern
2. **segmentValidation**: segment split + regex validation
3. **pathTraversal**: path traversal check pattern
4. **regexAllowlist**: VALID_WORKTREE_SLUG_SEGMENT regex
5. **lengthLimit**: MAX_WORKTREE_SLUG_LENGTH pattern

### 状态文件示例

```json
{
  "slug": "user/feature",
  "valid": true,
  "segments": ["user", "feature"],
  "maxLength": 64
}
```

## 关键模式

### Segment Split + Regex

```
slug.split('/') → each segment → regex test → allowlist → alphanumeric, underscore, hyphen, dot
# segment split验证
# 每个segment regex test
# allowlist pattern
```

### '.' '..' Path Traversal Reject

```
segment === '.' || segment === '..' → throw → prevent path traversal → path.join normalizes ..
# reject '.' '..' segments
# 防止path traversal
# path.join会normalize
```

### Leading/Trailing Slash Empty

```
'/foo' → ['', 'foo'] → '' fails regex | 'foo/' → ['foo', ''] → '' fails regex → reject
# leading/trailing slash → empty segment
# empty segment fails regex
# reject absolute/dangling
```

### Regex Allowlist

```
^[a-zA-Z0-9._-]+$ → allowlist → valid chars only → reject invalid → security
# regex allowlist
# 只允许alphanumeric, underscore, hyphen, dot
# reject invalid chars
```

### Length Limit 64

```
slug.length > 64 → throw → MAX_WORKTREE_SLUG_LENGTH → prevent long names
# 长度限制64
# 防止过长names
```

## 借用价值

- ⭐⭐⭐⭐⭐ Segment split + regex validation pattern
- ⭐⭐⭐⭐⭐ '.' '..' path traversal reject pattern
- ⭐⭐⭐⭐⭐ Leading/trailing slash empty segment reject pattern
- ⭐⭐⭐⭐⭐ Regex allowlist pattern
- ⭐⭐⭐⭐⭐ MAX_WORKTREE_SLUG_LENGTH limit pattern

## 来源

- Claude Code: `utils/worktree.ts` (1519 lines)
- 分析报告: P54-5