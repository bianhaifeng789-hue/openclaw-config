# Backward-Compatible Schema Pattern

## Source
Claude Code: `utils/settings/types.ts` (header comment + SettingsSchema)

## Pattern
Zod schema designed for backward compatibility - new fields optional, old fields preserved.

## Code Example
```typescript
/**
 * ⚠️ BACKWARD COMPATIBILITY NOTICE ⚠️
 *
 * ✅ ALLOWED CHANGES:
 * - Adding new optional fields (always use .optional())
 * - Adding new enum values (keeping existing ones)
 * - Adding new properties to objects
 * - Making validation more permissive
 * - Using union types for gradual migration
 *
 * ❌ BREAKING CHANGES TO AVOID:
 * - Removing fields (mark as deprecated instead)
 * - Removing enum values
 * - Making optional fields required
 * - Making types more restrictive
 * - Renaming fields without keeping old name
 *
 * TO ENSURE BACKWARD COMPATIBILITY:
 * 1. Run: npm run test:file -- test/utils/settings/backward-compatibility.test.ts
 * 2. If tests fail, you've introduced a breaking change
 */

export const SettingsSchema = lazySchema(() =>
  z.object({
    $schema: z.literal(CLAUDE_CODE_SETTINGS_SCHEMA_URL).optional(),
    apiKeyHelper: z.string().optional(),
    env: EnvironmentVariablesSchema().optional(),
    permissions: PermissionsSchema().optional().passthrough(),  // Preserve unknown keys
    // ... all fields optional
  })
)

// Permissions schema uses .passthrough() to preserve unknown fields
export const PermissionsSchema = lazySchema(() =>
  z.object({
    allow: z.array(PermissionRuleSchema()).optional(),
    deny: z.array(PermissionRuleSchema()).optional(),
    // ...
  }).passthrough()  // Keep unrecognized permission keys
)

// Test example from backward-compatibility.test.ts
const BACKWARD_COMPATIBILITY_CONFIGS = [
  { version: '1.0', settings: { permissions: { allow: ['Bash(npm)'] } } },
  { version: '1.1', settings: { permissions: { allow: ['Bash(npm)'], newField: 'value' } } },
  // New optional field should not break old configs
]
```

## Key Concepts
1. **All Fields Optional**: Never break by making required
2. **.passthrough()**: Preserve unknown keys in nested objects
3. **Union Migration**: z.union([oldType, newType]) for gradual change
4. **Deprecate Not Remove**: Keep old fields, mark deprecated
5. **Backward-Compat Tests**: Dedicated test file for regression

## Benefits
- Old settings files continue to work
- Users can upgrade CLI without editing configs
- Invalid fields preserved for user to fix manually

## When to Use
- User-editable configuration schemas
- Long-lived settings files
- CLI tools with version upgrades

## Related Patterns
- Lazy Schema Pattern (lazySchema.ts)
- Zod Error Formatting (validation.ts)
- Validation Tips Matcher (validationTips.ts)