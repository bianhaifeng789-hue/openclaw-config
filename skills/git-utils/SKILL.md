---
name: git-utils
description: "Git utilities. findGitRoot + resolveCanonicalRoot + getCachedBranch + getCachedRemoteUrl + getCachedHead + getWorktreeCountFromFs + LRU cache (50 entries) + Security validation + memoizeWithLRU. Use when [git utils] is needed."
metadata:
  openclaw:
    emoji: "🌳"
    triggers: [git-root, worktree-resolve]
    feishuCard: true
---

# Git Utils Skill - Git Utils

Git Utils Git 工具集。

## 为什么需要这个？

**场景**：
- Find .git root by walking up directory tree
- Resolve canonical root for worktrees
- Get cached branch/remote URL/HEAD
- Count worktrees
- Security validation against malicious repos

**Claude Code 方案**：git.ts + 920+ lines
**OpenClaw 飞书适配**：Git utils + Root finding

---

## Functions

### 1. Find Git Root

```typescript
const GIT_ROOT_NOT_FOUND = Symbol('git-root-not-found')

const findGitRootImpl = memoizeWithLRU(
  (startPath: string): string | typeof GIT_ROOT_NOT_FOUND => {
    let current = resolve(startPath)
    const root = current.substring(0, current.indexOf(sep) + 1) || sep
    let statCount = 0

    while (current !== root) {
      try {
        const gitPath = join(current, '.git')
        statCount++
        const stat = statSync(gitPath)
        // .git can be a directory (regular repo) or file (worktree/submodule)
        if (stat.isDirectory() || stat.isFile()) {
          return current.normalize('NFC')
        }
      } catch {
        // .git doesn't exist, continue up
      }
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }

    return GIT_ROOT_NOT_FOUND
  },
  path => path,
  50, // LRU max entries
)

export function findGitRoot(startPath: string): string | null {
  const result = findGitRootImpl(startPath)
  return result === GIT_ROOT_NOT_FOUND ? null : result
}
```

### 2. Resolve Canonical Root

```typescript
const resolveCanonicalRoot = memoizeWithLRU(
  (gitRoot: string): string => {
    try {
      // In worktree: .git is a file containing: gitdir: <path>
      const gitContent = readFileSync(join(gitRoot, '.git'), 'utf-8').trim()
      if (!gitContent.startsWith('gitdir:')) return gitRoot
      
      const worktreeGitDir = resolve(gitRoot, gitContent.slice('gitdir:'.length).trim())
      // commondir points to shared .git directory
      const commonDir = resolve(worktreeGitDir, readFileSync(join(worktreeGitDir, 'commondir'), 'utf-8').trim())
      
      // SECURITY: Validate worktree structure
      // 1. worktreeGitDir must be direct child of <commonDir>/worktrees/
      if (!worktreeGitDir.startsWith(join(commonDir, 'worktrees'))) {
        throw new Error('Invalid worktree structure')
      }
      
      // 2. commondir must be absolute
      if (!isAbsolute(commonDir)) throw new Error('commondir not absolute')
      
      // 3. .git inside commondir must exist
      if (!statSync(join(commonDir, '.git'))) throw new Error('No .git in commonDir')
      
      // Working directory is parent of commonDir
      return dirname(commonDir)
    } catch {
      return gitRoot // Submodule or regular repo
    }
  },
  root => root,
  10,
)
```

---

## Cache System

### LRU Cache

```typescript
// Max 50 entries to prevent unbounded growth
// gitDiff calls with dirname(file), so many files = many entries
const cache = new LRUCache<string, string | null>({ max: 50 })
```

### Cached Functions

```typescript
getCachedBranch() // From .git/HEAD
getCachedRemoteUrl() // From .git/config
getCachedHead() // From .git/HEAD (full ref)
getWorktreeCountFromFs() // Count worktrees
isShallowClone() // Check shallow
```

---

## 飞书卡片格式

### Git Utils 卡片

```json
{
  "config": {"wide_screen_mode": true},
  "elements": [
    {
      "tag": "div",
      "text": {
        "tag": "lark_md",
        "content": "**🌳 Git Utils**\n\n---\n\n**Functions**：\n• findGitRoot(startPath) - Walk up to find .git\n• resolveCanonicalRoot(gitRoot) - Resolve worktree\n• getCachedBranch() - Get current branch\n• getCachedRemoteUrl() - Get remote URL\n• getCachedHead() - Get HEAD ref\n• getWorktreeCountFromFs() - Count worktrees\n\n---\n\n**Cache**：LRU(max=50)\n\n---\n\n**Security**：\n• Validate worktree structure\n• Check commondir is absolute\n• Verify .git exists in commonDir"
      }
    }
  ]
}
```

---

## 持久化存储

```json
// memory/git-utils-state.json
{
  "stats": {
    "rootsFound": 0,
    "worktreesResolved": 0
  },
  "lastUpdate": "2026-04-12T11:14:00Z",
  "notes": "Git Utils Skill 创建完成。"
}
```

---

## 与 Claude Code 的差异

| Claude Code | OpenClaw 飞书场景 |
|-------------|------------------|
| git.ts (920+ lines) | Skill + Git |
| findGitRoot() | Root finding |
| resolveCanonicalRoot() | Worktree |
| LRU cache | Cache |

---

## 注意事项

1. **LRU cache**：Max 50 entries (unbounded growth prevention)
2. **Security**：Validate worktree structure (malicious repos)
3. **NFC normalize**：Unicode normalization
4. **.git file**：Can be file (worktree) or directory (regular)
5. **memoizeWithLRU**：Key function + max entries

---

## 自动启用

此 Skill 在 git operations 时自动运行。

---

## 下一步增强

- 飞书 git 集成
- Git analytics
- Git debugging