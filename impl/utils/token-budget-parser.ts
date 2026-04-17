// @ts-nocheck

/**
 * Token Budget Parser Pattern - Token预算解析器
 * 
 * Source: Claude Code utils/tokenBudgetParser.ts
 * Pattern: parseBudget + budget markers + regex patterns + token counting + fallback
 */

type BudgetType = 'absolute' | 'percentage' | 'remaining'

interface TokenBudget {
  type: BudgetType
  value: number
  source: string
}

interface BudgetParseResult {
  budget: TokenBudget | null
  warning?: string
}

class TokenBudgetParser {
  private config = {
    defaultBudget: 100000,
    maxBudget: 1000000,
    minBudget: 1000
  }

  /**
   * Parse budget from string
   * Supports: "100k", "50%", "remaining", "auto"
   */
  parseBudget(input: string | undefined | null): BudgetParseResult {
    if (!input) {
      return {
        budget: {
          type: 'absolute',
          value: this.config.defaultBudget,
          source: 'default'
        }
      }
    }

    const trimmed = input.trim().toLowerCase()

    // Parse absolute tokens (e.g., "100k", "50000")
    const absoluteMatch = trimmed.match(/^(\d+(?:\.\d+)?)(k|m)?$/)
    if (absoluteMatch) {
      const num = parseFloat(absoluteMatch[1]!)
      const multiplier = absoluteMatch[2] === 'k' ? 1000 : absoluteMatch[2] === 'm' ? 1000000 : 1
      const value = Math.floor(num * multiplier)

      return this.validateBudget({
        type: 'absolute',
        value,
        source: input
      })
    }

    // Parse percentage (e.g., "50%", "75%")
    const percentageMatch = trimmed.match(/^(\d+(?:\.\d+)?)%$/)
    if (percentageMatch) {
      const value = parseFloat(percentageMatch[1]!)

      return this.validateBudget({
        type: 'percentage',
        value,
        source: input
      })
    }

    // Parse remaining (use all remaining tokens)
    if (trimmed === 'remaining' || trimmed === 'auto') {
      return {
        budget: {
          type: 'remaining',
          value: 100, // Will be calculated at runtime
          source: input
        }
      }
    }

    // Unknown format
    return {
      budget: null,
      warning: `Unknown budget format: ${input}`
    }
  }

  /**
   * Validate budget within limits
   */
  private validateBudget(budget: TokenBudget): BudgetParseResult {
    if (budget.type === 'absolute') {
      if (budget.value < this.config.minBudget) {
        return {
          budget: {
            ...budget,
            value: this.config.minBudget
          },
          warning: `Budget ${budget.value} below minimum, using ${this.config.minBudget}`
        }
      }

      if (budget.value > this.config.maxBudget) {
        return {
          budget: {
            ...budget,
            value: this.config.maxBudget
          },
          warning: `Budget ${budget.value} above maximum, using ${this.config.maxBudget}`
        }
      }
    }

    if (budget.type === 'percentage') {
      if (budget.value > 100) {
        return {
          budget: {
            ...budget,
            value: 100
          },
          warning: `Percentage ${budget.value}% exceeds 100%, using 100%`
        }
      }
    }

    return { budget }
  }

  /**
   * Calculate effective budget
   */
  calculateEffectiveBudget(budget: TokenBudget, totalTokens: number, usedTokens: number): number {
    switch (budget.type) {
      case 'absolute':
        return Math.min(budget.value, totalTokens - usedTokens)

      case 'percentage':
        const percentageValue = Math.floor((budget.value / 100) * (totalTokens - usedTokens))
        return Math.max(percentageValue, this.config.minBudget)

      case 'remaining':
        return totalTokens - usedTokens

      default:
        return this.config.defaultBudget
    }
  }

  /**
   * Format budget for display
   */
  formatBudget(budget: TokenBudget): string {
    switch (budget.type) {
      case 'absolute':
        if (budget.value >= 1000000) {
          return `${budget.value / 1000000}M`
        }
        if (budget.value >= 1000) {
          return `${budget.value / 1000}k`
        }
        return budget.value.toString()

      case 'percentage':
        return `${budget.value}%`

      case 'remaining':
        return 'remaining'

      default:
        return 'unknown'
    }
  }

  /**
   * Parse multiple budget sources (priority)
   */
  parseFromSources(sources: Array<{ value: string | undefined; source: string }>): TokenBudget {
    for (const { value, source } of sources) {
      const result = this.parseBudget(value)
      if (result.budget) {
        return { ...result.budget, source }
      }
    }

    return {
      type: 'absolute',
      value: this.config.defaultBudget,
      source: 'fallback'
    }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<typeof this.config>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get config
   */
  getConfig(): typeof this.config {
    return { ...this.config }
  }
}

// Global singleton
export const tokenBudgetParser = new TokenBudgetParser()

export default tokenBudgetParser