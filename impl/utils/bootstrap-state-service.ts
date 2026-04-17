// @ts-nocheck

/**
 * Bootstrap State Pattern - Bootstrap状态
 * 
 * Source: Claude Code bootstrap/state.ts
 * Pattern: bootstrap state + initialization + startup tracking
 */

interface BootstrapStep {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  durationMs: number | null
  error?: string
}

interface BootstrapState {
  steps: BootstrapStep[]
  startTime: number
  endTime: number | null
  overallStatus: 'initializing' | 'ready' | 'failed'
}

class BootstrapStateService {
  private state: BootstrapState = {
    steps: [],
    startTime: 0,
    endTime: null,
    overallStatus: 'initializing'
  }

  /**
   * Start bootstrap
   */
  start(): void {
    this.state.startTime = Date.now()
    this.state.overallStatus = 'initializing'
  }

  /**
   * Add step
   */
  addStep(id: string, name: string): BootstrapStep {
    const step: BootstrapStep = {
      id,
      name,
      status: 'pending',
      durationMs: null
    }

    this.state.steps.push(step)

    return step
  }

  /**
   * Start step
   */
  startStep(id: string): boolean {
    const step = this.state.steps.find(s => s.id === id)
    if (!step) return false

    step.status = 'running'

    return true
  }

  /**
   * Complete step
   */
  completeStep(id: string): boolean {
    const step = this.state.steps.find(s => s.id === id)
    if (!step) return false

    step.status = 'completed'
    step.durationMs = Date.now() - this.state.startTime

    this.checkOverallStatus()

    return true
  }

  /**
   * Fail step
   */
  failStep(id: string, error?: string): boolean {
    const step = this.state.steps.find(s => s.id === id)
    if (!step) return false

    step.status = 'failed'
    step.error = error
    step.durationMs = Date.now() - this.state.startTime

    this.state.overallStatus = 'failed'

    return true
  }

  /**
   * Check overall status
   */
  private checkOverallStatus(): void {
    const allCompleted = this.state.steps.every(s => s.status === 'completed')

    if (allCompleted) {
      this.state.endTime = Date.now()
      this.state.overallStatus = 'ready'
    }
  }

  /**
   * Get state
   */
  getState(): BootstrapState {
    return { ...this.state }
  }

  /**
   * Get step
   */
  getStep(id: string): BootstrapStep | undefined {
    return this.state.steps.find(s => s.id === id)
  }

  /**
   * Get pending steps
   */
  getPendingSteps(): BootstrapStep[] {
    return this.state.steps.filter(s => s.status === 'pending')
  }

  /**
   * Get running steps
   */
  getRunningSteps(): BootstrapStep[] {
    return this.state.steps.filter(s => s.status === 'running')
  }

  /**
   * Get completed steps
   */
  getCompletedSteps(): BootstrapStep[] {
    return this.state.steps.filter(s => s.status === 'completed')
  }

  /**
   * Get failed steps
   */
  getFailedSteps(): BootstrapStep[] {
    return this.state.steps.filter(s => s.status === 'failed')
  }

  /**
   * Get progress
   */
  getProgress(): number {
    const completed = this.state.steps.filter(s => s.status === 'completed').length
    const total = this.state.steps.length

    return total > 0 ? completed / total : 0
  }

  /**
   * Is ready
   */
  isReady(): boolean {
    return this.state.overallStatus === 'ready'
  }

  /**
   * Get total duration
   */
  getTotalDuration(): number | null {
    if (!this.state.endTime) return null

    return this.state.endTime - this.state.startTime
  }

  /**
   * Reset
   */
  reset(): void {
    this.state = {
      steps: [],
      startTime: 0,
      endTime: null,
      overallStatus: 'initializing'
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    stepsCount: number
    completedCount: number
    failedCount: number
    progress: number
    totalDurationMs: number | null
  } {
    return {
      stepsCount: this.state.steps.length,
      completedCount: this.getCompletedSteps().length,
      failedCount: this.getFailedSteps().length,
      progress: this.getProgress(),
      totalDurationMs: this.getTotalDuration()
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
export const bootstrapStateService = new BootstrapStateService()

export default bootstrapStateService