// @ts-nocheck

/**
 * Teammate Init Pattern - Teammate初始化
 * 
 * Source: Claude Code utils/swarm/teammateInit.ts + skills/bundledSkills.ts
 * Pattern: teammate init + hooks + initialization + startup
 */

interface TeammateInitConfig {
  sessionId: string
  projectId: string
  role: string
  hooks: Array<{ type: string; handler: string }>
  skills: string[]
  timeoutMs: number
}

interface TeammateInitResult {
  sessionId: string
  success: boolean
  durationMs: number
  hooksExecuted: number
  skillsLoaded: number
  errors: string[]
}

class TeammateInitService {
  private configs = new Map<string, TeammateInitConfig>()
  private results = new Map<string, TeammateInitResult>()
  private hooks = new Map<string, Array<{ type: string; handler: () => Promise<void> }>>()

  /**
   * Register hook
   */
  registerHook(sessionId: string, type: string, handler: () => Promise<void>): void {
    const hooks = this.hooks.get(sessionId) ?? []
    hooks.push({ type, handler })
    this.hooks.set(sessionId, hooks)
  }

  /**
   * Configure init
   */
  configure(sessionId: string, config: TeammateInitConfig): void {
    this.configs.set(sessionId, config)
  }

  /**
   * Initialize teammate
   */
  async initialize(sessionId: string): TeammateInitResult {
    const config = this.configs.get(sessionId)
    const startTime = Date.now()

    const result: TeammateInitResult = {
      sessionId,
      success: true,
      durationMs: 0,
      hooksExecuted: 0,
      skillsLoaded: config?.skills.length ?? 0,
      errors: []
    }

    // Execute hooks
    const hooks = this.hooks.get(sessionId) ?? []

    for (const hook of hooks) {
      try {
        await hook.handler()
        result.hooksExecuted++
      } catch (e) {
        result.errors.push(`Hook ${hook.type} failed: ${e}`)
        result.success = false
      }
    }

    result.durationMs = Date.now() - startTime

    this.results.set(sessionId, result)

    return result
  }

  /**
   * Get config
   */
  getConfig(sessionId: string): TeammateInitConfig | undefined {
    return this.configs.get(sessionId)
  }

  /**
   * Get result
   */
  getResult(sessionId: string): TeammateInitResult | undefined {
    return this.results.get(sessionId)
  }

  /**
   * Get hooks
   */
  getHooks(sessionId: string): Array<{ type: string }> {
    return (this.hooks.get(sessionId) ?? []).map(h => ({ type: h.type }))
  }

  /**
   * Clear hooks
   */
  clearHooks(sessionId: string): void {
    this.hooks.delete(sessionId)
  }

  /**
   * Get stats
   */
  getStats(): {
    configsCount: number
    resultsCount: number
    successRate: number
    averageDurationMs: number
  } {
    const results = Array.from(this.results.values())
    const successCount = results.filter(r => r.success).length
    const avgDuration = results.length > 0
      ? results.reduce((sum, r) => sum + r.durationMs, 0) / results.length
      : 0

    return {
      configsCount: this.configs.size,
      resultsCount: results.length,
      successRate: results.length > 0 ? successCount / results.length : 0,
      averageDurationMs: avgDuration
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.configs.clear()
    this.results.clear()
    this.hooks.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const teammateInitService = new TeammateInitService()

export default teammateInitService