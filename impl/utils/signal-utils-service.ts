// @ts-nocheck

/**
 * Signal Utils Pattern - Signal工具
 * 
 * Source: Claude Code utils/signal.ts
 * Pattern: signal utils + signal handling + signals + interrupt handling
 */

interface SignalHandler {
  signal: string
  handler: () => void
  registeredAt: number
  triggeredCount: number
}

class SignalUtilsService {
  private handlers = new Map<string, SignalHandler[]>()

  /**
   * Register handler
   */
  register(signal: string, handler: () => void): SignalHandler {
    const entry: SignalHandler = {
      signal,
      handler,
      registeredAt: Date.now(),
      triggeredCount: 0
    }

    const handlers = this.handlers.get(signal) ?? []
    handlers.push(entry)
    this.handlers.set(signal, handlers)

    return entry
  }

  /**
   * Trigger signal
   */
  trigger(signal: string): number {
    const handlers = this.handlers.get(signal) ?? []

    for (const handler of handlers) {
      handler.handler()
      handler.triggeredCount++
    }

    return handlers.length
  }

  /**
   * Unregister handler
   */
  unregister(signal: string): number {
    const count = this.handlers.get(signal)?.length ?? 0

    this.handlers.delete(signal)

    return count
  }

  /**
   * Get handlers
   */
  getHandlers(signal?: string): SignalHandler[] {
    if (signal) {
      return this.handlers.get(signal) ?? []
    }

    return Array.from(this.handlers.values()).flat()
  }

  /**
   * Get registered signals
   */
  getRegisteredSignals(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Get stats
   */
  getStats(): {
    signalsCount: number
    handlersCount: number
    totalTriggered: number
    bySignal: Record<string, number>
  } {
    const bySignal: Record<string, number> = {}
    let totalTriggered = 0

    for (const [signal, handlers] of this.handlers) {
      bySignal[signal] = handlers.length
      totalTriggered += handlers.reduce((sum, h) => sum + h.triggeredCount, 0)
    }

    const handlersCount = Array.from(this.handlers.values()).reduce((sum, h) => sum + h.length, 0)

    return {
      signalsCount: this.handlers.size,
      handlersCount: handlersCount,
      totalTriggered: totalTriggered,
      bySignal
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.handlers.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const signalUtilsService = new SignalUtilsService()

export default signalUtilsService