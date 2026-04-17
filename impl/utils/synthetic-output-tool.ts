// @ts-nocheck

/**
 * Synthetic Output Tool Pattern - 合成输出工具
 * 
 * Source: Claude Code tools/SyntheticOutputTool/SyntheticOutputTool.ts
 * Pattern: synthetic output + mock output + test output + simulated results
 */

interface SyntheticOutput {
  id: string
  type: 'mock' | 'test' | 'simulation'
  output: string
  metadata: Record<string, any>
  createdAt: number
}

class SyntheticOutputTool {
  private outputs: SyntheticOutput[] = []
  private outputCounter = 0

  /**
   * Generate synthetic output
   */
  generate(type: SyntheticOutput['type'], template: string, metadata?: Record<string, any>): SyntheticOutput {
    const id = `synthetic-${++this.outputCounter}-${Date.now()}`

    const output: SyntheticOutput = {
      id,
      type,
      output: this.applyTemplate(template, metadata),
      metadata: metadata ?? {},
      createdAt: Date.now()
    }

    this.outputs.push(output)

    return output
  }

  /**
   * Apply template
   */
  private applyTemplate(template: string, metadata?: Record<string, any>): string {
    if (!metadata) return template

    let result = template

    for (const [key, value] of Object.entries(metadata)) {
      result = result.replace(`{{${key}}}`, String(value))
    }

    return result
  }

  /**
   * Generate mock
   */
  generateMock(template: string, metadata?: Record<string, any>): SyntheticOutput {
    return this.generate('mock', template, metadata)
  }

  /**
   * Generate test
   */
  generateTest(template: string, metadata?: Record<string, any>): SyntheticOutput {
    return this.generate('test', template, metadata)
  }

  /**
   * Generate simulation
   */
  generateSimulation(template: string, metadata?: Record<string, any>): SyntheticOutput {
    return this.generate('simulation', template, metadata)
  }

  /**
   * Get outputs
   */
  getOutputs(): SyntheticOutput[] {
    return [...this.outputs]
  }

  /**
   * Get outputs by type
   */
  getByType(type: SyntheticOutput['type']): SyntheticOutput[] {
    return this.outputs.filter(o => o.type === type)
  }

  /**
   * Get recent outputs
   */
  getRecent(count: number = 10): SyntheticOutput[] {
    return this.outputs.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    outputsCount: number
    byType: Record<SyntheticOutput['type'], number>
    averageOutputLength: number
  } {
    const byType: Record<SyntheticOutput['type'], number> = {
      mock: 0, test: 0, simulation: 0
    }

    for (const output of this.outputs) byType[output.type]++

    const avgLength = this.outputs.length > 0
      ? this.outputs.reduce((sum, o) => sum + o.output.length, 0) / this.outputs.length
      : 0

    return {
      outputsCount: this.outputs.length,
      byType,
      averageOutputLength: avgLength
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.outputs = []
    this.outputCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const syntheticOutputTool = new SyntheticOutputTool()

export default syntheticOutputTool