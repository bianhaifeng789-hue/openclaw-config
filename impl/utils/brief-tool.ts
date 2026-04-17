// @ts-nocheck

/**
 * Brief Tool Pattern - Brief工具
 * 
 * Source: Claude Code tools/BriefTool/BriefTool.ts + tools/BriefTool/prompt.ts
 * Pattern: brief tool + summary generation + context brief + concise output
 */

interface BriefResult {
  input: string
  brief: string
  keyPoints: string[]
  context: string
  generatedAt: number
}

class BriefTool {
  private briefs: BriefResult[] = []
  private briefCounter = 0
  private maxLength = 200

  /**
   * Generate brief
   */
  generate(input: string, context?: string): BriefResult {
    const id = ++this.briefCounter

    // Would use AI for brief generation
    // For demo, truncate and extract key points
    const brief = this.truncateBrief(input)
    const keyPoints = this.extractKeyPoints(input)

    const result: BriefResult = {
      input,
      brief,
      keyPoints,
      context: context ?? '',
      generatedAt: Date.now()
    }

    this.briefs.push(result)

    return result
  }

  /**
   * Truncate brief
   */
  private truncateBrief(input: string): string {
    const words = input.split(' ')
    const truncated = words.slice(0, 50).join(' ')

    return truncated.length > this.maxLength
      ? truncated.slice(0, this.maxLength) + '...'
      : truncated
  }

  /**
   * Extract key points
   */
  private extractKeyPoints(input: string): string[] {
    // Would use NLP/AI
    // For demo, extract first sentences
    const sentences = input.split(/[.!?]+/).filter(s => s.trim().length > 0)

    return sentences.slice(0, 5).map(s => s.trim())
  }

  /**
   * Set max length
   */
  setMaxLength(length: number): void {
    this.maxLength = length
  }

  /**
   * Get max length
   */
  getMaxLength(): number {
    return this.maxLength
  }

  /**
   * Get brief
   */
  getBrief(id: number): BriefResult | undefined {
    return this.briefs.find(b => b.input.includes(`brief-${id}`))
  }

  /**
   * Get all briefs
   */
  getAllBriefs(): BriefResult[] {
    return [...this.briefs]
  }

  /**
   * Get recent briefs
   */
  getRecent(count: number = 5): BriefResult[] {
    return this.briefs.slice(-count)
  }

  /**
   * Clear briefs
   */
  clear(): void {
    this.briefs = []
    this.briefCounter = 0
  }

  /**
   * Get stats
   */
  getStats(): {
    briefsCount: number
    averageKeyPoints: number
    averageBriefLength: number
  } {
    const briefs = this.briefs

    return {
      briefsCount: briefs.length,
      averageKeyPoints: briefs.length > 0
        ? briefs.reduce((sum, b) => sum + b.keyPoints.length, 0) / briefs.length
        : 0,
      averageBriefLength: briefs.length > 0
        ? briefs.reduce((sum, b) => sum + b.brief.length, 0) / briefs.length
        : 0
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.maxLength = 200
  }
}

// Global singleton
export const briefTool = new BriefTool()

export default briefTool