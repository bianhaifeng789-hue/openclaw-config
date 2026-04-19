# Plugin-Only Policy Lock Pattern

## Source
Claude Code: `utils/settings/pluginOnlyPolicy.ts` (71 lines)

## Pattern
strictPluginOnlyCustomization locks customization surfaces to admin-trusted sources only.

## Code Example
```typescript
export const CUSTOMIZATION_SURFACES = ['skills', 'agents', 'hooks', 'mcp'] as const

export type CustomizationSurface = (typeof CUSTOMIZATION_SURFACES)[number]

/**
 * Check if surface is locked to plugin-only sources.
 * true = lock all surfaces; array = lock only those listed.
 */
export function isRestrictedToPluginOnly(surface: CustomizationSurface): boolean {
  const policy = getSettingsForSource('policySettings')?.strictPluginOnlyCustomization
  if (policy === true) return true  // All surfaces locked
  if (Array.isArray(policy)) return policy.includes(surface)  // Specific surfaces
  return false  // No lock
}

// Admin-trusted sources bypass the lock
const ADMIN_TRUSTED_SOURCES: ReadonlySet<string> = new Set([
  'plugin',       // Gated by strictKnownMarketplaces
  'policySettings', // Admin-controlled by definition
  'built-in',     // Ships with CLI, not user-authored
  'builtin',      // Alternative spelling
  'bundled',      // Bundled skills/agents
])

/**
 * Whether a customization's source is admin-trusted.
 * Pattern at call sites:
 *   const allowed = !isRestrictedToPluginOnly(surface) || isSourceAdminTrusted(item.source)
 */
export function isSourceAdminTrusted(source: string | undefined): boolean {
  return source !== undefined && ADMIN_TRUSTED_SOURCES.has(source)
}

// Usage in hooks registration
const surface = 'hooks'
const allowed = !isRestrictedToPluginOnly(surface) || isSourceAdminTrusted(hook.source)
if (hook.config && allowed) {
  registerHook(hook)
}
```

## Key Concepts
1. **Customization Surfaces**: skills, agents, hooks, mcp - user-extensible areas
2. **Policy Forms**: true = all locked, array = specific locked
3. **Admin-Trusted Sources**: plugin + policySettings + built-in variants
4. **Dual Gate**: !isRestricted OR isSourceAdminTrusted
5. **Plugin Separately Gated**: strictKnownMarketplaces controls plugin trust

## Benefits
- Enterprise can lock user customization surfaces
- Admin-trusted sources (plugins, managed) still work
- Granular control: lock specific surfaces or all

## When to Use
- Enterprise policy enforcement
- User customization control
- Plugin marketplace gating

## Related Patterns
- First Source Wins Policy (mdm/settings.ts)
- Allowed/Denied MCP Server Entry (types.ts)
- Settings Source Cascade (constants.ts)