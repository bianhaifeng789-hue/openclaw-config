// @ts-nocheck

/**
 * Abort Utils Pattern - Abort工具
 * 
 * Source: Claude Code utils/abortController.ts + utils/combinedAbortSignal.ts
 * Pattern: abort utils + abort handling + cancellation + abort controller
 */

interface AbortControllerInfo {
  id: string
  aborted: boolean
  reason?: string
  createdAt: number
  abortedAt?: number
}

class AbortUtilsService {
  private controllers = new Map<string, AbortControllerInfo>()
  private controllerCounter = 0

  /**
   * Create controller
   */
  create(): AbortControllerInfo {
    const id = `abort-${++this.controllerCounter}-${Date.now()}`

    const controller: AbortControllerInfo = {
      id,
      aborted: false,
      createdAt: Date.now()
    }

    this.controllers.set(id, controller)

    return controller
  }

  /**
   * Abort controller
   */
  abort(id: string, reason?: string): boolean {
    const controller = this.controllers.get(id)
    if (!controller || controller.aborted) return false

    controller.aborted = true
    controller.reason = reason
    controller.abortedAt = Date.now()

    return true
  }

  /**
   * Check aborted
   */
  isAborted(id: string): boolean {
    return this.controllers.get(id)?.aborted ?? false
  }

  /**
   * Get controller
   */
  getController(id: string): AbortControllerInfo | undefined {
    return this.controllers.get(id)
  }

  /**
   * Get aborted controllers
   */
  getAborted(): AbortControllerInfo[] {
    return Array.from(this.controllers.values())
      .filter(c => c.aborted)
  }

  /**
   * Get active controllers
   */
  getActive(): AbortControllerInfo[] {
    return Array.from(this.controllers.values())
      .filter(c => !c.aborted)
  }

  /**
   * Combined abort signal
   */
  combine(ids: string[]): AbortControllerInfo {
    const combined = this.create()

    for (const id of ids) {
      if (this.isAborted(id)) {
        this.abort(combined.id, `Signal ${id} already aborted`)
        break
      }
    }

    return combined
  }

  /**
   * Get stats
   */
  getStats(): {
    controllersCount: number
    abortedCount: number
    activeCount: number
    abortRate: number
  } {
    const controllers = Array.from(this.controllers.values())

    return {
      controllersCount: controllers.length,
      abortedCount: controllers.filter(c => c.aborted).length,
      activeCount: controllers.filter(c => !c.aborted).length,
      abortRate: controllers.length > 0 ? controllers.filter(c => c.aborted).length / controllers.length : 0
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.controllers.clear()
    this.controllerCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const abortUtilsService = new AbortUtilsService()

export default abortUtilsService