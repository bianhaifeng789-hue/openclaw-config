// @ts-nocheck

/**
 * Coordinator Mode Pattern - 协调模式
 * 
 * Source: Claude Code coordinator/coordinatorMode.ts + state/AppState.tsx
 * Pattern: coordinator mode + multi-agent + swarm + task distribution
 */

interface CoordinatorState {
  mode: 'single' | 'multi' | 'swarm'
  agents: Array<{ id: string; role: string; status: string }>
  tasks: Array<{ id: string; assignee: string; status: string }>
  createdAt: number
  updatedAt: number
}

class CoordinatorModeService {
  private state: CoordinatorState = {
    mode: 'single',
    agents: [],
    tasks: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  /**
   * Set mode
   */
  setMode(mode: CoordinatorState['mode']): void {
    this.state.mode = mode
    this.state.updatedAt = Date.now()
  }

  /**
   * Get mode
   */
  getMode(): CoordinatorState['mode'] {
    return this.state.mode
  }

  /**
   * Is single mode
   */
  isSingle(): boolean {
    return this.state.mode === 'single'
  }

  /**
   * Is multi mode
   */
  isMulti(): boolean {
    return this.state.mode === 'multi'
  }

  /**
   * Is swarm mode
   */
  isSwarm(): boolean {
    return this.state.mode === 'swarm'
  }

  /**
   * Add agent
   */
  addAgent(id: string, role: string): void {
    this.state.agents.push({
      id,
      role,
      status: 'idle'
    })

    this.state.updatedAt = Date.now()
  }

  /**
   * Remove agent
   */
  removeAgent(id: string): boolean {
    const index = this.state.agents.findIndex(a => a.id === id)
    if (index === -1) return false

    this.state.agents.splice(index, 1)
    this.state.updatedAt = Date.now()

    return true
  }

  /**
   * Update agent status
   */
  updateAgentStatus(id: string, status: string): boolean {
    const agent = this.state.agents.find(a => a.id === id)
    if (!agent) return false

    agent.status = status
    this.state.updatedAt = Date.now()

    return true
  }

  /**
   * Add task
   */
  addTask(id: string, assignee: string): void {
    this.state.tasks.push({
      id,
      assignee,
      status: 'pending'
    })

    this.state.updatedAt = Date.now()
  }

  /**
   * Complete task
   */
  completeTask(id: string): boolean {
    const task = this.state.tasks.find(t => t.id === id)
    if (!task) return false

    task.status = 'completed'
    this.state.updatedAt = Date.now()

    return true
  }

  /**
   * Get state
   */
  getState(): CoordinatorState {
    return { ...this.state }
  }

  /**
   * Get agents
   */
  getAgents(): Array<{ id: string; role: string; status: string }> {
    return [...this.state.agents]
  }

  /**
   * Get tasks
   */
  getTasks(): Array<{ id: string; assignee: string; status: string }> {
    return [...this.state.tasks]
  }

  /**
   * Get active agents
   */
  getActiveAgents(): Array<{ id: string; role: string; status: string }> {
    return this.state.agents.filter(a => a.status !== 'idle')
  }

  /**
   * Get pending tasks
   */
  getPendingTasks(): Array<{ id: string; assignee: string; status: string }> {
    return this.state.tasks.filter(t => t.status === 'pending')
  }

  /**
   * Get stats
   */
  getStats(): {
    mode: string
    agentsCount: number
    activeAgentsCount: number
    tasksCount: number
    pendingTasksCount: number
  } {
    return {
      mode: this.state.mode,
      agentsCount: this.state.agents.length,
      activeAgentsCount: this.getActiveAgents().length,
      tasksCount: this.state.tasks.length,
      pendingTasksCount: this.getPendingTasks().length
    }
  }

  /**
   * Reset state
   */
  reset(): void {
    this.state = {
      mode: 'single',
      agents: [],
      tasks: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.reset()
  }
}

// Global singleton
export const coordinatorModeService = new CoordinatorModeService()

export default coordinatorModeService