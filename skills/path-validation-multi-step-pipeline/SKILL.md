# Path Validation Multi-Step Pipeline Skill

Path Validation Multi-Step Pipeline - isPathAllowed deny→internal→safety→workingDir→sandbox→allow + validatePath UNC/tilde/shell expansion block + isDangerousRemovalPath wildcard/root/home check + validateGlobPattern base directory + expandTilde ~/ + getGlobBaseDirectory + isPathInSandboxWriteAllowlist + precomputedPathsToCheck optimization + containsVulnerableUncPath + containsPathTraversal。

## 功能概述

从Claude Code的utils/permissions/pathValidation.ts提取的Path validation multi-step pipeline模式，用于OpenClaw的文件路径权限验证。

## 核心机制

### isPathAllowed deny→internal→safety→workingDir→sandbox→allow

```typescript
export function isPathAllowed(
  resolvedPath: string,
  context: ToolPermissionContext,
  operationType: FileOperationType,
  precomputedPathsToCheck?: readonly string[],
): PathCheckResult {
  // 1. Check deny rules first (they take precedence)
  const denyRule = matchingRuleForInput(resolvedPath, context, permissionType, 'deny')
  if (denyRule !== null) return { allowed: false, decisionReason: { type: 'rule', rule: denyRule } }

  // 2. Check internal editable paths (plan files, scratchpad, agent memory)
  if (operationType !== 'read') {
    const internalEditResult = checkEditableInternalPath(resolvedPath, {})
    if (internalEditResult.behavior === 'allow') return { allowed: true, decisionReason: internalEditResult.decisionReason }
  }

  // 2.5. Check comprehensive safety validations
  if (operationType !== 'read') {
    const safetyCheck = checkPathSafetyForAutoEdit(resolvedPath, precomputedPathsToCheck)
    if (!safetyCheck.safe) return { allowed: false, decisionReason: { type: 'safetyCheck', reason: safetyCheck.message } }
  }

  // 3. Check if path is in allowed working directory
  const isInWorkingDir = pathInAllowedWorkingPath(resolvedPath, context, precomputedPathsToCheck)
  if (isInWorkingDir && (operationType === 'read' || context.mode === 'acceptEdits')) return { allowed: true }

  // 3.5. Check internal readable paths
  if (operationType === 'read') {
    const internalReadResult = checkReadableInternalPath(resolvedPath, {})
    if (internalReadResult.behavior === 'allow') return { allowed: true, decisionReason: internalReadResult.decisionReason }
  }

  // 3.7. Check sandbox write allowlist
  if (operationType !== 'read' && !isInWorkingDir && isPathInSandboxWriteAllowlist(resolvedPath)) return { allowed: true }

  // 4. Check allow rules
  const allowRule = matchingRuleForInput(resolvedPath, context, permissionType, 'allow')
  if (allowRule !== null) return { allowed: true, decisionReason: { type: 'rule', rule: allowRule } }

  // 5. Path is not allowed
  return { allowed: false }
}
// isPathAllowed pipeline
# 1 deny rules first
# 2 internal editable
# 2.5 safety checks
# 3 working directory
# 3.5 internal readable
# 3.7 sandbox allowlist
# 4 allow rules
# 5 not allowed
```

### validatePath UNC/tilde/shell expansion block

```typescript
export function validatePath(
  path: string,
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  operationType: FileOperationType,
): ResolvedPathCheckResult {
  const cleanPath = expandTilde(path.replace(/^['"]|['"]$/g, ''))

  // SECURITY: Block UNC paths that could leak credentials
  if (containsVulnerableUncPath(cleanPath)) return { allowed: false, resolvedPath: cleanPath, decisionReason: { type: 'other', reason: 'UNC network paths require manual approval' } }

  // SECURITY: Reject tilde variants (~user, ~+, ~-, ~N)
  if (cleanPath.startsWith('~')) return { allowed: false, ... }

  // SECURITY: Reject paths containing shell expansion syntax ($VAR, %VAR%, =cmd)
  if (cleanPath.includes('$') || cleanPath.includes('%') || cleanPath.startsWith('=')) return { allowed: false, ... }

  // ... resolve path and check
}
// validatePath blocks
# UNC paths → block
# ~user/~+/~- → block
# $/%/= shell expansion → block
# SECURITY checks
```

