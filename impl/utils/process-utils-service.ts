// @ts-nocheck

/**
 * Process Utils Pattern - 进程工具
 * 
 * Source: Claude Code utils/process.ts + utils/genericProcessUtils.ts
 * Pattern: process utils + process management + spawn + execution
 */

interface ProcessInfo {
  pid: number
  command: string
  status: 'running' | 'completed' | 'failed' | 'killed'
  exitCode?: number
  stdout?: string
  stderr?: string
  startedAt: number
  completedAt?: number
}

class ProcessUtilsService {
  private processes = new Map<number, ProcessInfo>()
  private processCounter = 0

  /**
   * Spawn process
   */
  spawn(command: string): ProcessInfo {
    const pid = ++this.processCounter

    const process: ProcessInfo = {
      pid,
      command,
      status: 'running',
      startedAt: Date.now()
    }

    this.processes.set(pid, process)

    return process
  }

  /**
   * Complete process
   */
  complete(pid: number, exitCode: number, stdout?: string, stderr?: string): boolean {
    const process = this.processes.get(pid)
    if (!process || process.status !== 'running') return false

    process.status = exitCode === 0 ? 'completed' : 'failed'
    process.exitCode = exitCode
    process.stdout = stdout
    process.stderr = stderr
    process.completedAt = Date.now()

    return true
  }

  /**
   * Kill process
   */
  kill(pid: number): boolean {
    const process = this.processes.get(pid)
    if (!process || process.status !== 'running') return false

    process.status = 'killed'
    process.completedAt = Date.now()

    return true
  }

  /**
   * Get process
   */
  getProcess(pid: number): ProcessInfo | undefined {
    return this.processes.get(pid)
  }

  /**
   * Get running processes
   */
  getRunning(): ProcessInfo[] {
    return Array.from(this.processes.values())
      .filter(p => p.status === 'running')
  }

  /**
   * Get completed processes
   */
  getCompleted(): ProcessInfo[] {
    return Array.from(this.processes.values())
      .filter(p => p.status === 'completed')
  }

  /**
   * Get failed processes
   */
  getFailed(): ProcessInfo[] {
    return Array.from(this.processes.values())
      .filter(p => p.status === 'failed')
  }

  /**
   * Get stats
   */
  getStats(): {
    processesCount: number
    runningCount: number
    completedCount: number
    failedCount: number
    killedCount: number
    averageDuration: number
  } {
    const processes = Array.from(this.processes.values())
    const avgDuration = processes.filter(p => p.completedAt).length > 0
      ? processes.filter(p => p.completedAt).reduce((sum, p) => sum + ((p.completedAt ?? 0) - p.startedAt), 0) / processes.filter(p => p.completedAt).length
      : 0

    return {
      processesCount: processes.length,
      runningCount: processes.filter(p => p.status === 'running').length,
      completedCount: processes.filter(p => p.status === 'completed').length,
      failedCount: processes.filter(p => p.status === 'failed').length,
      killedCount: processes.filter(p => p.status === 'killed').length,
      averageDuration: avgDuration
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.processes.clear()
    this.processCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const processUtilsService = new ProcessUtilsService()

export default processUtilsService