// @ts-nocheck

/**
 * MCP Validation Pattern - MCP验证
 * 
 * Source: Claude Code utils/mcpValidation.ts
 * Pattern: MCP validation + schema validation + tool validation + security
 */

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  warningsDetails?: Record<string, any>
}

class MCPValidationService {
  private validations: Array<{ type: string; input: any; result: ValidationResult; timestamp: number }> = []

  /**
   * Validate tool arguments
   */
  validateToolArgs(toolName: string, args: Record<string, any>, schema?: any): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    }

    // Validate against schema if provided
    if (schema) {
      for (const [key, spec] of Object.entries(schema)) {
        if (args[key] === undefined && spec.required) {
          result.errors.push(`Missing required argument: ${key}`)
          result.valid = false
        }

        if (args[key] !== undefined && spec.type) {
          const actualType = typeof args[key]
          if (actualType !== spec.type) {
            result.errors.push(`Type mismatch for ${key}: expected ${spec.type}, got ${actualType}`)
            result.valid = false
          }
        }
      }
    }

    // Security validation
    if (this.containsDangerousPattern(args)) {
      result.warnings.push('Arguments contain potentially dangerous patterns')
    }

    this.recordValidation('toolArgs', { toolName, args }, result)

    return result
  }

  /**
   * Check dangerous patterns
   */
  private containsDangerousPattern(args: Record<string, any>): boolean {
    const dangerous = ['eval', 'Function', 'exec', 'spawn', '$(', '${']

    const strValues = Object.values(args)
      .filter(v => typeof v === 'string')

    for (const str of strValues) {
      for (const pattern of dangerous) {
        if (str.includes(pattern)) return true
      }
    }

    return false
  }

  /**
   * Validate resource URI
   */
  validateResourceUri(uri: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    }

    // Check protocol
    if (!uri.startsWith('file://') && !uri.startsWith('http://') && !uri.startsWith('https://')) {
      result.warnings.push('Unknown URI protocol')
    }

    // Check path traversal
    if (uri.includes('..')) {
      result.errors.push('Path traversal detected')
      result.valid = false
    }

    this.recordValidation('resourceUri', { uri }, result)

    return result
  }

  /**
   * Validate server config
   */
  validateServerConfig(config: Record<string, any>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    }

    // Required fields
    if (!config.name) {
      result.errors.push('Missing server name')
      result.valid = false
    }

    if (!config.transport) {
      result.errors.push('Missing transport type')
      result.valid = false
    }

    // Transport validation
    if (config.transport && !['stdio', 'http', 'websocket'].includes(config.transport)) {
      result.errors.push(`Invalid transport type: ${config.transport}`)
      result.valid = false
    }

    this.recordValidation('serverConfig', config, result)

    return result
  }

  /**
   * Record validation
   */
  private recordValidation(type: string, input: any, result: ValidationResult): void {
    this.validations.push({
      type,
      input,
      result,
      timestamp: Date.now()
    })
  }

  /**
   * Get validation history
   */
  getHistory(): Array<{ type: string; input: any; result: ValidationResult; timestamp: number }> {
    return [...this.validations]
  }

  /**
   * Get failed validations
   */
  getFailed(): Array<{ type: string; input: any; result: ValidationResult }> {
    return this.validations.filter(v => !v.result.valid)
  }

  /**
   * Get stats
   */
  getStats(): {
    validationsCount: number
    validCount: number
    invalidCount: number
    warningCount: number
  } {
    const validations = this.validations

    return {
      validationsCount: validations.length,
      validCount: validations.filter(v => v.result.valid).length,
      invalidCount: validations.filter(v => !v.result.valid).length,
      warningCount: validations.filter(v => v.result.warnings.length > 0).length
    }
  }

  /**
   * Clear history
   */
  clear(): void {
    this.validations = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const mcpValidationService = new MCPValidationService()

export default mcpValidationService