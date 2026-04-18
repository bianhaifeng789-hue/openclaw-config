# Allowed/Denied MCP Server Entry Pattern

## Source
Claude Code: `utils/settings/types.ts` (AllowedMcpServerEntrySchema, DeniedMcpServerEntrySchema)

## Pattern
MCP server allowlist/denylist with mutually exclusive matching fields + Zod refine validation.

## Code Example
```typescript
export const AllowedMcpServerEntrySchema = lazySchema(() =>
  z.object({
    serverName: z.string()
      .regex(/[a-zA-Z0-9_-]+/, 'Server name: letters, numbers, hyphens, underscores')
      .optional()
      .describe('Name of MCP server users can configure'),

    serverCommand: z.array(z.string())
      .min(1, 'Command must have at least one element')
      .optional()
      .describe('Command array [cmd, ...args] to match stdio servers'),

    serverUrl: z.string()
      .optional()
      .describe('URL pattern with wildcards: https://*.example.com/*'),
  }).refine(
    data => {
      const defined = count([
        data.serverName !== undefined,
        data.serverCommand !== undefined,
        data.serverUrl !== undefined,
      ], Boolean)
      return defined === 1  // Exactly one field must be defined
    },
    { message: 'Entry must have exactly one of "serverName", "serverCommand", or "serverUrl"' }
  )
)

// DeniedMcpServerEntrySchema is identical structure
export const DeniedMcpServerEntrySchema = lazySchema(() =>
  z.object({
    serverName: z.string().regex(/[a-zA-Z0-9_-]+/).optional(),
    serverCommand: z.array(z.string()).min(1).optional(),
    serverUrl: z.string().optional(),
  }).refine(/* same exactly-one check */)
)

// Usage in SettingsSchema
mcpAllowedServers: z.array(AllowedMcpServerEntrySchema())
  .optional()
  .describe('Enterprise allowlist of MCP servers'),

mcpDeniedServers: z.array(DeniedMcpServerEntrySchema())
  .optional()
  .describe('Enterprise denylist of blocked MCP servers'),
```

## Key Concepts
1. **Three Match Fields**: serverName, serverCommand, serverUrl
2. **Mutually Exclusive**: z.refine ensures exactly one defined
3. **Name Regex**: Letters, numbers, hyphens, underscores only
4. **Command Array**: min(1) - at least command element
5. **URL Wildcards**: *.example.com/* patterns

## Benefits
- Flexible matching: by name, command, or URL
- Clear error message for multiple fields
- Enterprise control over MCP server access

## When to Use
- Enterprise MCP server policy
- Allowlist/denylist configuration
- Multiple matching strategies

## Related Patterns
- Plugin-Only Policy Lock (pluginOnlyPolicy.ts)
- Backward-Compatible Schema (types.ts)
- Zod Error Formatting (validation.ts)