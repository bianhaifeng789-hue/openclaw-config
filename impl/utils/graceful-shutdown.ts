// @ts-nocheck

/**
 * Graceful Shutdown Pattern - 优雅关闭
 * 
 * Source: Claude Code utils/gracefulShutdown.ts
 * Pattern: GracefulExitReason + shutdown hook + exit code mapping + force kill timeout
 */

type GracefulExitReason = 'user_request' | 'error' | 'signal' | 'timeout' | 'api_limit' | 'token_limit'

interface ShutdownContext {
  reason: GracefulExitReason
  message: string
  exitCode: number
  timestamp: number
  force: boolean
}

interface ShutdownHook {
  id: string
  fn: () => Promise<void> | void
  priority: number
  timeoutMs: number
}

class GracefulShutdown {
  private hooks: ShutdownHook[] = []
  private shutdownStarted = false
  private shutdownComplete = false
  private forceKillTimeout = 5000 // 5 seconds to force kill

  // Exit code mapping
  private exitCodes: Record<GracefulExitReason, number> = {
    'user_request': 0,
    'error': 1,
    'signal': 0, // SIGINT/SIGTERM are clean exits
    'timeout': 124,
    'api_limit': 2,
    'token_limit': 3
  }

  /**
   * Register shutdown hook
   */
  registerHook(id: string, fn: () => Promise<void> | void, options?: { priority?: number; timeoutMs?: number }): () => void {
    const hook: ShutdownHook = {
      id,
      fn,
      priority: options?.priority ?? 0,
      timeoutMs: options?.timeoutMs ?? 5000
    }

    this.hooks.push(hook)
    this.hooks.sort((a, b) => b.priority - a.priority) // Higher priority first

    // Return unregister function
    return () => {
      this.hooks = this.hooks.filter(h => h.id !== id)
    }
  }

  /**
   * Initiate graceful shutdown
   */
  async shutdown(reason: GracefulExitReason, message?: string, force = false): Promise<void> {
    if (this.shutdownStarted) {
      console.log('[GracefulShutdown] Shutdown already in progress')
      return
    }

    this.shutdownStarted = true
    const context: ShutdownContext = {
      reason,
      message: message ?? this.getDefaultMessage(reason),
      exitCode: this.exitCodes[reason],
      timestamp: Date.now(),
      force
    }

    console.log(`[GracefulShutdown] Starting shutdown: ${context.message}`)

    // Run hooks with timeout
    await this.runHooks(context)

    this.shutdownComplete = true

    // Exit process
    process.exit(context.exitCode)
  }

  /**
   * Run shutdown hooks with timeout protection
   */
  private async runHooks(context: ShutdownContext): Promise<void> {
    const results = await Promise.allSettled(
      this.hooks.map(async hook => {
        try {
          // Run hook with timeout
          await this.runHookWithTimeout(hook)
        } catch (e) {
          console.warn(`[GracefulShutdown] Hook ${hook.id} failed:`, e)
        }
      })
    )

    const failed = results.filter(r => r.status === 'rejected').length
    if (failed > 0) {
      console.warn(`[GracefulShutdown] ${failed} hooks failed`)
    }
  }

  /**
   * Run single hook with timeout
   */
  private async runHookWithTimeout(hook: ShutdownHook): Promise<void> {
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error(`Hook ${hook.id} timeout`)), hook.timeoutMs)
    })

    const hookPromise = Promise.resolve(hook.fn())

    await Promise.race([hookPromise, timeoutPromise])
  }

  /**
   * Get default message for reason
   */
  private getDefaultMessage(reason: GracefulExitReason): string {
    switch (reason) {
      case 'user_request': return 'User requested shutdown'
      case 'error': return 'Error triggered shutdown'
      case 'signal': return 'Received termination signal'
      case 'timeout': return 'Timeout exceeded'
      case 'api_limit': return 'API rate limit reached'
      case 'token_limit': return 'Token budget exceeded'
      default: return 'Unknown reason'
    }
  }

  /**
   * Setup signal handlers
   */
  setupSignalHandlers(): void {
    process.once('SIGINT', () => {
      console.log('\n[GracefulShutdown] SIGINT received')
      this.shutdown('signal', 'SIGINT (Ctrl+C)')
    })

    process.once('SIGTERM', () => {
      console.log('[GracefulShutdown] SIGTERM received')
      this.shutdown('signal', 'SIGTERM')
    })

    process.once('beforeExit', () => {
      console.log('[GracefulShutdown] beforeExit received')
      this.shutdown('user_request', 'Event loop empty')
    })
  }

  /**
   * Check if shutdown in progress
   */
  isShuttingDown(): boolean {
    return this.shutdownStarted
  }

  /**
   * Check if shutdown complete
   */
  isComplete(): boolean {
    return this.shutdownComplete
  }

  /**
   * Get hooks count
   */
  getHooksCount(): number {
    return this.hooks.length
  }

  /**
   * Set force kill timeout
   */
  setForceKillTimeout(ms: number): void {
    this.forceKillTimeout = ms
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.hooks = []
    this.shutdownStarted = false
    this.shutdownComplete = false
  }
}

// Global singleton
export const gracefulShutdown = new GracefulShutdown()

// Auto-setup signal handlers
gracefulShutdown.setupSignalHandlers()

export default gracefulShutdown