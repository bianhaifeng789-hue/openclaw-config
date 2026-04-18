# Validation Tips Matcher Pattern

## Source
Claude Code: `utils/settings/validationTips.ts` (169 lines)

## Pattern
Context-based tip matching with suggestion + docLink for specific validation errors.

## Code Example
```typescript
export type ValidationTip = {
  suggestion?: string
  docLink?: string
}

export type TipContext = {
  path: string
  code: ZodIssueCodeType | string
  expected?: string
  received?: unknown
  enumValues?: string[]
  message?: string
  value?: unknown
}

type TipMatcher = {
  matches: (context: TipContext) => boolean
  tip: ValidationTip
}

const DOCUMENTATION_BASE = 'https://code.claude.com/docs/en'

const TIP_MATCHERS: TipMatcher[] = [
  {
    matches: (ctx): boolean =>
      ctx.path === 'permissions.defaultMode' && ctx.code === 'invalid_value',
    tip: {
      suggestion: 'Valid modes: "acceptEdits", "plan", "bypassPermissions", or "default"',
      docLink: `${DOCUMENTATION_BASE}/iam#permission-modes`,
    },
  },
  {
    matches: (ctx): boolean =>
      ctx.path.startsWith('env.') && ctx.code === 'invalid_type',
    tip: {
      suggestion: 'Environment variables must be strings. Wrap numbers in quotes.',
      docLink: `${DOCUMENTATION_BASE}/settings#environment-variables`,
    },
  },
  {
    matches: (ctx): boolean =>
      ctx.path.includes('hooks') && ctx.code === 'invalid_type',
    tip: {
      suggestion: 'Hooks use matcher + hooks array. Matcher is string: tool name, pipe-separated, or empty.',
    },
  },
  {
    matches: (ctx): boolean =>
      ctx.code === 'invalid_value' && ctx.enumValues !== undefined,
    tip: { suggestion: undefined },  // Dynamic: will be filled below
  },
]

const PATH_DOC_LINKS: Record<string, string> = {
  permissions: `${DOCUMENTATION_BASE}/iam`,
  env: `${DOCUMENTATION_BASE}/settings#environment-variables`,
  hooks: `${DOCUMENTATION_BASE}/hooks`,
}

export function getValidationTip(context: TipContext): ValidationTip | null {
  const matcher = TIP_MATCHERS.find(m => m.matches(context))
  if (!matcher) return null

  const tip: ValidationTip = { ...matcher.tip }

  // Dynamic enum suggestion
  if (context.code === 'invalid_value' && context.enumValues && !tip.suggestion) {
    tip.suggestion = `Valid values: ${context.enumValues.map(v => `"${v}"`).join(', ')}`
  }

  // Add path-based doc link if not specified
  if (!tip.docLink && context.path) {
    const pathPrefix = context.path.split('.')[0]
    tip.docLink = PATH_DOC_LINKS[pathPrefix]
  }

  return tip
}
```

## Key Concepts
1. **TipMatcher Array**: matches function + tip object
2. **Path-Specific Tips**: Exact path match (permissions.defaultMode)
3. **Prefix-Based Docs**: path.split('.')[0] → PATH_DOC_LINKS
4. **Dynamic Enum Values**: Fill suggestion from context.enumValues
5. **Documentation Base**: Central URL for all doc links

## Benefits
- Actionable suggestions for common mistakes
- Documentation links guide users to relevant sections
- Extensible: add new matchers without touching validation logic

## When to Use
- User-editable configuration validation
- Complex schemas with many possible errors
- Field-specific guidance requirements

## Related Patterns
- Zod Error Formatting (validation.ts)
- Permission Rule Validation (permissionValidation.ts)
- Settings File Content Validation (validation.ts)