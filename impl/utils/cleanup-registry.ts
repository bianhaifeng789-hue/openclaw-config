// @ts-nocheck

/**
 * Cleanup Registry Pattern - 进程退出时自动清理资源
 * 
 * Source: Claude Code utils/cleanupRegistry.ts
 * Pattern: registerCleanup + async cleanup + beforeExit signal + unref timers
 */

type CleanupFn = () => Promise<void> | void

interface CleanupEntry {
  id: string
  fn: CleanupFn
  priority: number // Higher priority runs first
  description?: string
}

class CleanupRegistry {
  private cleanups: CleanupEntry[] = []
  private cleanupRan = false
  private debugMode = false

  /**
   * Register a cleanup function to run on process exit
   * @returns unregister function to remove cleanup
   */
  register(fn: CleanupFn, options?: { id?: string; priority?: number; description?: string }): () => void {
    const id = options?.id ?? `cleanup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const priority = options?.priority ?? 0
    const description = options?.description

    const entry: CleanupEntry = { id, fn, priority, description }
    this.cleanups.push(entry)

    // Sort by priority (higher first)
    this.cleanups.sort((a, b) => b.priority - a.priority)

    // Return unregister function
    return () => {
      this.cleanups = this.cleanups.filter(e => e.id !== id)
    }
  }

  /**
   * Run all registered cleanups
   * Called automatically on beforeExit/exit/SIGINT/SIGTERM
   */
  async runAll(): Promise<void> {
    if (this.cleanupRan) {
      if (this.debugMode) console.log('[CleanupRegistry] Cleanup already ran, skipping')
      return
    }
    this.cleanupRan = true

    if (this.debugMode) {
      console.log(`[CleanupRegistry] Running ${this.cleanups.length} cleanup functions`)
    }

    const errors: Error[] = []

    for (const entry of this.cleanups) {
      try {
        if (this.debugMode) {
          console.log(`[CleanupRegistry] Running: ${entry.description || entry.id}`)
        }
        await entry.fn()
      } catch (e) {
        errors.push(e instanceof Error ? e : new Error(String(e)))
        if (this.debugMode) {
          console.error(`[CleanupRegistry] Error in ${entry.id}:`, e)
        }
      }
    }

    if (errors.length > 0) {
      console.error(`[CleanupRegistry] ${errors.length} cleanup errors`)
    }
  }

  /**
   * Setup automatic cleanup on process exit signals
   */
  setupAutoCleanup(): void {
    const handleSignal = async (signal: string) => {
      console.log(`\n[CleanupRegistry] Received ${signal}, running cleanups...`)
      await this.runAll()
      process.exit(0)
    }

    // beforeExit - runs when event loop empties (async safe)
    process.once('beforeExit', () => this.runAll())

    // exit - runs when process exits (sync only, but we try async)
    process.once('exit', () => {
      // Can't do async in exit handler, but sync cleanup works
      for (const entry of this.cleanups) {
        try {
          // Only call sync functions in exit handler
          const result = entry.fn()
          if (result instanceof Promise) {
            // Can't await in exit handler, just fire
            result.catch(e => console.error(`[CleanupRegistry] Async cleanup error:`, e))
          }
        } catch (e) {
          console.error(`[CleanupRegistry] Cleanup error in exit:`, e)
        }
      }
    })

    // SIGINT (Ctrl+C)
    process.once('SIGINT', () => handleSignal('SIGINT'))

    // SIGTERM (kill command)
    process.once('SIGTERM', () => handleSignal('SIGTERM'))
  }

  /**
   * Enable debug logging
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled
  }

  /**
   * Get count of registered cleanups
   */
  get count(): number {
    return this.cleanups.length
  }

  /**
   * Check if cleanup has already run
   */
  get hasRun(): boolean {
    return this.cleanupRan
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.cleanups = []
    this.cleanupRan = false
  }
}

// Global singleton instance
export const cleanupRegistry = new CleanupRegistry()

// Convenience exports
export const registerCleanup = cleanupRegistry.register.bind(cleanupRegistry)
export const runCleanup = cleanupRegistry.runAll.bind(cleanupRegistry)
export const setupAutoCleanup = cleanupRegistry.setupAutoCleanup.bind(cleanupRegistry)

export default cleanupRegistry