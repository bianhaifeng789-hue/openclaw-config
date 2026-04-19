# Sandbox Settings Adapter Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (convertToSandboxRuntimeConfig)

## Pattern
Convert Claude Code settings to SandboxRuntimeConfig - permission rules → network/filesystem restrictions.

## Code Example
```typescript
export function convertToSandboxRuntimeConfig(settings: SettingsJson): SandboxRuntimeConfig {
  const permissions = settings.permissions || {}

  // Network domains from WebFetch rules
  const allowedDomains: string[] = []
  const deniedDomains: string[] = []

  if (shouldAllowManagedSandboxDomainsOnly()) {
    // Only use domains from policySettings
    const policySettings = getSettingsForSource('policySettings')
    for (const domain of policySettings?.sandbox?.network?.allowedDomains || []) {
      allowedDomains.push(domain)
    }
    for (const ruleString of policySettings?.permissions?.allow || []) {
      const rule = permissionRuleValueFromString(ruleString)
      if (rule.toolName === WEB_FETCH_TOOL_NAME && rule.ruleContent?.startsWith('domain:')) {
        allowedDomains.push(rule.ruleContent.substring('domain:'.length))
      }
    }
  } else {
    // Use all sources
    for (const domain of settings.sandbox?.network?.allowedDomains || []) {
      allowedDomains.push(domain)
    }
    for (const ruleString of permissions.allow || []) {
      const rule = permissionRuleValueFromString(ruleString)
      if (rule.toolName === WEB_FETCH_TOOL_NAME && rule.ruleContent?.startsWith('domain:')) {
        allowedDomains.push(rule.ruleContent.substring('domain:'.length))
      }
    }
  }

  // Filesystem paths from Edit/Read rules + sandbox.filesystem settings
  const allowWrite: string[] = ['.', getClaudeTempDir()]
  const denyWrite: string[] = []
  const denyRead: string[] = []

  // Always deny writes to settings.json files (sandbox escape prevention)
  const settingsPaths = SETTING_SOURCES.map(source =>
    getSettingsFilePathForSource(source)
  ).filter((p): p is string => p !== undefined)
  denyWrite.push(...settingsPaths)

  // Iterate each source to resolve paths correctly
  for (const source of SETTING_SOURCES) {
    const sourceSettings = getSettingsForSource(source)
    if (sourceSettings?.permissions) {
      for (const ruleString of sourceSettings.permissions.allow || []) {
        const rule = permissionRuleValueFromString(ruleString)
        if (rule.toolName === FILE_EDIT_TOOL_NAME && rule.ruleContent) {
          allowWrite.push(resolvePathPatternForSandbox(rule.ruleContent, source))
        }
      }
      for (const ruleString of sourceSettings.permissions.deny || []) {
        const rule = permissionRuleValueFromString(ruleString)
        if (rule.toolName === FILE_EDIT_TOOL_NAME && rule.ruleContent) {
          denyWrite.push(resolvePathPatternForSandbox(rule.ruleContent, source))
        }
      }
    }

    // sandbox.filesystem uses standard path semantics (/path = absolute)
    const fs = sourceSettings?.sandbox?.filesystem
    if (fs) {
      for (const p of fs.allowWrite || []) {
        allowWrite.push(resolveSandboxFilesystemPath(p, source))
      }
      for (const p of fs.denyWrite || []) {
        denyWrite.push(resolveSandboxFilesystemPath(p, source))
      }
    }
  }

  return {
    network: { allowedDomains, deniedDomains, allowUnixSockets, ... },
    filesystem: { denyRead, allowRead, allowWrite, denyWrite },
    ignoreViolations: settings.sandbox?.ignoreViolations,
    ripgrep: ripgrepConfig,
  }
}
```

## Key Concepts
1. **Permission Rule → Restriction**: WebFetch(domain:xxx) → allowedDomains
2. **File Edit → allowWrite**: Edit(path) → allowWrite path
3. **File Read → denyRead**: Read(path) in deny → denyRead path
4. **Settings Escape Prevention**: denyWrite settings.json paths
5. **allowManagedDomainsOnly**: Only use policySettings domains
6. **allowManagedReadPathsOnly**: Only use policySettings allowRead

## Benefits
- Permission rules automatically enforced at OS level
- Settings files protected from sandbox escape
- Policy-level domain/read path restrictions

## When to Use
- Sandbox configuration from user settings
- Permission rule enforcement at process level
- Enterprise domain/read path policy

## Related Patterns
- Path Pattern Resolver for Sandbox (sandbox-adapter.ts)
- Git Worktree Main Repo Detection (sandbox-adapter.ts)
- Bare Git Repo Security Scrub (sandbox-adapter.ts)