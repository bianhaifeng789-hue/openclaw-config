# Tool Validation Config Table Pattern

## Source
Claude Code: `utils/settings/toolValidationConfig.ts` (91 lines)

## Pattern
Config table for tool-specific validation rules - filePatternTools, bashPrefixTools, customValidation.

## Code Example
```typescript
export type ToolValidationConfig = {
  filePatternTools: string[]      // Accept *.ts, src/**, etc.
  bashPrefixTools: string[]       // Accept * anywhere, legacy :* syntax
  customValidation: {
    [toolName: string]: (content: string) => {
      valid: boolean
      error?: string
      suggestion?: string
      examples?: string[]
    }
  }
}

export const TOOL_VALIDATION_CONFIG: ToolValidationConfig = {
  filePatternTools: ['Read', 'Write', 'Edit', 'Glob', 'NotebookRead', 'NotebookEdit'],

  bashPrefixTools: ['Bash'],

  customValidation: {
    WebSearch: content => {
      if (content.includes('*') || content.includes('?')) {
        return {
          valid: false,
          error: 'WebSearch does not support wildcards',
          suggestion: 'Use exact search terms',
          examples: ['WebSearch(claude ai)'],
        }
      }
      return { valid: true }
    },

    WebFetch: content => {
      if (content.includes('://') || content.startsWith('http')) {
        return { valid: false, error: 'Use domain format, not URLs', examples: ['WebFetch(domain:example.com)'] }
      }
      if (!content.startsWith('domain:')) {
        return { valid: false, error: 'Must use domain: prefix', examples: ['WebFetch(domain:*.google.com)'] }
      }
      return { valid: true }
    },
  },
}

// Helper functions
export function isFilePatternTool(toolName: string): boolean {
  return TOOL_VALIDATION_CONFIG.filePatternTools.includes(toolName)
}

export function isBashPrefixTool(toolName: string): boolean {
  return TOOL_VALIDATION_CONFIG.bashPrefixTools.includes(toolName)
}

export function getCustomValidation(toolName: string) {
  return TOOL_VALIDATION_CONFIG.customValidation[toolName]
}
```

## Key Concepts
1. **Category Arrays**: filePatternTools, bashPrefixTools categorize tools
2. **Custom Validation Map**: Tool-specific validation functions
3. **Helper Functions**: isFilePatternTool, isBashPrefixTool, getCustomValidation
4. **Result Type**: { valid, error?, suggestion?, examples? }
5. **Extensible**: Add new tools to arrays, new custom validators to map

## Benefits
- Centralized tool-specific validation rules
- Easy to add new tool categories
- Consistent validation result format

## When to Use
- Permission rule validation with tool-specific syntax
- Multiple tools with different pattern rules
- Extensible validation system

## Related Patterns
- Permission Rule Escape-Aware Validation (permissionValidation.ts)
- Zod Error Formatting (validation.ts)
- Validation Tips Matcher (validationTips.ts)