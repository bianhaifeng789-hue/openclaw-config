# Dangerous Files Auto-Edit Protection Skill

Dangerous Files Auto-Edit Protection - DANGEROUS_FILES .gitconfig/.bashrc/.zshrc/.claude.json + DANGEROUS_DIRECTORIES .git/.vscode/.idea/.claude + normalizeCaseForComparison lowercase + getClaudeSkillScope skill directory + .claude/worktrees/ exception + isDangerousFilePathToAutoEdit UNC/dangerous check + isClaudeConfigFilePath + isSessionPlanFile + isScratchpadPath + isSessionMemoryPath + isProjectDirPath。

## 功能概述

从Claude Code的utils/permissions/filesystem.ts提取的Dangerous files auto-edit protection模式，用于OpenClaw的危险文件自动编辑保护。

## 核心机制

### DANGEROUS_FILES .gitconfig/.bashrc/.zshrc/.claude.json

```typescript
export const DANGEROUS_FILES = [
  '.gitconfig',
  '.gitmodules',
  '.bashrc',
  '.bash_profile',
  '.zshrc',
  '.zprofile',
  '.profile',
  '.ripgreprc',
  '.mcp.json',
  '.claude.json',
] as const
// DANGEROUS_FILES
# Shell config files
# Git config files
# MCP config
# Claude settings
# Code execution vectors
```

### DANGEROUS_DIRECTORIES .git/.vscode/.idea/.claude

```typescript
export const DANGEROUS_DIRECTORIES = [
  '.git',
  '.vscode',
  '.idea',
  '.claude',
] as const
// DANGEROUS_DIRECTORIES
# Git metadata
# IDE settings
# Claude config
# Sensitive configuration
```

### normalizeCaseForComparison lowercase

```typescript
export function normalizeCaseForComparison(path: string): string {
  return path.toLowerCase()
}

// SECURITY: Normalize for case-insensitive comparison to prevent bypassing security
// with paths like .cLauDe/Settings.locaL.json
// normalizeCaseForComparison
# Always lowercase
# Prevent case bypass
# .cLauDe → .claude
```

### getClaudeSkillScope skill directory

```typescript
export function getClaudeSkillScope(
  filePath: string,
): { skillName: string; pattern: string } | null {
  const absolutePath = expandPath(filePath)
  const absolutePathLower = normalizeCaseForComparison(absolutePath)

  const bases = [
    { dir: expandPath(join(getOriginalCwd(), '.claude', 'skills')), prefix: '/.claude/skills/' },
    { dir: expandPath(join(homedir(), '.claude', 'skills')), prefix: '~/.claude/skills/' },
  ]

  for (const { dir, prefix } of bases) {
    const dirLower = normalizeCaseForComparison(dir)
    for (const s of [sep, '/']) {
      if (absolutePathLower.startsWith(dirLower + s.toLowerCase())) {
        const rest = absolutePath.slice(dir.length + s.length)
        const cut = Math.min(rest.indexOf('/'), sep === '\\' ? rest.indexOf('\\') : -1)
        if (cut <= 0) return null  // File must be INSIDE skill dir
        const skillName = rest.slice(0, cut)
        if (!skillName || skillName === '.' || skillName.includes('..')) return null
        if (/[*?[\]]/.test(skillName)) return null  // Reject glob metacharacters
        return { skillName, pattern: prefix + skillName + '/**' }
      }
    }
  }

  return null
}
// getClaudeSkillScope
# skill name extraction
# pattern: /.claude/skills/{name}/**
# Glob metachar reject
# Traversal reject
```

### .claude/worktrees/ exception

```typescript
// Special case: .claude/worktrees/ is a structural path (where Claude stores
// git worktrees), not a user-created dangerous directory. Skip the .claude
// segment when it's followed by 'worktrees'. Any nested .claude directories
// within the worktree (not followed by 'worktrees') are still blocked.
if (dir === '.claude') {
  const nextSegment = pathSegments[i + 1]
  if (nextSegment && normalizeCaseForComparison(nextSegment) === 'worktrees') {
    break // Skip this .claude, continue checking other segments
  }
}
// .claude/worktrees/ exception
# Structural path
# Not dangerous
# Skip .claude when followed by worktrees
```

### isDangerousFilePathToAutoEdit UNC/dangerous check

```typescript
function isDangerousFilePathToAutoEdit(path: string): boolean {
  const absolutePath = expandPath(path)
  const pathSegments = absolutePath.split(sep)
  const fileName = pathSegments.at(-1)

  // Block UNC paths
  if (path.startsWith('\\\\') || path.startsWith('//')) return true

  // Check dangerous directories (case-insensitive)
  for (let i = 0; i < pathSegments.length; i++) {
    const segment = pathSegments[i]!
    const normalizedSegment = normalizeCaseForComparison(segment)

    for (const dir of DANGEROUS_DIRECTORIES) {
      if (normalizedSegment !== normalizeCaseForComparison(dir)) continue

      // Special case: .claude/worktrees/ exception
      if (dir === '.claude') {
        const nextSegment = pathSegments[i + 1]
        if (nextSegment && normalizeCaseForComparison(nextSegment) === 'worktrees') break
      }

      return true
    }
  }

  // Check dangerous configuration files (case-insensitive)
  if (fileName) {
    const normalizedFileName = normalizeCaseForComparison(fileName)
    if ((DANGEROUS_FILES as readonly string[]).some(
      dangerousFile => normalizeCaseForComparison(dangerousFile) === normalizedFileName,
    )) return true
  }

  return false
}
// isDangerousFilePathToAutoEdit
# UNC paths → true
# Dangerous directories → true
# Dangerous files → true
# Case-insensitive
```

