# Shell Config Regex Pattern Skill

Shell Config Regex Pattern - CLAUDE_ALIAS_REGEX /^\s*alias\s+claude\s*=/ + filterClaudeAliases + quote/unquote match + getLocalClaudePath compare + ZDOTDIR respect + readFileLines + writeFileLines + datasync flush + findClaudeAlias + findValidClaudeAlias + stat check + ~ expand。

## 功能概述

从Claude Code的utils/shellConfig.ts提取的Shell config regex模式，用于OpenClaw的Shell配置管理。

## 核心机制

### CLAUDE_ALIAS_REGEX /^\s*alias\s+claude\s*=/

```typescript
export const CLAUDE_ALIAS_REGEX = /^\s*alias\s+claude\s*=/
// Regex for claude alias
# /^\s*alias\s+claude\s*=/
# Anchored at start
# Optional whitespace
```

### filterClaudeAliases

```typescript
export function filterClaudeAliases(lines: string[]): { filtered: string[]; hadAlias: boolean } {
  let hadAlias = false
  const filtered = lines.filter(line => {
    if (CLAUDE_ALIAS_REGEX.test(line)) {
      // Extract the alias target
      let match = line.match(/alias\s+claude\s*=\s*["']([^"']+)["']/)  // Try with quotes
      if (!match) {
        match = line.match(/alias\s+claude\s*=\s*([^#\n]+)/)  // Try without quotes
      }
      if (match && match[1]) {
        const target = match[1].trim()
        if (target === getLocalClaudePath()) {
          hadAlias = true
          return false  // Remove this line
        }
      }
    }
    return true
  })
  return { filtered, hadAlias }
}
// Filter claude aliases
# Extract alias target
# Quote/unquote match
# Compare to installer path
```

### quote/unquote match

```typescript
// First try with quotes
let match = line.match(/alias\s+claude\s*=\s*["']([^"']+)["']/)
if (!match) {
  // Try without quotes (capturing until end of line or comment)
  match = line.match(/alias\s+claude\s*=\s*([^#\n]+)/)
}
// Quote/unquote match
# Try quoted first
# Fall back to unquoted
# Handle various formats
```

### getLocalClaudePath compare

```typescript
const target = match[1].trim()
if (target === getLocalClaudePath()) {
  hadAlias = true
  return false  // Remove installer alias
}
// Compare to installer path
# Only remove installer-created alias
# Keep custom user aliases
# Preserve other locations
```

### ZDOTDIR respect

```typescript
export function getShellConfigPaths(options?: ShellConfigOptions): Record<string, string> {
  const home = options?.homedir ?? osHomedir()
  const env = options?.env ?? process.env
  const zshConfigDir = env.ZDOTDIR || home  // Respect ZDOTDIR
  return {
    zsh: join(zshConfigDir, '.zshrc'),
    bash: join(home, '.bashrc'),
    fish: join(home, '.config/fish/config.fish'),
  }
}
// ZDOTDIR respect
# zsh users may set ZDOTDIR
# Respect custom config dir
# Testable via options
```

### readFileLines

```typescript
export async function readFileLines(filePath: string): Promise<string[] | null> {
  try {
    const content = await readFile(filePath, { encoding: 'utf8' })
    return content.split('\n')
  } catch (e: unknown) {
    if (isFsInaccessible(e)) return null
    throw e
  }
}
// Read file lines
# Split by '\n'
# Return null on inaccessible
# Throw unexpected errors
```

### writeFileLines

```typescript
export async function writeFileLines(filePath: string, lines: string[]): Promise<void> {
  const fh = await open(filePath, 'w')
  try {
    await fh.writeFile(lines.join('\n'), { encoding: 'utf8' })
    await fh.datasync()  // Flush to disk
  } finally {
    await fh.close()
  }
}
// Write file lines
# join('\n')
# datasync flush
# Ensure written to disk
```

### datasync flush

```typescript
await fh.datasync()
// Flush to disk
# Ensure file written
# Not just buffered
```

