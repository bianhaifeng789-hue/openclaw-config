// @ts-nocheck

/**
 * Agent Tool Pattern - Agent工具
 * 
 * Source: Claude Code tools/AgentTool/AgentTool.ts + tools/AgentTool/AgentTool.tsx
 * Pattern: agent tool + agent spawning + agent management + multi-agent
 */

interface AgentInstance {
  id: string
  name: string
  status: 'idle' | 'active' | 'completed' | 'failed'
  task: string
  result?: string
  createdAt: number
  completedAt?: number
}

class AgentTool {
  private agents = new Map<string, AgentInstance>()
  private agentCounter = 0
  private activeAgents: string[] = []

  /**
   * Spawn agent
   */
  spawn(name: string, task: string): AgentInstance {
    const id = `agent-${++this.agentCounter}-${Date.now()}`

    const agent: AgentInstance = {
      id,
      name,
      status: 'active',
      task,
      createdAt: Date.now()
    }

    this.agents.set(id, agent)
    this.activeAgents.push(id)

    return agent
  }

  /**
   * Get agent
   */
  getAgent(id: string): AgentInstance | undefined {
    return this.agents.get(id)
  }

  /**
   * Complete agent
   */
  complete(id: string, result?: string): boolean {
    const agent = this.agents.get(id)
    if (!agent || agent.status !== 'active') return false

    agent.status = 'completed'
    agent.result = result ?? ''
    agent.completedAt = Date.now()

    const index = this.activeAgents.indexOf(id)
    if (index !== -1) this.activeAgents.splice(index, 1)

    return true
  }

  /**
   * Fail agent
   */
  fail(id: string, reason?: string): boolean {
    const agent = this.agents.get(id)
    if (!agent || agent.status !== 'active') return false

    agent.status = 'failed'
    agent.result = reason ?? ''
    agent.completedAt = Date.now()

    const index = this.activeAgents.indexOf(id)
    if (index !== -1) this.activeAgents.splice(index, 1)

    return true
  }

  /**
   * Stop agent
   */
  stop(id: string): boolean {
    return this.fail(id, 'Stopped by user')
  }

  /**
   * Get active agents
   */
  getActive(): AgentInstance[] {
    return this.activeAgents
      .map(id => this.agents.get(id))
      .filter(a => a !== undefined) as AgentInstance[]
  }

  /**
   * Get completed agents
   */
  getCompleted(): AgentInstance[] {
    return Array.from(this.agents.values())
      .filter(a => a.status === 'completed')
  }

  /**
   * Get failed agents
   */
  getFailed(): AgentInstance[] {
    return Array.from(this.agents.values())
      .filter(a => a.status === 'failed')
  }

  /**
   * Get all agents
   */
  getAll(): AgentInstance[] {
    return Array.from(this.agents.values())
  }

  /**
   * Get stats
   */
  getStats(): {
    agentsCount: number
    activeCount: number
    completedCount: number
    failedCount: number
    successRate: number
  } {
    const agents = Array.from(this.agents.values())
    const completed = agents.filter(a => a.status === 'completed')
    const failed = agents.filter(a => a.status === 'failed')

    return {
      agentsCount: agents.length,
      activeCount: this.activeAgents.length,
      completedCount: completed.length,
      failedCount: failed.length,
      successRate: (completed.length + failed.length) > 0 ? completed.length / (completed.length + failed.length) : 0
    }
  }

  /**
   * Clear completed
   */
  clearCompleted(): number {
    const completed = this.getCompleted()
    const failed = this.getFailed()

    for (const agent of completed) {
      this.agents.delete(agent.id)
    }

    for (const agent of failed) {
      this.agents.delete(agent.id)
    }

    return completed.length + failed.length
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.agents.clear()
    this.activeAgents = []
    this.agentCounter = 0
  }
}

// Global singleton
export const agentTool = new AgentTool()

export default agentTool