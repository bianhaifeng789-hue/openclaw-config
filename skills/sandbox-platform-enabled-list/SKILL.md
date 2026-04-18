# Sandbox Platform Enabled List Pattern

## Source
Claude Code: `utils/sandbox/sandbox-adapter.ts` (isPlatformInEnabledList, enabledPlatforms)

## Pattern
Undocumented setting to restrict sandbox to specific platforms - enabledPlatforms array.

## Code Example
```typescript
/**
 * Check if current platform is in enabledPlatforms list.
 * Undocumented setting for enterprise rollout control.
 *
 * When enabledPlatforms is not set, all supported platforms allowed.
 * Empty array disables sandbox on all platforms.
 */
function isPlatformInEnabledList(): boolean {
  try {
    const settings = getInitialSettings()
    const enabledPlatforms = (settings?.sandbox as { enabledPlatforms?: Platform[] })?.enabledPlatforms

    if (enabledPlatforms === undefined) return true  // No restriction

    if (enabledPlatforms.length === 0) return false  // Disabled everywhere

    const currentPlatform = getPlatform()
    return enabledPlatforms.includes(currentPlatform)
  } catch {
    return true  // Default to enabled if can't read settings
  }
}

/**
 * Check if sandboxing is enabled (platform + dependencies + settings)
 */
function isSandboxingEnabled(): boolean {
  if (!isSupportedPlatform()) return false
  if (checkDependencies().errors.length > 0) return false
  if (!isPlatformInEnabledList()) return false  // Platform restriction
  return getSandboxEnabledSetting()
}

/**
 * Get reason why sandbox is unavailable (for user feedback)
 */
function getSandboxUnavailableReason(): string | undefined {
  if (!getSandboxEnabledSetting()) return undefined  // User didn't enable

  if (!isSupportedPlatform()) {
    const platform = getPlatform()
    if (platform === 'wsl') return 'WSL1 not supported (requires WSL2)'
    return `${platform} not supported (requires macOS, Linux, WSL2)`
  }

  if (!isPlatformInEnabledList()) {
    return `${getPlatform()} not in sandbox.enabledPlatforms`
  }

  const deps = checkDependencies()
  if (deps.errors.length > 0) {
    const hint = platform === 'macos'
      ? 'run /sandbox or /doctor for details'
      : 'install missing tools (apt install bubblewrap socat)'
    return `dependencies missing: ${deps.errors.join(', ')} · ${hint}`
  }

  return undefined  // All checks passed
}
```

## Key Concepts
1. **enabledPlatforms Setting**: Undocumented Platform[] array
2. **undefined = All**: No setting means all supported platforms
3. **Empty = None**: Empty array disables everywhere
4. **Platform Enum**: 'macos' | 'linux' | 'wsl'
5. **Unavailable Reason**: User feedback when sandbox.enabled but can't run

## Benefits
- Enterprise rollout control (enable on macOS only initially)
- Clear user feedback when sandbox unavailable
- Platform-specific dependency hints

## When to Use
- Gradual rollout of sandbox to different platforms
- Enterprise policy restricting sandbox to specific OS
- User feedback for sandbox configuration issues

## Related Patterns
- Sandbox Settings Adapter (sandbox-adapter.ts)
- Platform Utils (platform.ts)
- Get Sandbox Unavailable Reason (sandbox-adapter.ts)