### findClaudeAlias

```typescript
export async function findClaudeAlias(options?: ShellConfigOptions): Promise<string | null> {
  const configs = getShellConfigPaths(options)
  for (const configPath of Object.values(configs)) {
    const lines = await readFileLines(configPath)
    if (!lines) continue
    for (const line of lines) {
      if (CLAUDE_ALIAS_REGEX.test(line)) {
        const match = line.match(/alias\s+claude=["']?([^"'\s]+)/)
        if (match && match[1]) {
          return match[1]
        }
      }
    }
  }
  return null
}
// Find claude alias
# Iterate all config files
# Return first match
```

### findValidClaudeAlias

```typescript
export async function findValidClaudeAlias(options?: ShellConfigOptions): Promise<string | null> {
  const aliasTarget = await findClaudeAlias(options)
  if (!aliasTarget) return null

  // Expand ~ to home directory
  const expandedPath = aliasTarget.startsWith('~') ? aliasTarget.replace('~', home) : aliasTarget

  // Check if target exists and is executable
  try {
    const stats = await stat(expandedPath)
    if (stats.isFile() || stats.isSymbolicLink()) {
      return aliasTarget
    }
  } catch {
    // Target doesn't exist
  }
  return null
}
// Find valid alias
# Expand ~ to home
# stat check exists
# File or symlink
```

### stat check

```typescript
const stats = await stat(expandedPath)
if (stats.isFile() || stats.isSymbolicLink()) {
  return aliasTarget
}
// stat check
# File or symlink
# Target exists
```

### ~ expand

```typescript
const expandedPath = aliasTarget.startsWith('~') ? aliasTarget.replace('~', home) : aliasTarget
// Expand ~ to home
# ~ → home directory
# Shell convention
```

## 实现建议

### OpenClaw适配

1. **shellConfigRegex**: CLAUDE_ALIAS_REGEX pattern
2. **filterAliases**: filterClaudeAliases pattern
3. **zdotdirRespect**: ZDOTDIR respect pattern
4. **datasyncFlush**: writeFileLines + datasync pattern
5. **aliasValidCheck**: findValidClaudeAlias + stat check pattern

### 状态文件示例

```json
{
  "alias": "claude='~/.claude/local/claude'",
  "hadAlias": true,
  "configFiles": [".zshrc", ".bashrc", "config.fish"]
}
```

## 关键模式

### Quote/Unquote Match Try

```
match(/alias\s+claude\s*=\s*["']([^"']+)["']/) → quoted | match(/alias\s+claude\s*=\s*([^#\n]+)/) → unquoted → try both
# quote/unquote match try
# 先try quoted
# 再try unquoted
```

### Compare to Installer Path Only

```
target === getLocalClaudePath() → remove | !== → keep → only remove installer alias
# compare to installer path only
# 只remove installer-created alias
# keep custom user aliases
```

### ZDOTDIR Respect Custom Config

```
env.ZDOTDIR || home → zsh config dir → respect custom → testable via options
# ZDOTDIR respect custom config
# zsh用户可能设置ZDOTDIR
# testable options
```

### datasync Flush to Disk

```
fh.writeFile() → fh.datasync() → flush to disk → ensure written → not just buffered
# datasync flush to disk
# 确保文件written
# not just buffered
```

### ~ Expand + stat Check Valid

```
~ → replace('~', home) → stat check → isFile || isSymbolicLink → valid alias
# ~ expand + stat check
# expand ~ to home
# stat check exists
```

## 借用价值

- ⭐⭐⭐⭐⭐ Quote/unquote match try pattern
- ⭐⭐⭐⭐⭐ Compare to installer path only pattern
- ⭐⭐⭐⭐⭐ ZDOTDIR respect custom config pattern
- ⭐⭐⭐⭐⭐ datasync flush to disk pattern
- ⭐⭐⭐⭐⭐ ~ expand + stat check valid pattern

## 来源

- Claude Code: `utils/shellConfig.ts` (143 lines)
- 分析报告: P57-2