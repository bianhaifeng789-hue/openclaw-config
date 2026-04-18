# Linux Glob Pattern Warning Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (getLinuxGlobPatternWarnings)

## Pattern
Warn about glob patterns in permission rules on Linux/WSL (bubblewrap doesn't support globs).

## Code Example
```typescript
/**
 * Get glob patterns that won't work fully on Linux/WSL.
 * Bubblewrap doesn't support glob matching - only exact paths.
 */
function getLinuxGlobPatternWarnings(): string[] {
  const platform = getPlatform()
  if (platform !== 'linux' && platform !== 'wsl') return []

  try {
    const settings = getSettings_DEPRECATED()
    if (!settings?.sandbox?.enabled) return []  // Only warn if sandbox enabled

    const permissions = settings?.permissions || {}
    const warnings: string[] = []

    // Check if path has glob characters (excluding trailing /**)
    const hasGlobs = (path: string): boolean => {
      const stripped = path.replace(/\/\*\*$/, '')  // Allow trailing /**
      return /[*?[\]]/.test(stripped)
    }

    // Check all permission rules for glob patterns
    for (const ruleString of [...(permissions.allow || []), ...(permissions.deny || [])]) {
      const rule = permissionRuleValueFromString(ruleString)
      if (
        (rule.toolName === FILE_EDIT_TOOL_NAME || rule.toolName === FILE_READ_TOOL_NAME) &&
        rule.ruleContent &&
        hasGlobs(rule.ruleContent)
      ) {
        warnings.push(ruleString)  // Won't work on Linux/WSL
      }
    }

    return warnings
  } catch {
    return []
  }
}

// Usage in /status or /sandbox command
const globWarnings = SandboxManager.getLinuxGlobPatternWarnings()
if (globWarnings.length > 0) {
  console.log('⚠️ Glob patterns may not work on Linux/WSL:')
  for (const warning of globWarnings) {
    console.log(`  - ${warning}`)
  }
}
```

## Key Concepts
1. **Platform Check**: Only warn on Linux/WSL
2. **Sandbox Enabled**: Only warn if sandbox.enabled true
3. **Glob Detection**: `*?[]` characters (excluding trailing `/**`)
4. **Permission Rules**: Check Edit and Read tool rules
5. **User Feedback**: Inform user about limitation

## Benefits
- Users know glob limitations on Linux
- Clear actionable warnings
- Only relevant when sandbox enabled

## When to Use
- Platform-specific feature warnings
- User education for sandbox limitations
- Configuration validation feedback

## Related Patterns
- Sandbox Settings Adapter (sandbox-adapter.ts)
- Permission Rule Escape-Aware Validation (permissionValidation.ts)
- Platform Utils (platform.ts)