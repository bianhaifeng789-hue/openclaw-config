# Git Root Walker Pattern Skill

Git Root Walker Pattern - findGitRootImpl + memoizeWithLRU + parent walk + statSync check + .git directory or file + GIT_ROOT_NOT_FOUND symbol + normalize NFC + stat count + dirname parent loop + root directory check + realpathSync。

## 功能概述

从Claude Code的utils/git.ts提取的Git root walker模式，用于OpenClaw的Git根目录查找。

## 核心机制

### findGitRootImpl

```typescript
const findGitRootImpl = memoizeWithLRU(
  (startPath: string): string | typeof GIT_ROOT_NOT_FOUND => {
    const startTime = Date.now()
    logForDiagnosticsNoPII('info', 'find_git_root_started')

    let current = resolve(startPath)
    const root = current.substring(0, current.indexOf(sep) + 1) || sep
    let statCount = 0

    while (current !== root) {
      try {
        const gitPath = join(current, '.git')
        statCount++
        const stat = statSync(gitPath)
        if (stat.isDirectory() || stat.isFile()) {
          logForDiagnosticsNoPII('info', 'find_git_root_completed', {
            duration_ms: Date.now() - startTime,
            stat_count: statCount,
            found: true,
          })
          return current.normalize('NFC')
        }
      } catch {
        // .git doesn't exist at this level, continue up
      }
      const parent = dirname(current)
      if (parent === current) {
        break
      }
      current = parent
    }

    // Check root directory as well
    // ...

    logForDiagnosticsNoPII('info', 'find_git_root_completed', {
      duration_ms: Date.now() - startTime,
      stat_count: statCount,
      found: false,
    })
    return GIT_ROOT_NOT_FOUND
  }
)
// Find Git root by walking up
# memoizeWithLRU
# statSync check .git
```

### memoizeWithLRU

```typescript
const findGitRootImpl = memoizeWithLRU(
  (startPath: string): string | typeof GIT_ROOT_NOT_FOUND => {
    // ...
  }
)
// LRU memoize
# Cache results
# Avoid repeated statSync
```

### parent walk

```typescript
while (current !== root) {
  try {
    const gitPath = join(current, '.git')
    statSync(gitPath)
    // ...
  } catch {
    // Continue up
  }
  const parent = dirname(current)
  if (parent === current) {
    break
  }
  current = parent
}
// Walk up parent directories
# dirname(current) → parent
# Loop until root
```

### statSync check

```typescript
const stat = statSync(gitPath)
if (stat.isDirectory() || stat.isFile()) {
  // .git can be a directory (regular repo) or file (worktree/submodule)
  return current.normalize('NFC')
}
// statSync check
# .git directory or file
# worktree/submodule = file
```

### .git directory or file

```typescript
// .git can be a directory (regular repo) or file (worktree/submodule)
if (stat.isDirectory() || stat.isFile()) {
  return current.normalize('NFC')
}
// .git is directory (regular repo) OR file (worktree/submodule)
# Both are valid Git roots
```

### GIT_ROOT_NOT_FOUND symbol

```typescript
const GIT_ROOT_NOT_FOUND = Symbol('git-root-not-found')
// Symbol for not found
# Distinct from null/undefined
# Type-safe sentinel
```

### normalize NFC

```typescript
return current.normalize('NFC')
// NFC (Normalization Form Canonical Composition)
# Unicode normalization
# Consistent string comparison
```

### stat count

```typescript
let statCount = 0
statCount++
// Track stat count for diagnostics
# Performance monitoring
```

### dirname parent loop

```typescript
const parent = dirname(current)
if (parent === current) {
  break
}
current = parent
// dirname loop
# dirname(current) → parent
# parent === current → break
```

### root directory check

```typescript
const root = current.substring(0, current.indexOf(sep) + 1) || sep
// Check root directory as well
try {
  const gitPath = join(root, '.git')
  statSync(gitPath)
  // ...
} catch {}
// Check root directory
# e.g., / on Unix, C:\ on Windows
```

### realpathSync

```typescript
// Realpath for resolved path
// (not shown in excerpt but used elsewhere)
# Resolve symlinks
# Canonical path
```

## 实现建议

### OpenClaw适配

1. **gitRootWalker**: findGitRootImpl walker pattern
2. **memoizeLRU**: memoizeWithLRU pattern
3. **symbolSentinel**: GIT_ROOT_NOT_FOUND symbol pattern
4. **normalizeNFC**: normalize NFC pattern
5. **gitDirOrFile**: .git directory or file pattern

### 状态文件示例

```json
{
  "gitRoot": "/home/user/project",
  "found": true,
  "statCount": 3
}
```

## 关键模式

### Parent Walk Up

```
current → dirname(current) → parent → loop → until root → find .git
# parent walk向上查找
# dirname获取parent
# loop until root
```

### .git Directory OR File

```
stat.isDirectory() || stat.isFile() → regular repo OR worktree/submodule → both valid
# .git可以是directory或file
# directory: regular repo
# file: worktree/submodule
```

### Symbol Sentinel

```
Symbol('git-root-not-found') → distinct sentinel → type-safe → not null/undefined
# Symbol作为sentinel
# distinct from null/undefined
# type-safe
```

### normalize NFC

```
current.normalize('NFC') → Unicode normalization → consistent comparison → NFC form
# NFC normalization
# Unicode规范化
# consistent string comparison
```

### LRU Memoize

```
memoizeWithLRU(fn) → cache results → avoid repeated statSync → performance
# LRU memoize cache
# 避免重复statSync
# 性能优化
```

## 借用价值

- ⭐⭐⭐⭐⭐ Git root walker pattern
- ⭐⭐⭐⭐⭐ .git directory OR file pattern
- ⭐⭐⭐⭐⭐ Symbol sentinel pattern
- ⭐⭐⭐⭐⭐ normalize NFC pattern
- ⭐⭐⭐⭐⭐ LRU memoize pattern

## 来源

- Claude Code: `utils/git.ts` (926 lines)
- 分析报告: P54-4