### isClaudeConfigFilePath

```typescript
function isClaudeConfigFilePath(filePath: string): boolean {
  if (isClaudeSettingsPath(filePath)) return true

  const commandsDir = join(getOriginalCwd(), '.claude', 'commands')
  const agentsDir = join(getOriginalCwd(), '.claude', 'agents')
  const skillsDir = join(getOriginalCwd(), '.claude', 'skills')

  return (
    pathInWorkingPath(filePath, commandsDir) ||
    pathInWorkingPath(filePath, agentsDir) ||
    pathInWorkingPath(filePath, skillsDir)
  )
}
// isClaudeConfigFilePath
# settings.json
# commands/agents/skills dirs
# Always ask for Claude config
```

### isSessionPlanFile

```typescript
function isSessionPlanFile(absolutePath: string): boolean {
  const expectedPrefix = join(getPlansDirectory(), getPlanSlug())
  const normalizedPath = normalize(absolutePath)
  return normalizedPath.startsWith(expectedPrefix) && normalizedPath.endsWith('.md')
}
// isSessionPlanFile
# {plansDir}/{planSlug}.md
# {plansDir}/{planSlug}-agent-{agentId}.md
# Internal editable
```

### isScratchpadPath

```typescript
function isScratchpadPath(absolutePath: string): boolean {
  if (!isScratchpadEnabled()) return false

  const scratchpadDir = getScratchpadDir()
  const normalizedPath = normalize(absolutePath)
  return normalizedPath === scratchpadDir || normalizedPath.startsWith(scratchpadDir + sep)
}
// isScratchpadPath
# /tmp/claude-{uid}/{cwd}/{session}/scratchpad/
# Internal editable
# Statsig gate enabled
```

### isSessionMemoryPath

```typescript
function isSessionMemoryPath(absolutePath: string): boolean {
  const normalizedPath = normalize(absolutePath)
  return normalizedPath.startsWith(getSessionMemoryDir())
}

export function getSessionMemoryDir(): string {
  return join(getProjectDir(getCwd()), getSessionId(), 'session-memory') + sep
}
// isSessionMemoryPath
# {projectDir}/{sessionId}/session-memory/
# Internal readable
```

### isProjectDirPath

```typescript
function isProjectDirPath(absolutePath: string): boolean {
  const projectDir = getProjectDir(getCwd())
  const normalizedPath = normalize(absolutePath)
  return normalizedPath === projectDir || normalizedPath.startsWith(projectDir + sep)
}
// isProjectDirPath
# ~/.claude/projects/{sanitized-cwd}/
# Internal readable
```

## 实现建议

### OpenClaw适配

1. **dangerousLists**: DANGEROUS_FILES + DANGEROUS_DIRECTORIES pattern
2. **caseNormalize**: normalizeCaseForComparison pattern
3. **skillScope**: getClaudeSkillScope pattern
4. **worktreeException**: .claude/worktrees/ exception pattern
5. **internalPaths**: session/scratchpad/memory/project pattern

### 状态文件示例

```json
{
  "path": ".gitconfig",
  "dangerous": true,
  "reason": "DANGEROUS_FILES",
  "caseNormalized": ".gitconfig"
}
```

## 关键模式

### Shell Config Code Execution Vector

```
.gitconfig + .bashrc + .zshrc + .mcp.json + .claude.json → code execution → DANGEROUS_FILES → auto-edit protection → shell config vector
# shell config code execution vector
# shell startup scripts
# git hooks/config
# MCP/claude settings
```

### Case-Insensitive Lowercase Always

```
normalizeCaseForComparison(path) → lowercase → .cLauDe → .claude → prevent bypass → case-insensitive always lowercase
# case-insensitive lowercase always
# prevent case bypass
# always lowercase
```

### .claude/worktrees Structural Exception

```
.claude followed by worktrees → exception → structural path → not dangerous → skip .claude → worktrees exception
# .claude/worktrees structural exception
# git worktree storage
# not dangerous
```

### Skill Scope Glob Metachar Reject

```
skillName.includes('*?[]') → reject → prevent pattern match all skills → glob metachar reject → security guard
# skill scope glob metachar reject
# prevent pattern matching all
# reject *, ?, [, ]
```

### Internal Paths Session Scratchpad Memory

```
session plan + scratchpad + session memory + project dir → internal paths → auto-edit allowed → internal editable → session scratchpad memory
# internal paths session scratchpad memory
# auto-edit allowed
# internal editable/readable
```

## 借用价值

- ⭐⭐⭐⭐⭐ Shell config code execution vector pattern
- ⭐⭐⭐⭐⭐ Case-insensitive lowercase always pattern
- ⭐⭐⭐⭐⭐ .claude/worktrees structural exception pattern
- ⭐⭐⭐⭐⭐ Skill scope glob metachar reject pattern
- ⭐⭐⭐⭐⭐ Internal paths session scratchpad memory pattern

## 来源

- Claude Code: `utils/permissions/filesystem.ts` (1278+ lines)
- 分析报告: P59-15