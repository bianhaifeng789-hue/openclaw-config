# Permission Rule Escape-Aware Validation Pattern

## Source
Claude Code: `utils/settings/permissionValidation.ts` (269 lines)

## Pattern
Escape-aware validation for permission rules - count unescaped chars, detect empty parens.

## Code Example
```typescript
// Check if character at index is escaped (odd backslashes before)
function isEscaped(str: string, index: number): boolean {
  let backslashCount = 0
  let j = index - 1
  while (j >= 0 && str[j] === '\\') {
    backslashCount++
    j--
  }
  return backslashCount % 2 !== 0  // Odd = escaped
}

// Count unescaped occurrences
function countUnescapedChar(str: string, char: string): number {
  let count = 0
  for (let i = 0; i < str.length; i++) {
    if (str[i] === char && !isEscaped(str, i)) {
      count++
    }
  }
  return count
}

// Detect unescaped empty parentheses "()"
function hasUnescapedEmptyParens(str: string): boolean {
  for (let i = 0; i < str.length - 1; i++) {
    if (str[i] === '(' && str[i + 1] === ')') {
      if (!isEscaped(str, i)) return true
    }
  }
  return false
}

export function validatePermissionRule(rule: string): {
  valid: boolean
  error?: string
  suggestion?: string
  examples?: string[]
} {
  // Parentheses matching (only unescaped)
  const openCount = countUnescapedChar(rule, '(')
  const closeCount = countUnescapedChar(rule, ')')
  if (openCount !== closeCount) {
    return { valid: false, error: 'Mismatched parentheses' }
  }

  // Empty parens check (escape-aware)
  if (hasUnescapedEmptyParens(rule)) {
    const toolName = rule.substring(0, rule.indexOf('('))
    return {
      valid: false,
      error: 'Empty parentheses',
      suggestion: `Use "${toolName}" without parens or "${toolName}(pattern)"`,
      examples: [toolName, `${toolName}(some-pattern)`],
    }
  }

  // MCP validation - no patterns allowed
  const mcpInfo = mcpInfoFromString(parsed.toolName)
  if (mcpInfo && parsed.ruleContent !== undefined) {
    return {
      valid: false,
      error: 'MCP rules do not support patterns in parentheses',
      examples: [`mcp__${mcpInfo.serverName}`, `mcp__${mcpInfo.serverName}__*`],
    }
  }

  // Tool name starts with uppercase
  if (parsed.toolName[0] !== parsed.toolName[0]?.toUpperCase()) {
    return { valid: false, suggestion: `Use "${capitalize(parsed.toolName)}"` }
  }

  // Bash :* must be at end (legacy prefix syntax)
  if (content.includes(':*') && !content.endsWith(':*')) {
    return { valid: false, error: ':* pattern must be at end' }
  }

  // File tools: no :* syntax
  if (isFilePatternTool(parsed.toolName) && content.includes(':*')) {
    return { valid: false, error: ':* is only for Bash prefix rules' }
  }
}
```

## Key Concepts
1. **Escape Detection**: Odd backslashes = escaped character
2. **Unescaped Counting**: Only count non-escaped chars for matching
3. **Empty Parens Detection**: Adjacent unescaped ( ) = error
4. **Tool-Specific Rules**: Bash :* syntax, File glob patterns, WebFetch domain:
5. **MCP Special Case**: No patterns in parentheses, only server-level

## Benefits
- Correct handling of escaped special chars
- Tool-specific validation with helpful examples
- Pre-filter bad rules before schema validation

## When to Use
- Permission rule validation
- Pattern matching with escape characters
- Tool-specific syntax validation

## Related Patterns
- Tool Validation Config (toolValidationConfig.ts)
- Zod Error Formatting (validation.ts)
- Shell Permission Wildcard Pattern (shellRuleMatching.ts)