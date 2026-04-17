// @ts-nocheck

/**
 * Tools Utils Pattern - 工具通用方法
 * 
 * Source: Claude Code tools/utils.ts
 * Pattern: tools utils + tool utilities + common methods + helper functions
 */

interface ToolUtilsResult {
  action: string
  success: boolean
  data?: any
  error?: string
  timestamp: number
}

class ToolsUtils {
  private results: ToolUtilsResult[] = []

  /**
   * Validate tool input
   */
  validateInput(input: any, schema?: any): ToolUtilsResult {
    const result: ToolUtilsResult = {
      action: 'validateInput',
      success: true,
      timestamp: Date.now()
    }

    try {
      // Would validate against schema
      result.data = { input, validated: true }
    } catch (e: any) {
      result.success = false
      result.error = e.message
    }

    this.results.push(result)

    return result
  }

  /**
   * Format tool output
   */
  formatOutput(output: any): string {
    return JSON.stringify(output)
  }

  /**
   * Parse tool input
   */
  parseInput(input: string): any {
    try {
      return JSON.parse(input)
    } catch {
      return { raw: input }
    }
  }

  /**
   * Merge tool results
   */
  mergeResults(results: any[]): any {
    return results.reduce((acc, r) => ({ ...acc, ...r }), {})
  }

  /**
   * Get results
   */
  getResults(): ToolUtilsResult[] {
    return [...this.results]
  }

  /**
   * Get recent results
   */
  getRecent(count: number = 10): ToolUtilsResult[] {
    return this.results.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    resultsCount: number
    successfulCount: number
    failedCount: number
  } {
    return {
      resultsCount: this.results.length,
      successfulCount: this.results.filter(r => r.success).length,
      failedCount: this.results.filter(r => !r.success).length
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.results = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const toolsUtils = new ToolsUtils()

export default toolsUtils