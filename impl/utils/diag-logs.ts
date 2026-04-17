// @ts-nocheck

/**
 * Diag Logs Pattern - 诊断日志
 * 
 * Source: Claude Code utils/diagLogs.ts + utils/diagnosticLogs.ts
 * Pattern: diag logger + structured logging + log levels + sinks + buffer
 */

type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: number
  context?: Record<string, any>
  error?: Error
}

type LogSink = (entry: LogEntry) => void

class DiagLogs {
  private entries: LogEntry[] = []
  private sinks: LogSink[] = []
  private minLevel: LogLevel = 'info'
  private maxEntries = 1000

  private levelOrder: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal']

  /**
   * Add log sink
   */
  addSink(sink: LogSink): () => void {
    this.sinks.push(sink)
    return () => {
      this.sinks = this.sinks.filter(s => s !== sink)
    }
  }

  /**
   * Set minimum log level
   */
  setMinLevel(level: LogLevel): void {
    this.minLevel = level
  }

  /**
   * Log trace
   */
  trace(message: string, context?: Record<string, any>): void {
    this.log('trace', message, context)
  }

  /**
   * Log debug
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  /**
   * Log info
   */
  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  /**
   * Log warn
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  /**
   * Log error
   */
  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error)
  }

  /**
   * Log fatal
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('fatal', message, context, error)
  }

  /**
   * Core log method
   */
  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    // Check level
    if (!this.shouldLog(level)) return

    const entry: LogEntry = {
      level,
      message,
      timestamp: Date.now(),
      context,
      error
    }

    // Add to buffer
    this.entries.push(entry)
    this.ensureCapacity()

    // Send to sinks
    for (const sink of this.sinks) {
      try {
        sink(entry)
      } catch (e) {
        console.error('[DiagLogs] Sink error:', e)
      }
    }
  }

  /**
   * Check if level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levelIndex = this.levelOrder.indexOf(level)
    const minIndex = this.levelOrder.indexOf(this.minLevel)
    return levelIndex >= minIndex
  }

  /**
   * Ensure buffer capacity
   */
  private ensureCapacity(): void {
    while (this.entries.length > this.maxEntries) {
      this.entries.shift()
    }
  }

  /**
   * Get all entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries]
  }

  /**
   * Get entries by level
   */
  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(e => e.level === level)
  }

  /**
   * Get recent entries
   */
  getRecentEntries(count: number): LogEntry[] {
    return this.entries.slice(-count)
  }

  /**
   * Clear entries
   */
  clear(): void {
    this.entries = []
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number
    byLevel: Record<LogLevel, number>
  } {
    const byLevel: Record<LogLevel, number> = {
      trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0
    }

    for (const entry of this.entries) {
      byLevel[entry.level]++
    }

    return { total: this.entries.length, byLevel }
  }

  /**
   * Format entry for display
   */
  formatEntry(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString()
    const level = entry.level.toUpperCase()
    const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
    const error = entry.error ? ` Error: ${entry.error.message}` : ''

    return `[${timestamp}] [${level}] ${entry.message}${context}${error}`
  }

  /**
   * Set max entries
   */
  setMaxEntries(max: number): void {
    this.maxEntries = max
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.entries = []
    this.sinks = []
    this.minLevel = 'info'
  }
}

// Global singleton
export const diagLogs = new DiagLogs()

// Add console sink by default
diagLogs.addSink(entry => {
  const formatted = diagLogs.formatEntry(entry)
  switch (entry.level) {
    case 'trace': case 'debug': console.log(formatted); break
    case 'info': console.info(formatted); break
    case 'warn': console.warn(formatted); break
    case 'error': case 'fatal': console.error(formatted); break
  }
})

export default diagLogs