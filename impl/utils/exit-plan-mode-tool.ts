// @ts-nocheck

/**
 * Exit Plan Mode Tool Pattern - 退出计划模式工具
 * 
 * Source: Claude Code tools/ExitPlanModeTool/ExitPlanModeTool.ts + tools/ExitPlanModeV2Tool/ExitPlanModeV2Tool.ts
 * Pattern: exit plan mode + mode switching + completion + cleanup
 */

interface ExitPlanModeResult {
  planId: string
  success: boolean
  summary: string
  stepsCompleted: number
  stepsTotal: number
  timestamp: number
}

class ExitPlanModeTool {
  private exits: ExitPlanModeResult[] = []

  /**
   * Exit plan mode
   */
  exit(): ExitPlanModeResult | null {
    const current = enterPlanModeTool.getCurrentPlan()

    if (!current) return null

    const completed = current.steps.filter(s => s.status === 'completed').length
    const total = current.steps.length

    const result: ExitPlanModeResult = {
      planId: current.id,
      success: completed === total,
      summary: `Completed ${completed}/${total} steps`,
      stepsCompleted: completed,
      stepsTotal: total,
      timestamp: Date.now()
    }

    current.active = false
    this.exits.push(result)

    enterPlanModeTool.currentPlan = null

    return result
  }

  /**
   * Exit with summary
   */
  exitWithSummary(summary: string): ExitPlanModeResult | null {
    const result = this.exit()

    if (result) {
      result.summary = summary
    }

    return result
  }

  /**
   * Force exit
   */
  forceExit(): ExitPlanModeResult | null {
    const current = enterPlanModeTool.getCurrentPlan()

    if (!current) return null

    const result: ExitPlanModeResult = {
      planId: current.id,
      success: false,
      summary: 'Force exited',
      stepsCompleted: current.steps.filter(s => s.status === 'completed').length,
      stepsTotal: current.steps.length,
      timestamp: Date.now()
    }

    current.active = false
    this.exits.push(result)

    enterPlanModeTool.currentPlan = null

    return result
  }

  /**
   * Get exits
   */
  getExits(): ExitPlanModeResult[] {
    return [...this.exits]
  }

  /**
   * Get recent exits
   */
  getRecent(count: number = 10): ExitPlanModeResult[] {
    return this.exits.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    exitsCount: number
    successfulExits: number
    forceExits: number
    averageCompletionRate: number
  } {
    const successful = this.exits.filter(e => e.success)
    const avgCompletion = this.exits.length > 0
      ? this.exits.reduce((sum, e) => sum + (e.stepsCompleted / e.stepsTotal), 0) / this.exits.length
      : 0

    return {
      exitsCount: this.exits.length,
      successfulExits: successful.length,
      forceExits: this.exits.filter(e => e.summary === 'Force exited').length,
      averageCompletionRate: avgCompletion
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.exits = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const exitPlanModeTool = new ExitPlanModeTool()

// Import enterPlanModeTool
import { enterPlanModeTool } from './enter-plan-mode-tool'

export default exitPlanModeTool