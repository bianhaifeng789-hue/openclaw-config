// @ts-nocheck

/**
 * Diag Logger Wrapper Pattern - 诊断日志包装器
 * 
 * Source: Claude Code utils/telemetry/logger.ts
 * Pattern: diag.createLogger + severity levels + safeLog + error boundary + formatter
 */

type SeverityLevel = 'verbose' | 'debug' | 'info' | 'warn' | 'error'

interface DiagConfig {
  severity: SeverityLevel
  includeTimestamp: boolean
  includeLevel: boolean
  formatJson: boolean
}

class DiagLoggerWrapper {
  private config: DiagConfig = {
    severity: 'info',
    includeTimestamp: true,
    includeLevel: true,
    formatJson: false
  }

  /**
   * Log at verbose level
   */
  verbose(message: string, ...args: any[]): void {
    this.log('verbose', message, args)
  }

  /**
   * Log at debug level
   */
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, args)
  }

  /**
   * Log at info level
   */
  info(message: string, ...args: any[]): void {
    this.log('info', message, args)
  }

  /**
   * Log at warn level
   */
  warn(message: string, ...args: any[]): void {
    this.log('warn', message, args)
  }

  /**
   * Log at error level
   */
  error(message: string, error?: Error, ...args: any[]): void {
    this.log('error', message, [error, ...args])
  }

  /**
   * Safe log with error boundary
   */
  private safeLog(level: SeverityLevel, formattedMessage: string): void {
    try {
      // Would integrate with actual diag logger
      // For demo, use console
      const consoleMethod = level === 'error' ? 'error' :
                            level === 'warn' ? 'warn' :
                            level === 'debug' ? 'debug' :
                            'log'

      console[consoleMethod](formattedMessage)
    } catch (e) {
      // Fallback: silent fail
    }
  }

  /**
   * Log with severity check
   */
  private log(level: SeverityLevel, message: string, args: any[]): void {
    // Check severity level
    if (!this.shouldLog(level)) return

    // Format message
    const formatted = this.formatMessage(level, message, args)

    // Safe log
    this.safeLog(level, formatted)
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: SeverityLevel): boolean {
    const levels: SeverityLevel[] = ['error', 'warn', 'info', 'debug', 'verbose']
    const currentLevelIndex = levels.indexOf(this.config.severity)
    const messageLevelIndex = levels.indexOf(level)

    return messageLevelIndex <= currentLevelIndex
  }

  /**
   * Format message
   */
  private formatMessage(level: SeverityLevel, message: string, args: any[]): string {
    const parts: string[] = []

    if (this.config.includeTimestamp) {
      parts.push(new Date().toISOString())
    }

    if (this.config.includeLevel) {
      parts.push(`[${level.toUpperCase()}]`)
    }

    parts.push(message)

    if (args.length > 0) {
      const argsStr = this.config.formatJson
        ? JSON.stringify(args)
        : args.map(a => String(a)).join(' ')
      parts.push(argsStr)
    }

    return parts.join(' ')
  }

  /**
   * Set severity level
   */
  setSeverity(severity: SeverityLevel): void {
    this.config.severity = severity
  }

  /**
   * Get severity level
   */
  getSeverity(): SeverityLevel {
    return this.config.severity
  }

  /**
   * Set config
   */
  setConfig(config: Partial<DiagConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get config
   */
  getConfig(): DiagConfig {
    return { ...this.config }
  }

  /**
   * Create child logger with custom config
   */
  createChild(config: Partial<DiagConfig>): DiagLoggerWrapper {
    const child = new DiagLoggerWrapper()
    child.setConfig({ ...this.config, ...config })
    return child
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.config = {
      severity: 'info',
      includeTimestamp: true,
      includeLevel: true,
      formatJson: false
    }
  }
}

// Global singleton
export const diagLogger = new DiagLoggerWrapper()

export default diagLogger