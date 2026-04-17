// @ts-nocheck

/**
 * Warning Handler Pattern - 警告处理器
 * 
 * Source: Claude Code utils/warningHandler.ts
 * Pattern: captureWarnings + dedupe + formatWarning + severity + stack trace scrubbing
 */

type WarningSeverity = 'info' | 'warn' | 'error'

interface CapturedWarning {
  id: string
  message: string
  severity: WarningSeverity
  stack?: string
  timestamp: number
  count: number
  source?: string
}

class WarningHandler {
  private warnings = new Map<string, CapturedWarning>()
  private warningCounter = 0
  private maxWarnings = 100

  /**
   * Capture warning
   */
  capture(message: string, options?: { severity?: WarningSeverity; stack?: string; source?: string }): string {
    // Dedupe by message
    const key = this.hashMessage(message)
    const existing = this.warnings.get(key)

    if (existing) {
      existing.count++
      existing.timestamp = Date.now()
      return existing.id
    }

    // New warning
    const id = `warning-${++this.warningCounter}`

    const warning: CapturedWarning = {
      id,
      message,
      severity: options?.severity ?? 'warn',
      stack: options?.stack ? this.scrubStack(options.stack) : undefined,
      timestamp: Date.now(),
      count: 1,
      source: options?.source
    }

    this.ensureCapacity()
    this.warnings.set(key, warning)

    return id
  }

  /**
   * Hash message for dedupe
   */
  private hashMessage(message: string): string {
    // Simple hash for deduplication
    let hash = 0
    for (let i = 0; i < Math.min(message.length, 100); i++) {
      hash = ((hash << 5) - hash) + message.charCodeAt(i)
      hash = hash & hash
    }
    return `warn-${hash.toString(16)}`
  }

  /**
   * Scrub stack trace (remove sensitive paths)
   */
  private scrubStack(stack: string): string {
    // Remove absolute paths
    return stack
      .replace(/\/Users\/[^/]+\/[^/]+\/[^/]+/g, '~')
      .replace(/\/home\/[^/]+\/[^/]+\/[^/]+/g, '~')
      .replace(/C:\\Users\\[^\\]+\\/g, '~\\')
  }

  /**
   * Format warning for display
   */
  format(warningId: string): string {
    const warning = this.getWarningById(warningId)
    if (!warning) return 'Warning not found'

    const parts: string[] = [
      `[${warning.severity.toUpperCase()}] ${warning.message}`
    ]

    if (warning.count > 1) {
      parts.push(`(repeated ${warning.count} times)`)
    }

    if (warning.source) {
      parts.push(`Source: ${warning.source}`)
    }

    if (warning.stack) {
      parts.push('Stack trace:')
      parts.push(warning.stack)
    }

    return parts.join('\n')
  }

  /**
   * Get warning by ID
   */
  getWarningById(id: string): CapturedWarning | undefined {
    for (const warning of this.warnings.values()) {
      if (warning.id === id) return warning
    }
    return undefined
  }

  /**
   * Get all warnings
   */
  getAllWarnings(): CapturedWarning[] {
    return Array.from(this.warnings.values())
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get warnings by severity
   */
  getWarningsBySeverity(severity: WarningSeverity): CapturedWarning[] {
    return this.getAllWarnings().filter(w => w.severity === severity)
  }

  /**
   * Clear warnings
   */
  clear(): void {
    this.warnings.clear()
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(): void {
    if (this.warnings.size >= this.maxWarnings) {
      // Evict oldest
      let oldestKey: string | null = null
      let oldestTime = Infinity

      for (const [key, warning] of this.warnings) {
        if (warning.timestamp < oldestTime) {
          oldestTime = warning.timestamp
          oldestKey = key
        }
      }

      if (oldestKey) {
        this.warnings.delete(oldestKey)
      }
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number
    bySeverity: Record<WarningSeverity, number>
    duplicates: number
  } {
    const bySeverity: Record<WarningSeverity, number> = { info: 0, warn: 0, error: 0 }
    let duplicates = 0

    for (const warning of this.warnings.values()) {
      bySeverity[warning.severity]++
      if (warning.count > 1) duplicates++
    }

    return { total: this.warnings.size, bySeverity, duplicates }
  }

  /**
   * Set max warnings
   */
  setMaxWarnings(max: number): void {
    this.maxWarnings = max
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.warningCounter = 0
  }
}

// Global singleton
export const warningHandler = new WarningHandler()

export default warningHandler