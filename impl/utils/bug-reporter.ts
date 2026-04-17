// @ts-nocheck

/**
 * Bug Reporter Pattern - Bug报告
 * 
 * Source: Claude Code utils/bugReporter.ts
 * Pattern: bug report + collection + submission + error context
 */

interface BugReport {
  id: string
  type: 'error' | 'crash' | 'performance' | 'usability'
  title: string
  description: string
  errorStack?: string
  context?: Record<string, any>
  createdAt: number
  submitted: boolean
}

class BugReporter {
  private reports = new Map<string, BugReport>()
  private reportCounter = 0
  private submittedReports: string[] = []

  private config = {
    autoSubmit: false,
    includeContext: true
  }

  /**
   * Create report
   */
  createReport(type: BugReport['type'], title: string, description: string, errorStack?: string, context?: Record<string, any>): BugReport {
    const id = `bug-${++this.reportCounter}-${Date.now()}`

    const report: BugReport = {
      id,
      type,
      title,
      description,
      errorStack,
      context: this.config.includeContext ? context : undefined,
      createdAt: Date.now(),
      submitted: false
    }

    this.reports.set(id, report)

    if (this.config.autoSubmit) {
      this.submit(id)
    }

    return report
  }

  /**
   * Create from error
   */
  createFromError(error: Error, context?: Record<string, any>): BugReport {
    return this.createReport(
      'error',
      error.name,
      error.message,
      error.stack,
      context
    )
  }

  /**
   * Submit report
   */
  async submit(id: string): Promise<boolean> {
    const report = this.reports.get(id)
    if (!report) return false

    // Would send to bug tracking service
    // For demo, mark as submitted
    report.submitted = true
    this.submittedReports.push(id)

    console.log(`[BugReporter] Submitted: ${report.title}`)

    return true
  }

  /**
   * Submit all pending
   */
  async submitAll(): Promise<number> {
    const pending = Array.from(this.reports.values())
      .filter(r => !r.submitted)

    let submitted = 0

    for (const report of pending) {
      if (await this.submit(report.id)) {
        submitted++
      }
    }

    return submitted
  }

  /**
   * Get report
   */
  getReport(id: string): BugReport | undefined {
    return this.reports.get(id)
  }

  /**
   * Get pending reports
   */
  getPendingReports(): BugReport[] {
    return Array.from(this.reports.values())
      .filter(r => !r.submitted)
  }

  /**
   * Get submitted reports
   */
  getSubmittedReports(): BugReport[] {
    return Array.from(this.reports.values())
      .filter(r => r.submitted)
  }

  /**
   * Delete report
   */
  deleteReport(id: string): boolean {
    return this.reports.delete(id)
  }

  /**
   * Get stats
   */
  getStats(): {
    totalReports: number
    pendingReports: number
    submittedReports: number
    byType: Record<BugReport['type'], number>
  } {
    const byType: Record<BugReport['type'], number> = {
      error: 0,
      crash: 0,
      performance: 0,
      usability: 0
    }

    for (const report of this.reports.values()) {
      byType[report.type]++
    }

    return {
      totalReports: this.reports.size,
      pendingReports: this.getPendingReports().length,
      submittedReports: this.submittedReports.length,
      byType
    }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.reports.clear()
    this.submittedReports = []
    this.reportCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.config = {
      autoSubmit: false,
      includeContext: true
    }
  }
}

// Global singleton
export const bugReporter = new BugReporter()

export default bugReporter