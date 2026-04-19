# Path Pattern Resolver for Sandbox Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (resolvePathPatternForSandbox, resolveSandboxFilesystemPath)

## Pattern
Resolve Claude Code-specific path patterns for sandbox-runtime - // prefix, / prefix, ~ expansion.

## Code Example
```typescript
/**
 * Resolve Claude Code-specific path patterns.
 *
 * Claude Code conventions:
 * - `//path` → absolute from filesystem root (becomes `/path`)
 * - `/path` → relative to settings file directory (becomes `$SETTINGS_DIR/path`)
 * - `~/path` → passed through (sandbox-runtime handles)
 * - `./path` or `path` → passed through (sandbox-runtime handles)
 */
export function resolvePathPatternForSandbox(pattern: string, source: SettingSource): string {
  // // prefix - absolute from root (CC-specific)
  if (pattern.startsWith('//')) {
    return pattern.slice(1)  // "//.aws/**" → "/.aws/**"
  }

  // / prefix - relative to settings file directory (CC-specific)
  if (pattern.startsWith('/') && !pattern.startsWith('//')) {
    const root = getSettingsRootPathForSource(source)
    return resolve(root, pattern.slice(1))  // "/foo/**" → "${root}/foo/**"
  }

  // Other patterns pass through (~/, ./, bare)
  return pattern
}

/**
 * Resolve sandbox.filesystem.* paths (standard semantics, not permission-rule).
 *
 * Standard path semantics:
 * - `/path` → absolute path (as written, NOT settings-relative) - #30067 fix
 * - `~/path` → expanded to home directory
 * - `./path` or `path` → relative to settings file directory
 * - `//path` → absolute (legacy permission-rule syntax, kept for compat)
 */
export function resolveSandboxFilesystemPath(pattern: string, source: SettingSource): string {
  // Legacy permission-rule escape: //path → /path
  if (pattern.startsWith('//')) return pattern.slice(1)

  // Expand ~ here (sandbox-runtime doesn't call normalizePathForSandbox on allowWrite)
  return expandPath(pattern, getSettingsRootPathForSource(source))
}

// Usage in convertToSandboxRuntimeConfig
for (const source of SETTING_SOURCES) {
  const sourceSettings = getSettingsForSource(source)
  if (sourceSettings?.permissions) {
    for (const ruleString of sourceSettings.permissions.allow || []) {
      const rule = permissionRuleValueFromString(ruleString)
      if (rule.toolName === FILE_EDIT_TOOL_NAME && rule.ruleContent) {
        allowWrite.push(resolvePathPatternForSandbox(rule.ruleContent, source))
      }
    }
  }

  const fs = sourceSettings?.sandbox?.filesystem
  if (fs) {
    for (const p of fs.allowWrite || []) {
      allowWrite.push(resolveSandboxFilesystemPath(p, source))  // Standard semantics
    }
  }
}
```

## Key Concepts
1. **Permission Rule Convention**: `/path` = settings-relative, `//path` = absolute
2. **Sandbox Filesystem Convention**: `/path` = absolute (standard)
3. **#30067 Fix**: Different semantics for permission rules vs sandbox.filesystem
4. **Settings Root**: getSettingsRootPathForSource(source) for relative resolution
5. **Tilde Expansion**: expandPath() handles ~ for sandbox.filesystem

## Benefits
- Correct path resolution based on context
- Legacy compatibility for // prefix escape
- Security: settings-relative vs absolute distinction

## When to Use
- Permission rule path resolution
- Sandbox filesystem path configuration
- Multi-source path pattern handling

## Related Patterns
- Sandbox Settings Adapter (sandbox-adapter.ts)
- Settings Root Path for Source (settings.ts)
- Permission Rule Value Parser (permissionRuleParser.ts)