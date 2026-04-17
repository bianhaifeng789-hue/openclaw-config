// @ts-nocheck

/**
 * Ripgrep Utils Pattern - Ripgrep工具
 * 
 * Source: Claude Code utils/ripgrep.ts + utils/ripgrep-spawn-patterns.ts
 * Pattern: ripgrep utils + search + spawn patterns + regex
 */

interface RipgrepOptions {
  pattern: string
  path?: string
  type?: string
  ignoreCase?: boolean
  multiline?: boolean
  maxResults?: number
}

interface RipgrepResult {
  file: string
  line: number
  column: number
  match: string
  context?: string
}

class RipgrepUtils {
  private searchHistory: Array<{ pattern: string; results: number; timestamp: number }> = []

  /**
   * Search with ripgrep
   */
  async search(options: RipgrepOptions): Promise<RipgrepResult[]> {
    // Would spawn ripgrep process
    // For demo, return simulated results
    const results: RipgrepResult[] = []

    const count = Math.min(options.maxResults ?? 50, 10)

    for (let i = 0; i < count; i++) {
      results.push({
        file: `file-${i}.ts`,
        line: i * 10 + 1,
        column: 5,
        match: options.pattern,
        context: `Context for match ${i}`
      })
    }

    this.searchHistory.push({
      pattern: options.pattern,
      results: results.length,
      timestamp: Date.now()
    })

    return results
  }

  /**
   * Build ripgrep command
   */
  buildCommand(options: RipgrepOptions): string[] {
    const args: string[] = ['rg']

    if (options.ignoreCase) args.push('-i')
    if (options.multiline) args.push('-U')
    if (options.type) args.push('-t', options.type)

    if (options.maxResults) {
      args.push('-m', options.maxResults.toString())
    }

    args.push('--json')

    args.push(options.pattern)

    if (options.path) args.push(options.path)

    return args
  }

  /**
   * Search files
   */
  async searchFiles(pattern: string, path?: string): Promise<string[]> {
    const results = await this.search({ pattern, path, maxResults: 100 })

    return results.map(r => r.file)
  }

  /**
   * Search content
   */
  async searchContent(pattern: string, path?: string): Promise<RipgrepResult[]> {
    return this.search({ pattern, path, ignoreCase: true })
  }

  /**
   * Parse ripgrep JSON output
   */
  parseOutput(line: string): RipgrepResult | null {
    try {
      const parsed = JSON.parse(line)

      if (parsed.type === 'match') {
        return {
          file: parsed.data.path.text,
          line: parsed.data.line_number,
          column: parsed.data.submatches[0]?.start ?? 0,
          match: parsed.data.lines.text,
          context: undefined
        }
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Get search history
   */
  getHistory(): Array<{ pattern: string; results: number; timestamp: number }> {
    return [...this.searchHistory]
  }

  /**
   * Get stats
   */
  getStats(): {
    searchesCount: number
    totalResults: number
    uniquePatterns: number
  } {
    const totalResults = this.searchHistory.reduce((sum, h) => sum + h.results, 0)
    const uniquePatterns = new Set(this.searchHistory.map(h => h.pattern)).size

    return {
      searchesCount: this.searchHistory.length,
      totalResults,
      uniquePatterns
    }
  }

  /**
   * Clear history
   */
  clear(): void {
    this.searchHistory = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const ripgrepUtils = new RipgrepUtils()

export default ripgrepUtils