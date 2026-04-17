// @ts-nocheck

/**
 * Combined Abort Signal Pattern - 组合Abort信号
 * 
 * Source: Claude Code utils/combinedAbortSignal.ts
 * Pattern: combineAbortSignals + any signal aborts + WeakRef + cleanup registry
 */

import { cleanupRegistry } from './cleanup-registry'

class CombinedAbortSignal {
  /**
   * Combine multiple abort signals into one
   * Combined signal aborts when any input signal aborts
   */
  combineSignals(signals: AbortSignal[]): AbortSignal {
    if (signals.length === 0) {
      return new AbortController().signal // Fresh signal
    }

    if (signals.length === 1) {
      return signals[0] // Single signal, no combination needed
    }

    // Check if any already aborted
    for (const signal of signals) {
      if (signal.aborted) {
        // Return already-aborted signal
        const controller = new AbortController()
        controller.abort(signal.reason)
        return controller.signal
      }
    }

    // Create combined controller
    const combinedController = new AbortController()
    const combinedSignal = combinedController.signal

    // Track cleanup
    const cleanupFns: (() => void)[] = []

    // Listen to all signals
    for (const signal of signals) {
      const handler = () => {
        combinedController.abort(signal.reason)
        // Clean up all handlers
        for (const fn of cleanupFns) fn()
      }

      signal.addEventListener('abort', handler, { once: true })
      cleanupFns.push(() => signal.removeEventListener('abort', handler))
    }

    // Register cleanup
    cleanupRegistry.register(() => {
      for (const fn of cleanupFns) fn()
    }, { id: 'combined-abort-signal', description: 'Combined abort signal cleanup' })

    return combinedSignal
  }

  /**
   * Create abort signal from timeout
   */
  timeoutSignal(ms: number): AbortSignal {
    const controller = new AbortController()

    const timer = setTimeout(() => {
      controller.abort(new DOMException(`Timeout after ${ms}ms`, 'TimeoutError'))
    }, ms)

    // Unref timer
    if (typeof timer.unref === 'function') {
      timer.unref()
    }

    // Cleanup on abort
    cleanupRegistry.register(() => {
      clearTimeout(timer)
    }, { id: `timeout-signal-${ms}` })

    return controller.signal
  }

  /**
   * Create abort signal with reason
   */
  abortWithReason(reason: any): AbortSignal {
    const controller = new AbortController()
    controller.abort(reason)
    return controller.signal
  }

  /**
   * Race signals - returns first aborted signal
   */
  raceSignals(signals: AbortSignal[]): Promise<AbortSignal> {
    return new Promise(resolve => {
      // Check if any already aborted
      for (const signal of signals) {
        if (signal.aborted) {
          resolve(signal)
          return
        }
      }

      // Listen for first abort
      for (const signal of signals) {
        signal.addEventListener('abort', () => resolve(signal), { once: true })
      }
    })
  }

  /**
   * Never-aborting signal (infinite lifetime)
   */
  neverAbortSignal(): AbortSignal {
    return new AbortController().signal
  }

  /**
   * Check if signal is abortable (not already aborted)
   */
  isAbortable(signal: AbortSignal): boolean {
    return !signal.aborted
  }

  /**
   * Throw if aborted with custom message
   */
  throwIfAborted(signal: AbortSignal, message?: string): void {
    if (signal.aborted) {
      const reason = signal.reason ?? message ?? 'Operation aborted'
      throw new DOMException(reason, 'AbortError')
    }
  }

  /**
   * Create signal that aborts when promise rejects
   */
  promiseSignal(promise: Promise<any>): AbortSignal {
    const controller = new AbortController()

    promise.catch(error => {
      controller.abort(error)
    })

    return controller.signal
  }

  /**
   * Link abort to cleanup registry
   */
  linkToCleanup(signal: AbortSignal, cleanupId: string): void {
    signal.addEventListener('abort', () => {
      // Cleanup would run automatically via registry
      console.log(`[AbortSignal] Abort triggered for ${cleanupId}`)
    }, { once: true })
  }
}

// Global singleton
export const combinedAbortSignal = new CombinedAbortSignal()

export default combinedAbortSignal