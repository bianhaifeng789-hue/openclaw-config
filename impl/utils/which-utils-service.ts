// @ts-nocheck

/**
 * Which Utils Pattern - Which工具
 * 
 * Source: Claude Code utils/which.ts
 * Pattern: which utils + command finding + path lookup + executable discovery
 */

interface WhichResult {
  command: string
  path: string | null
  found: boolean
  timestamp: number
}

class WhichUtilsService {
  private searches: WhichResult[] = []
  private pathCache = new Map<string, string>()

  /**
   * Find command
   */
  which(command: string): WhichResult {
    const cached = this.pathCache.get(command)

    if (cached) {
      return {
        command,
        path: cached,
        found: true,
        timestamp: Date.now()
      }
    }

    // Would search PATH for actual executable
    // For demo, simulate
    const path = this.simulateWhich(command)

    if (path) {
      this.pathCache.set(command, path)
    }

    const result: WhichResult = {
      command,
      path,
      found: path !== null,
      timestamp: Date.now()
    }

    this.searches.push(result)

    return result
  }

  /**
   * Simulate which
   */
  private simulateWhich(command: string): string | null {
    const mockPaths = ['/usr/bin', '/usr/local/bin', '/bin']
    const mockCommands = ['node', 'npm', 'git', 'bash', 'sh']

    if (mockCommands.includes(command)) {
      return `/usr/bin/${command}`
    }

    return null
  }

  /**
   * Find all
   */
  whichAll(command: string): WhichResult[] {
    const results: WhichResult[] = []

    const mockPaths = ['/usr/bin', '/usr/local/bin', '/bin']

    for (const basePath of mockPaths) {
      results.push({
        command,
        path: `${basePath}/${command}`,
        found: true,
        timestamp: Date.now()
      })
    }

    return results
  }

  /**
   * Is available
   */
  isAvailable(command: string): boolean {
    return this.which(command).found
  }

  /**
   * Get searches
   */
  getSearches(): WhichResult[] {
    return [...this.searches]
  }

  /**
   * Get found commands
   */
  getFound(): WhichResult[] {
    return this.searches.filter(s => s.found)
  }

  /**
   * Get not found commands
   */
  getNotFound(): WhichResult[] {
    return this.searches.filter(s => !s.found)
  }

  /**
   * Get cache
   */
  getCache(): Record<string, string> {
    const result: Record<string, string> = {}

    for (const [key, value] of this.pathCache) {
      result[key] = value
    }

    return result
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.pathCache.clear()
  }

  /**
   * Get stats
   */
  getStats(): {
    searchesCount: number
    foundCount: number
    notFoundCount: number
    cacheSize: number
    successRate: number
  } {
    const found = this.searches.filter(s => s.found)

    return {
      searchesCount: this.searches.length,
      foundCount: found.length,
      notFoundCount: this.searches.filter(s => !s.found).length,
      cacheSize: this.pathCache.size,
      successRate: this.searches.length > 0 ? found.length / this.searches.length : 0
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.searches = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
    this.clearCache()
  }
}

// Global singleton
export const whichUtilsService = new WhichUtilsService()

export default whichUtilsService