### isDangerousRemovalPath wildcard/root/home check

```typescript
export function isDangerousRemovalPath(resolvedPath: string): boolean {
  const forwardSlashed = resolvedPath.replace(/[\\/]+/g, '/')

  // Wildcard '*' or ending with '/*'
  if (forwardSlashed === '*' || forwardSlashed.endsWith('/*')) return true

  // Root directory '/'
  const normalizedPath = forwardSlashed === '/' ? forwardSlashed : forwardSlashed.replace(/\/$/, '')
  if (normalizedPath === '/') return true

  // Windows drive root 'C:\'
  if (WINDOWS_DRIVE_ROOT_REGEX.test(normalizedPath)) return true

  // Home directory
  const normalizedHome = homedir().replace(/[\\/]+/g, '/')
  if (normalizedPath === normalizedHome) return true

  // Direct children of root: /usr, /tmp, /etc
  const parentDir = dirname(normalizedPath)
  if (parentDir === '/') return true

  // Windows drive children: C:\Windows, C:\Users
  if (WINDOWS_DRIVE_CHILD_REGEX.test(normalizedPath)) return true

  return false
}
// isDangerousRemovalPath
# wildcard * → dangerous
# root / → dangerous
# home ~ → dangerous
# direct children of root → dangerous
```

### validateGlobPattern base directory

```typescript
export function validateGlobPattern(
  cleanPath: string,
  cwd: string,
  toolPermissionContext: ToolPermissionContext,
  operationType: FileOperationType,
): ResolvedPathCheckResult {
  if (containsPathTraversal(cleanPath)) {
    // For patterns with path traversal, resolve the full path
    const absolutePath = isAbsolute(cleanPath) ? cleanPath : resolve(cwd, cleanPath)
    const { resolvedPath, isCanonical } = safeResolvePath(getFsImplementation(), absolutePath)
    const result = isPathAllowed(resolvedPath, toolPermissionContext, operationType, isCanonical ? [resolvedPath] : undefined)
    return { allowed: result.allowed, resolvedPath, decisionReason: result.decisionReason }
  }

  const basePath = getGlobBaseDirectory(cleanPath)
  const absoluteBasePath = isAbsolute(basePath) ? basePath : resolve(cwd, basePath)
  // ... validate base path
}
// validateGlobPattern
# Extract base directory
# Validate base path
# Path traversal special case
```

### expandTilde ~/ only

```typescript
export function expandTilde(path: string): string {
  if (
    path === '~' ||
    path.startsWith('~/') ||
    (process.platform === 'win32' && path.startsWith('~\\'))
  ) {
    return homedir() + path.slice(1)
  }
  return path
}
// expandTilde
# ~ and ~/ only
# ~user NOT supported
# SECURITY reason
```

### getGlobBaseDirectory

```typescript
export function getGlobBaseDirectory(path: string): string {
  const globMatch = path.match(GLOB_PATTERN_REGEX)
  if (!globMatch || globMatch.index === undefined) return path

  // Get everything before the first glob character
  const beforeGlob = path.substring(0, globMatch.index)

  // Find the last directory separator
  const lastSepIndex =
    getPlatform() === 'windows'
      ? Math.max(beforeGlob.lastIndexOf('/'), beforeGlob.lastIndexOf('\\'))
      : beforeGlob.lastIndexOf('/')
  if (lastSepIndex === -1) return '.'

  return beforeGlob.substring(0, lastSepIndex) || '/'
}
// getGlobBaseDirectory
# Before first glob char
# Last separator
# Base directory
```

### isPathInSandboxWriteAllowlist

```typescript
export function isPathInSandboxWriteAllowlist(resolvedPath: string): boolean {
  if (!SandboxManager.isSandboxingEnabled()) return false

  const { allowOnly, denyWithinAllow } = SandboxManager.getFsWriteConfig()

  // Resolve symlinks for symmetric comparison
  const pathsToCheck = getPathsForPermissionCheck(resolvedPath)
  const resolvedAllow = allowOnly.flatMap(getResolvedSandboxConfigPath)
  const resolvedDeny = denyWithinAllow.flatMap(getResolvedSandboxConfigPath)

  return pathsToCheck.every(p => {
    for (const denyPath of resolvedDeny) {
      if (pathInWorkingPath(p, denyPath)) return false
    }
    return resolvedAllow.some(allowPath => pathInWorkingPath(p, allowPath))
  })
}
// isPathInSandboxWriteAllowlist
# allowOnly + denyWithinAllow
# deny takes precedence
# Resolve symlinks
```

