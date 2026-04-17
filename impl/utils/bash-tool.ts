// @ts-nocheck

/**
 * Bash Tool Pattern - Bash工具
 * 
 * Source: Claude Code tools/BashTool/BashTool.ts + tools/BashTool/BashTool.tsx
 * Pattern: bash tool + shell execution + command runner + output capture
 */

interface BashExecution {
  id: string
  command: string
  cwd: string
  exitCode: number | null
  stdout: string
  stderr: string
  durationMs: number
  timestamp: number
}

class BashTool {
  private executions: BashExecution[] = []
  private executionCounter = 0
  private timeout = 30000
  private allowedCommands: string[] = []

  /**
   * Execute command
   */
  async execute(command: string, cwd?: string): BashExecution {
    const id = `bash-${++this.executionCounter}-${Date.now()}`
    const startTime = Date.now()

    // Would execute actual shell command
    // For demo, simulate
    const execution: BashExecution = {
      id,
      command,
      cwd: cwd ?? process.cwd(),
      exitCode: 0,
      stdout: `Simulated output for: ${command}`,
      stderr: '',
      durationMs: Date.now() - startTime,
      timestamp: Date.now()
    }

    this.executions.push(execution)

    return execution
  }

  /**
   * Execute with timeout
   */
  async executeWithTimeout(command: string, timeoutMs: number, cwd?: string): BashExecution {
    this.timeout = timeoutMs

    return this.execute(command, cwd)
  }

  /**
   * Allow command
   */
  allow(command: string): void {
    this.allowedCommands.push(command)
  }

  /**
   * Check allowed
   */
  isAllowed(command: string): boolean {
    if (this.allowedCommands.length === 0) return true

    return this.allowedCommands.some(allowed => command.startsWith(allowed))
  }

  /**
   * Get execution
   */
  getExecution(id: string): BashExecution | undefined {
    return this.executions.find(e => e.id === id)
  }

  /**
   * Get recent executions
   */
  getRecent(count: number = 10): BashExecution[] {
    return this.executions.slice(-count)
  }

  /**
   * Get failed executions
   */
  getFailed(): BashExecution[] {
    return this.executions.filter(e => e.exitCode !== 0)
  }

  /**
   * Get successful executions
   */
  getSuccessful(): BashExecution[] {
    return this.executions.filter(e => e.exitCode === 0)
  }

  /**
   * Get by command
   */
  getByCommand(command: string): BashExecution[] {
    return this.executions.filter(e => e.command === command)
  }

  /**
   * Set timeout
   */
  setTimeout(ms: number): void {
    this.timeout = ms
  }

  /**
   * Get timeout
   */
  getTimeout(): number {
    return this.timeout
  }

  /**
   * Get stats
   */
  getStats(): {
    executionsCount: number
    successfulCount: number
    failedCount: number
    averageDurationMs: number
    successRate: number
  } {
    const successful = this.getSuccessful()
    const failed = this.getFailed()
    const avgDuration = this.executions.length > 0
      ? this.executions.reduce((sum, e) => sum + e.durationMs, 0) / this.executions.length
      : 0

    return {
      executionsCount: this.executions.length,
      successfulCount: successful.length,
      failedCount: failed.length,
      averageDurationMs: avgDuration,
      successRate: this.executions.length > 0 ? successful.length / this.executions.length : 0
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.executions = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
    this.executionCounter = 0
    this.timeout = 30000
    this.allowedCommands = []
  }
}

// Global singleton
export const bashTool = new BashTool()

export default bashTool