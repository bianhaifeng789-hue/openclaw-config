// @ts-nocheck

/**
 * Project Onboarding Pattern - 项目入门
 * 
 * Source: Claude Code projectOnboardingState.ts
 * Pattern: onboarding + first-run + project setup + guide
 */

interface OnboardingStep {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
  order: number
}

interface ProjectOnboardingState {
  projectId: string
  steps: OnboardingStep[]
  startedAt: number | null
  completedAt: number | null
  skipped: boolean
}

class ProjectOnboarding {
  private states = new Map<string, ProjectOnboardingState>()
  private defaultSteps: OnboardingStep[] = [
    { id: 'welcome', title: 'Welcome', description: 'Introduction', completed: false, required: false, order: 0 },
    { id: 'config', title: 'Configuration', description: 'Setup config', completed: false, required: true, order: 1 },
    { id: 'tools', title: 'Tools', description: 'Configure tools', completed: false, required: true, order: 2 },
    { id: 'finish', title: 'Finish', description: 'Complete setup', completed: false, required: false, order: 3 }
  ]

  /**
   * Start onboarding
   */
  start(projectId: string): ProjectOnboardingState {
    const state: ProjectOnboardingState = {
      projectId,
      steps: this.defaultSteps.map(s => ({ ...s })),
      startedAt: Date.now(),
      completedAt: null,
      skipped: false
    }

    this.states.set(projectId, state)

    return state
  }

  /**
   * Complete step
   */
  completeStep(projectId: string, stepId: string): boolean {
    const state = this.states.get(projectId)
    if (!state) return false

    const step = state.steps.find(s => s.id === stepId)
    if (!step) return false

    step.completed = true

    this.checkCompletion(projectId)

    return true
  }

  /**
   * Skip onboarding
   */
  skip(projectId: string): boolean {
    const state = this.states.get(projectId)
    if (!state) return false

    state.skipped = true
    state.completedAt = Date.now()

    return true
  }

  /**
   * Check completion
   */
  private checkCompletion(projectId: string): void {
    const state = this.states.get(projectId)
    if (!state) return

    const requiredComplete = state.steps
      .filter(s => s.required)
      .every(s => s.completed)

    if (requiredComplete) {
      state.completedAt = Date.now()
    }
  }

  /**
   * Get state
   */
  getState(projectId: string): ProjectOnboardingState | undefined {
    return this.states.get(projectId)
  }

  /**
   * Get step
   */
  getStep(projectId: string, stepId: string): OnboardingStep | undefined {
    const state = this.states.get(projectId)
    return state?.steps.find(s => s.id === stepId)
  }

  /**
   * Get next step
   */
  getNextStep(projectId: string): OnboardingStep | null {
    const state = this.states.get(projectId)
    if (!state) return null

    const sorted = state.steps.sort((a, b) => a.order - b.order)

    return sorted.find(s => !s.completed) ?? null
  }

  /**
   * Get progress
   */
  getProgress(projectId: string): number {
    const state = this.states.get(projectId)
    if (!state) return 0

    const completed = state.steps.filter(s => s.completed).length
    const total = state.steps.length

    return completed / total
  }

  /**
   * Is completed
   */
  isCompleted(projectId: string): boolean {
    const state = this.states.get(projectId)
    return state?.completedAt !== null
  }

  /**
   * Is skipped
   */
  isSkipped(projectId: string): boolean {
    const state = this.states.get(projectId)
    return state?.skipped ?? false
  }

  /**
   * Reset for project
   */
  resetProject(projectId: string): boolean {
    const state = this.states.get(projectId)
    if (!state) return false

    state.steps = this.defaultSteps.map(s => ({ ...s }))
    state.startedAt = Date.now()
    state.completedAt = null
    state.skipped = false

    return true
  }

  /**
   * Get stats
   */
  getStats(): {
    projectsCount: number
    completedCount: number
    skippedCount: number
    averageProgress: number
  } {
    const states = Array.from(this.states.values())
    const completed = states.filter(s => s.completedAt !== null).length
    const skipped = states.filter(s => s.skipped).length
    const avgProgress = states.length > 0
      ? states.reduce((sum, s) => sum + this.getProgress(s.projectId), 0) / states.length
      : 0

    return {
      projectsCount: states.length,
      completedCount: completed,
      skippedCount: skipped,
      averageProgress: avgProgress
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.states.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const projectOnboarding = new ProjectOnboarding()

export default projectOnboarding