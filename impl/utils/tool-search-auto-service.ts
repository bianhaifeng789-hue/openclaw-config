// @ts-nocheck

/**
 * Tool Search Auto Pattern - 自动工具搜索
 * 
 * Source: Claude Code utils/toolSearchAuto.ts
 * Pattern: tool search auto + auto discovery + auto tool finding + intelligent search
 */

interface AutoSearchResult {
  query: string
  matchedTools: string[]
  score: number
  auto: boolean
  timestamp: number
}

class ToolSearchAutoService {
  private results: AutoSearchResult[] = []
  private searchCounter = 0
  private toolRegistry: string[] = []

  /**
   * Register tools
   */
  registerTools(tools: string[]): void {
    this.toolRegistry = tools
  }

  /**
   * Auto search
   */
  autoSearch(query: string): AutoSearchResult {
    const id = `auto-search-${++this.searchCounter}-${Date.now()}`

    const matchedTools = this.matchTools(query)
    const score = matchedTools.length > 0 ? 1 / matchedTools.length : 0

    const result: AutoSearchResult = {
      query,
      matchedTools,
      score,
      auto: true,
      timestamp: Date.now()
    }

    this.results.push(result)

    return result
  }

  /**
   * Match tools
   */
  private matchTools(query: string): string[] {
    const lowerQuery = query.toLowerCase()

    return this.toolRegistry
      .filter(tool => tool.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        const aScore = a.toLowerCase().indexOf(lowerQuery)
        const bScore = b.toLowerCase().indexOf(lowerQuery)
        return aScore - bScore
      })
  }

  /**
   * Suggest tools
   */
  suggest(query: string): string[] {
    const result = this.autoSearch(query)
    return result.matchedTools
  }

  /**
   * Get results
   */
  getResults(): AutoSearchResult[] {
    return [...this.results]
  }

  /**
   * Get recent results
   */
  getRecent(count: number = 10): AutoSearchResult[] {
    return this.results.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    searchesCount: number
    averageScore: number
    averageMatches: number
    uniqueQueries: number
  } {
    const avgScore = this.results.length > 0
      ? this.results.reduce((sum, r) => sum + r.score, 0) / this.results.length
      : 0

    const avgMatches = this.results.length > 0
      ? this.results.reduce((sum, r) => sum + r.matchedTools.length, 0) / this.results.length
      : 0

    const uniqueQueries = new Set(this.results.map(r => r.query)).size

    return {
      searchesCount: this.results.length,
      averageScore: avgScore,
      averageMatches: avgMatches,
      uniqueQueries: uniqueQueries
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.results = []
    this.searchCounter = 0
    this.toolRegistry = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const toolSearchAutoService = new ToolSearchAutoService()

export default toolSearchAutoService