### precomputedPathsToCheck optimization

```typescript
/**
 * @param precomputedPathsToCheck - Optional cached result of
 *   `getPathsForPermissionCheck(resolvedPath)`. When `resolvedPath` is the
 *   output of `realpathSync` (canonical path, all symlinks resolved), this
 *   is trivially `[resolvedPath]` and passing it here skips 5 redundant
 *   syscalls per inner check.
 */
export function isPathAllowed(
  resolvedPath: string,
  context: ToolPermissionContext,
  operationType: FileOperationType,
  precomputedPathsToCheck?: readonly string[],
): PathCheckResult
// precomputedPathsToCheck
# Optional cache
# Skip redundant syscalls
# Performance optimization
```

### containsVulnerableUncPath

```typescript
// imported from shell/readOnlyCommandValidation.ts
// SECURITY: Block UNC paths that could leak credentials
if (containsVulnerableUncPath(cleanPath)) return { allowed: false, ... }
// containsVulnerableUncPath
# UNC network paths
# Credential leak
# WebDAV attacks
```

### containsPathTraversal

```typescript
// imported from path.ts
if (containsPathTraversal(cleanPath)) {
  // Special handling for patterns with path traversal
}
// containsPathTraversal
# .. segments
# Path traversal attack
# SECURITY check
```

## 实现建议

### OpenClaw适配

1. **stepPipeline**: deny→internal→safety→working→sandbox→allow pattern
2. **securityBlocks**: UNC/tilde/shell expansion pattern
3. **dangerousRemoval**: wildcard/root/home pattern
4. **globBase**: getGlobBaseDirectory pattern
5. **sandboxAllowlist**: allowOnly + denyWithinAllow pattern

### 状态文件示例

```json
{
  "resolvedPath": "/tmp/test",
  "operationType": "write",
  "allowed": true,
  "step": "sandboxAllowlist"
}
```

## 关键模式

### deny→internal→safety→working→sandbox→allow Pipeline

```
1 deny → 2 internal editable → 2.5 safety → 3 working dir → 3.5 internal readable → 3.7 sandbox → 4 allow → 5 not allowed → pipeline → precedence
# deny→internal→safety→working→sandbox→allow pipeline
# precedence order
# 7 steps
```

### UNC/Tilde Shell Expansion Block

```
containsVulnerableUncPath | ~user/~+/~- | $/%/= → block → security checks → prevent TOCTOU → UNC/tilde/shell expansion
# UNC/tilde/shell expansion block
# prevent TOCTOU vulnerability
# shell expansion gap
```

### Dangerous Removal Wildcard Root Home

```
wildcard * | root / | home ~ | direct children of root → dangerous → rm/rmdir → prevent accidental deletion → dangerous removal
# dangerous removal wildcard root home
# prevent accidental deletion
# wildcard matching all
```

### Glob Base Directory Before First Glob

```
getGlobBaseDirectory → before first glob char → last separator → base directory → validate base → glob base directory
# glob base directory before first glob
# extract base for validation
```

### Sandbox denyWithinAllow Takes Precedence

```
allowOnly + denyWithinAllow → deny first → denyWithinAllow precedence → .claude/settings.json blocked → sandbox deny precedence
# sandbox denyWithinAllow takes precedence
# deny within allow list
# .claude blocked even if parent allowed
```

## 借用价值

- ⭐⭐⭐⭐⭐ deny→internal→safety→working→sandbox→allow pipeline pattern
- ⭐⭐⭐⭐⭐ UNC/tilde/shell expansion block pattern
- ⭐⭐⭐⭐⭐ Dangerous removal wildcard root home pattern
- ⭐⭐⭐⭐⭐ Glob base directory before first glob pattern
- ⭐⭐⭐⭐⭐ Sandbox denyWithinAllow takes precedence pattern

## 来源

- Claude Code: `utils/permissions/pathValidation.ts` (387 lines)
- 分析报告: P59-14