// @ts-nocheck

/**
 * Error Classification Pattern - 错误分类器
 * 
 * Source: Claude Code utils/errors.ts + utils/errorLogSink.ts
 * Pattern: classifyError + error categories + isRetryable + recoverability
 */

type ErrorCategory = 'network' | 'auth' | 'validation' | 'resource' | 'timeout' | 'unknown'

interface ClassifiedError {
  category: ErrorCategory
  originalError: Error
  isRetryable: boolean
  isTransient: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  suggestedAction?: string
}

class ErrorClassification {
  /**
   * Classify error by type
   */
  classify(error: Error): ClassifiedError {
    const message = error.message.toLowerCase()
    const code = (error as any).code ?? ''

    // Network errors
    if (this.isNetworkError(message, code)) {
      return {
        category: 'network',
        originalError: error,
        isRetryable: true,
        isTransient: true,
        severity: 'medium',
        suggestedAction: 'Retry with exponential backoff'
      }
    }

    // Auth errors
    if (this.isAuthError(message, code)) {
      return {
        category: 'auth',
        originalError: error,
        isRetryable: false,
        isTransient: false,
        severity: 'high',
        suggestedAction: 'Check credentials or re-authenticate'
      }
    }

    // Validation errors
    if (this.isValidationError(message, code)) {
      return {
        category: 'validation',
        originalError: error,
        isRetryable: false,
        isTransient: false,
        severity: 'low',
        suggestedAction: 'Fix input data'
      }
    }

    // Resource errors
    if (this.isResourceError(message, code)) {
      return {
        category: 'resource',
        originalError: error,
        isRetryable: true,
        isTransient: true,
        severity: 'medium',
        suggestedAction: 'Wait for resource availability'
      }
    }

    // Timeout errors
    if (this.isTimeoutError(message, code)) {
      return {
        category: 'timeout',
        originalError: error,
        isRetryable: true,
        isTransient: true,
        severity: 'medium',
        suggestedAction: 'Increase timeout or retry'
      }
    }

    // Unknown
    return {
      category: 'unknown',
      originalError: error,
      isRetryable: false,
      isTransient: false,
      severity: 'low'
    }
  }

  /**
   * Check if network error
   */
  private isNetworkError(message: string, code: string): boolean {
    const networkPatterns = ['network', 'connection', 'socket', 'dns', 'fetch']
    const networkCodes = ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT']

    return networkPatterns.some(p => message.includes(p)) || networkCodes.includes(code)
  }

  /**
   * Check if auth error
   */
  private isAuthError(message: string, code: string): boolean {
    const authPatterns = ['auth', 'unauthorized', 'forbidden', 'credential', 'token', 'permission']
    const authCodes = ['EACCES', 'EPERM']

    return authPatterns.some(p => message.includes(p)) || authCodes.includes(code)
  }

  /**
   * Check if validation error
   */
  private isValidationError(message: string, code: string): boolean {
    const validationPatterns = ['validation', 'invalid', 'schema', 'format', 'required', 'missing']

    return validationPatterns.some(p => message.includes(p))
  }

  /**
   * Check if resource error
   */
  private isResourceError(message: string, code: string): boolean {
    const resourcePatterns = ['resource', 'limit', 'quota', 'capacity', 'exhausted', 'busy']
    const resourceCodes = ['ENOMEM', 'ENOENT']

    return resourcePatterns.some(p => message.includes(p)) || resourceCodes.includes(code)
  }

  /**
   * Check if timeout error
   */
  private isTimeoutError(message: string, code: string): boolean {
    const timeoutPatterns = ['timeout', 'timed out', 'deadline']
    const timeoutCodes = ['ETIMEDOUT']

    return timeoutPatterns.some(p => message.includes(p)) || timeoutCodes.includes(code)
  }

  /**
   * Get suggested retry delay based on category
   */
  getRetryDelay(classified: ClassifiedError): number {
    if (!classified.isRetryable) return 0

    switch (classified.category) {
      case 'network': return 1000 // 1 second
      case 'resource': return 5000 // 5 seconds
      case 'timeout': return 2000 // 2 seconds
      default: return 1000
    }
  }

  /**
   * Should log error (severity threshold)
   */
  shouldLog(classified: ClassifiedError, minSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low'): boolean {
    const severityOrder = ['low', 'medium', 'high', 'critical']
    return severityOrder.indexOf(classified.severity) >= severityOrder.indexOf(minSeverity)
  }
}

// Global singleton
export const errorClassification = new ErrorClassification()

export default errorClassification