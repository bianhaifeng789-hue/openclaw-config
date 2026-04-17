// @ts-nocheck

/**
 * Slow Operations Pattern - 慢操作检测
 * 
 * Source: Claude Code utils/slowOperations.ts
 * Pattern: slow operations detection + threshold + logging + tracking
 */

interface SlowOperation {
  id: string
  name: string
  durationMs: number
  thresholdMs: number
  metadata?: Record<string, any>
  timestamp: number
}

class SlowOperationsDetector {
  private operations: SlowOperation[] = []
  private thresholds = new Map<string, number>()
  private operationCounter = 0

  private config = {
    defaultThresholdMs: 1000,
    maxOperations: 100,
    logEnabled: true
  }

  /**
   * Set threshold
   */
  setThreshold(operationName: string, thresholdMs: number): void {
    this.thresholds.set(operationName, thresholdMs)
  }

  /**
   * Check operation
   */
  check(operationName: string, durationMs: number, metadata?: Record<string, any>): SlowOperation | null {
    const threshold = this.thresholds.get(operationName) ?? this.config.defaultThresholdMs

    if (durationMs < threshold) return null

    const operation: SlowOperation = {
      id: `slow-${++this.operationCounter}`,
      name: operationName,
      durationMs,
      thresholdMs: threshold,
      metadata,
      timestamp: Date.now()
    }

    this.operations.push(operation)

    // Trim history
    while (this.operations.length > this.config.maxOperations) {
      this.operations.shift()
    }

    // Log if enabled
    if (this.config.logEnabled) {
      console.warn(`[SlowOp] ${operationName} took ${durationMs}ms (threshold: ${threshold}ms)`)
    }

    return operation
  }

  /**
   * Track operation
   */
  async track<T>(operationName: string, fn: () => Promise<T>): Promise<{ result: T; durationMs: number; slow: boolean }> {
    const startTime = Date.now()

    const result = await fn()

    const durationMs = Date.now() - startTime
    const slowOp = this.check(operationName, durationMs)

    return {
      result,
      durationMs,
      slow: slowOp !== null
    }
  }

  /**
   * Get slow operations
   */
  getSlowOperations(): SlowOperation[] {
    return [...this.operations]
  }

  /**
   * Get slow operations by name
   */
  getByOperation(name: string): SlowOperation[] {
    return this.operations.filter(o => o.name === name)
  }

  /**
   * Get slowest operations
   */
  getSlowest(count: number = 10): SlowOperation[] {
    return this.operations
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, count)
  }

  /**
   * Get threshold
   */
  getThreshold(operationName: string): number {
    return this.thresholds.get(operationName) ?? this.config.defaultThresholdMs
  }

  /**
   * Get stats
   */
  getStats(): {
    totalSlow: number
    slowestOperation: string | null
    averageDuration: number
    thresholds: Record<string, number>
  } {
    const slowest = this.operations.length > 0
      ? this.operations.reduce((max, o) => o.durationMs > max.durationMs ? o : max).name
      : null

    const avg = this.operations.length > 0
      ? this.operations.reduce((sum, o) => sum + o.durationMs, 0) / this.operations.length
      : 0

    const thresholds: Record<string, number> = {}
    for (const [name, threshold] of this.thresholds) {
      thresholds[name] = threshold
    }

    return {
      totalSlow: this.operations.length,
      slowestOperation: slowest,
      averageDuration: avg,
      thresholds
    }
  }

  /**
   * Clear operations
   */
  clear(): void {
    this.operations = []
    this.operationCounter = 0
  }

  /**
   * Set config
   */
  setConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.thresholds.clear()
    this.config = {
      defaultThresholdMs: 1000,
      maxOperations: 100,
      logEnabled: true
    }
  }
}

// Global singleton
export const slowOperationsDetector = new SlowOperationsDetector()

// Set default thresholds
slowOperationsDetector.setThreshold('file_read', 500)
slowOperationsDetector.setThreshold('file_write', 500)
slowOperationsDetector.setThreshold('api_call', 2000)
slowOperationsDetector.setThreshold('llm_request', 10000)

export default slowOperationsDetector