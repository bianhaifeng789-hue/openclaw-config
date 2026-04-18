# Zod Error Formatting Pattern

## Source
Claude Code: `utils/settings/validation.ts` (195 lines)

## Pattern
Format Zod v4 validation errors into human-readable ValidationError with tips.

## Code Example
```typescript
export type ValidationError = {
  file?: string
  path: FieldPath  // Dot notation: "permissions.defaultMode"
  message: string
  expected?: string
  invalidValue?: unknown
  suggestion?: string
  docLink?: string
  mcpErrorMetadata?: { scope: ConfigScope; serverName?: string; severity?: 'fatal' | 'warning' }
}

// Type guards for Zod v4 issue types
function isInvalidTypeIssue(issue: ZodIssue): issue is ZodIssue & {
  code: 'invalid_type'
  expected: string
  input: unknown
} {
  return issue.code === 'invalid_type'
}

function isUnrecognizedKeysIssue(issue: ZodIssue): issue is ZodIssue & {
  code: 'unrecognized_keys'
  keys: string[]
} {
  return issue.code === 'unrecognized_keys'
}

export function formatZodError(error: ZodError, filePath: string): ValidationError[] {
  return error.issues.map((issue): ValidationError => {
    const path = issue.path.map(String).join('.')
    let message = issue.message
    let expected: string | undefined

    if (isInvalidValueIssue(issue)) {
      const enumValues = issue.values.map(v => String(v))
      expected = enumValues.map(v => `"${v}"`).join(', ')
      message = `Invalid value. Expected one of: ${expected}`
    } else if (isInvalidTypeIssue(issue)) {
      const receivedType = getReceivedType(issue.input)
      if (issue.expected === 'object' && receivedType === 'null' && path === '') {
        message = 'Invalid or malformed JSON'  // Special case for top-level null
      } else {
        message = `Expected ${issue.expected}, but received ${receivedType}`
      }
    } else if (isUnrecognizedKeysIssue(issue)) {
      message = `Unrecognized ${plural(issue.keys.length, 'field')}: ${issue.keys.join(', ')}`
    }

    const tip = getValidationTip({ path, code: issue.code, expected, ... })
    return { file: filePath, path, message, expected, suggestion: tip?.suggestion, docLink: tip?.docLink }
  })
}

// Pre-validate to filter bad rules before schema rejects entire file
export function filterInvalidPermissionRules(data: unknown, filePath: string): ValidationError[] {
  const perms = (data as Record).permissions
  if (!perms) return []

  const warnings: ValidationError[] = []
  for (const key of ['allow', 'deny', 'ask']) {
    const rules = perms[key]
    if (!Array.isArray(rules)) continue

    perms[key] = rules.filter(rule => {
      if (typeof rule !== 'string') {
        warnings.push({ path: `permissions.${key}`, message: 'Non-string value removed' })
        return false
      }
      const result = validatePermissionRule(rule)
      if (!result.valid) {
        warnings.push({ path: `permissions.${key}`, message: `Invalid rule "${rule}" skipped` })
        return false
      }
      return true
    })
  }
  return warnings
}
```

## Key Concepts
1. **Type Guards**: Distinguish Zod v4 issue codes (invalid_type, unrecognized_keys, too_small)
2. **Path Dot Notation**: issue.path.map(String).join('.')
3. **Special Cases**: Top-level null → "Invalid or malformed JSON"
4. **Validation Tips**: getValidationTip() adds suggestion + docLink
5. **Pre-Filter**: filterInvalidPermissionRules() before schema validation

## Benefits
- Clear actionable error messages
- Context-specific tips with documentation links
- One bad rule doesn't poison entire settings file

## When to Use
- Zod schema validation for user-editable config
- Settings/configuration file validation
- MCP config validation with scope metadata

## Related Patterns
- Validation Tips Matcher (validationTips.ts)
- Permission Rule Validation (permissionValidation.ts)
- Tool Validation Config (toolValidationConfig.ts)