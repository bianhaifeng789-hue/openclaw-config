// @ts-nocheck

/**
 * Spawn Utils Pattern - Spawn工具
 * 
 * Source: Claude Code utils/swarm/spawnUtils.ts + utils/forkedAgent.ts
 * Pattern: spawn utils + process spawning + forked agent + lifecycle
 */

interface SpawnConfig {
  agentId: string
  sessionId: string
  runtime: 'subagent' | 'acp' | 'process'
  cwd: string
  timeoutMs: number
  env: Record<string, string>
}

interface SpawnResult {
  agentId: string
  pid: number | null
  success: boolean
  startTime: number
  endTime: number | null
  exitCode: number | null
}

class SpawnUtils {
  private configs = new Map<string, SpawnConfig>()
  private results = new Map<string, SpawnResult>()
  private activeSpawns = new Map<string, { pid: number; startTime: number }>()

  /**
   * Configure spawn
   */
  configure(agentId: string, config: SpawnConfig): void {
    this.configs.set(agentId, config)
  }

  /**
   * Spawn agent
   */
  spawn(agentId: string): SpawnResult {
    const config = this.configs.get(agentId)
    const startTime = Date.now()

    // Would spawn actual process
    // For demo, simulate
    const pid = Math.floor(Math.random() * 10000) + 1000

    const result: SpawnResult = {
      agentId,
      pid,
      success: true,
      startTime,
      endTime: null,
      exitCode: null
    }

    this.results.set(agentId, result)
    this.activeSpawns.set(agentId, { pid, startTime })

    return result
  }

  /**
   * Kill spawn
   */
  kill(agentId: string): boolean {
    const spawn = this.activeSpawns.get(agentId)
    if (!spawn) return false

    // Would kill actual process
    const result = this.results.get(agentId)
    if (result) {
      result.endTime = Date.now()
      result.exitCode = 0 // Normal termination
    }

    this.activeSpawns.delete(agentId)

    return true
  }

  /**
   * Check if active
   */
  isActive(agentId: string): boolean {
    return this.activeSpawns.has(agentId)
  }

  /**
   * Get spawn result
   */
  getResult(agentId: string): SpawnResult | undefined {
    return this.results.get(agentId)
  }

  /**
   * Get config
   */
  getConfig(agentId: string): SpawnConfig | undefined {
    return this.configs.get(agentId)
  }

  /**
   * Get active spawns
   */
  getActive(): Array<{ agentId: string; pid: number; startTime: number }> {
    return Array.from(this.activeSpawns.entries())
      .map(([agentId, data]) => ({ agentId, ...data }))
  }

  /**
   * Get stats
   */
  getStats(): {
    totalSpawns: number
    activeSpawns: number
    successRate: number
    averageLifetimeMs: number
  } {
    const results = Array.from(this.results.values())
    const active = this.activeSpawns.size
    const successCount = results.filter(r => r.success).length

    const completed = results.filter(r => r.endTime !== null)
    const avgLifetime = completed.length > 0
      ? completed.reduce((sum, r) => sum + (r.endTime! - r.startTime), 0) / completed.length
      : 0

    return {
      totalSpawns: results.length,
      activeSpawns: active,
      successRate: results.length > 0 ? successCount / results.length : 0,
      averageLifetimeMs: avgLifetime
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.configs.clear()
    this.results.clear()
    this.activeSpawns.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const spawnUtils = new SpawnUtils()

export default spawnUtils