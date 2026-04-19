# Teammate Inherited CLI Flags Pattern

## Source
Claude Code: `utils/swarm/spawnUtils.ts` (buildInheritedCliFlags, buildInheritedEnvVars)

## Pattern
Propagate CLI flags + env vars from leader to spawned teammates.

## Code Example
```typescript
const TEAMMATE_ENV_VARS = [
  // API provider selection — without these, teammates default to firstParty
  'CLAUDE_CODE_USE_BEDROCK',
  'CLAUDE_CODE_USE_VERTEX',
  'CLAUDE_CODE_USE_FOUNDRY',
  // Custom API endpoint
  'ANTHROPIC_BASE_URL',
  // Config directory override
  'CLAUDE_CONFIG_DIR',
  // CCR marker
  'CLAUDE_CODE_REMOTE',
  'CLAUDE_CODE_REMOTE_MEMORY_DIR',
  // Proxy vars — upstream traffic through relay
  'HTTPS_PROXY', 'https_proxy',
  'HTTP_PROXY', 'http_proxy',
  'NO_PROXY', 'no_proxy',
  // SSL certs
  'SSL_CERT_FILE',
  'NODE_EXTRA_CA_CERTS',
  'REQUESTS_CA_BUNDLE',
  'CURL_CA_BUNDLE',
] as const

export function buildInheritedCliFlags(options?: {
  planModeRequired?: boolean
  permissionMode?: PermissionMode
}): string {
  const flags: string[] = []

  // Propagate permission mode (but NOT if plan mode required)
  if (!options?.planModeRequired) {
    if (getSessionBypassPermissionsMode()) {
      flags.push('--dangerously-skip-permissions')
    } else if (options?.permissionMode === 'acceptEdits') {
      flags.push('--permission-mode acceptEdits')
    }
  }

  // Propagate --model if explicitly set
  const modelOverride = getMainLoopModelOverride()
  if (modelOverride) {
    flags.push(`--model ${quote([modelOverride])}`)
  }

  // Propagate --settings
  const settingsPath = getFlagSettingsPath()
  if (settingsPath) {
    flags.push(`--settings ${quote([settingsPath])}`)
  }

  // Propagate --plugin-dir for inline plugins
  for (const pluginDir of getInlinePlugins()) {
    flags.push(`--plugin-dir ${quote([pluginDir])}`)
  }

  // Propagate --teammate-mode
  flags.push(`--teammate-mode ${getTeammateModeFromSnapshot()}`)

  // Propagate --chrome/--no-chrome
  const chromeFlagOverride = getChromeFlagOverride()
  if (chromeFlagOverride === true) flags.push('--chrome')
  else if (chromeFlagOverride === false) flags.push('--no-chrome')

  return flags.join(' ')
}

export function buildInheritedEnvVars(): string {
  const envVars = ['CLAUDECODE=1', 'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1']

  for (const key of TEAMMATE_ENV_VARS) {
    const value = process.env[key]
    if (value !== undefined && value !== '') {
      envVars.push(`${key}=${quote([value])}`)
    }
  }

  return envVars.join(' ')
}
```

## Key Concepts
1. **TEAMMATE_ENV_VARS**: Explicit list of forwarded vars (API, proxy, certs)
2. **Plan Mode Override**: Don't inherit bypass permissions if planModeRequired
3. **CLI Flag Propagation**: model, settings, plugin-dir, teammate-mode, chrome
4. **Quote Safety**: shellQuote for safe CLI construction
5. **tmux Login Shell**: New login shell may not inherit parent env

## Benefits
- Teammates use same API provider as leader
- Proxy vars forwarded for credential injection
- Safe shell quoting for spawn commands

## When to Use
- Spawning pane-based teammates (tmux/iTerm2)
- CLI flag propagation to subprocess
- Environment forwarding to isolated processes

## Related Patterns
- Shell Quote Utils (bash/shellQuote.ts)
- Bootstrap State Access (bootstrap/state.ts)
- Teammate Mode Snapshot (teammateModeSnapshot.ts)