// @ts-nocheck

/**
 * Teammate Model Pattern - Teammate模型
 * 
 * Source: Claude Code utils/swarm/teammateModel.ts
 * Pattern: teammate model + state management + model selection
 */

interface TeammateModelConfig {
  id: string
  modelId: string
  provider: string
  capabilities: string[]
  maxTokens: number
  temperature: number
}

interface ModelAssignment {
  sessionId: string
  config: TeammateModelConfig
  assignedAt: number
  lastUsed: number
}

class TeammateModel {
  private configs = new Map<string, TeammateModelConfig>()
  private assignments = new Map<string, ModelAssignment>()

  /**
   * Register model config
   */
  register(id: string, modelId: string, provider: string, capabilities: string[], maxTokens?: number): TeammateModelConfig {
    const config: TeammateModelConfig = {
      id,
      modelId,
      provider,
      capabilities,
      maxTokens: maxTokens ?? 4096,
      temperature: 0.7
    }

    this.configs.set(id, config)

    return config
  }

  /**
   * Assign model to session
   */
  assign(sessionId: string, configId: string): ModelAssignment {
    const config = this.configs.get(configId)
    if (!config) throw new Error('Config not found')

    const assignment: ModelAssignment = {
      sessionId,
      config,
      assignedAt: Date.now(),
      lastUsed: Date.now()
    }

    this.assignments.set(sessionId, assignment)

    return assignment
  }

  /**
   * Get assignment
   */
  getAssignment(sessionId: string): ModelAssignment | undefined {
    return this.assignments.get(sessionId)
  }

  /**
   * Get config
   */
  getConfig(id: string): TeammateModelConfig | undefined {
    return this.configs.get(id)
  }

  /**
   * Update last used
   */
  updateLastUsed(sessionId: string): boolean {
    const assignment = this.assignments.get(sessionId)
    if (!assignment) return false

    assignment.lastUsed = Date.now()

    return true
  }

  /**
   * Set temperature
   */
  setTemperature(configId: string, temperature: number): boolean {
    const config = this.configs.get(configId)
    if (!config) return false

    config.temperature = temperature

    return true
  }

  /**
   * Get by provider
   */
  getByProvider(provider: string): TeammateModelConfig[] {
    return Array.from(this.configs.values())
      .filter(c => c.provider === provider)
  }

  /**
   * Get by capability
   */
  getByCapability(capability: string): TeammateModelConfig[] {
    return Array.from(this.configs.values())
      .filter(c => c.capabilities.includes(capability))
  }

  /**
   * Find best model
   */
  findBest(capabilities: string[]): TeammateModelConfig | null {
    const configs = Array.from(this.configs.values())

    // Score by capability match
    const scored = configs.map(c => ({
      config: c,
      score: capabilities.filter(cap => c.capabilities.includes(cap)).length
    }))

    scored.sort((a, b) => b.score - a.score)

    return scored[0]?.config ?? null
  }

  /**
   * Unassign
   */
  unassign(sessionId: string): boolean {
    return this.assignments.delete(sessionId)
  }

  /**
   * Get stats
   */
  getStats(): {
    configsCount: number
    assignmentsCount: number
    byProvider: Record<string, number>
    activeAssignments: number
  } {
    const configs = Array.from(this.configs.values())
    const assignments = Array.from(this.assignments.values())

    const byProvider: Record<string, number> = {}
    for (const c of configs) {
      byProvider[c.provider] = (byProvider[c.provider] ?? 0) + 1
    }

    const activeThreshold = Date.now() - 60000
    const active = assignments.filter(a => a.lastUsed > activeThreshold).length

    return {
      configsCount: configs.length,
      assignmentsCount: assignments.length,
      byProvider,
      activeAssignments: active
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.configs.clear()
    this.assignments.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const teammateModel = new TeammateModel()

export default teammateModel