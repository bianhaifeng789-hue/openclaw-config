// @ts-nocheck

/**
 * Tool Result Storage Pattern - 工具结果存储
 * 
 * Source: Claude Code utils/toolResultStorage.ts
 * Pattern: tool result caching + retrieval + expiration + size limits
 */

interface ToolResult {
  toolId: string
  toolName: string
  input: Record<string, any>
  output: any
  timestamp: number
  sessionId: string
  durationMs: number
  success: boolean
  error?: string
}

class ToolResultStorage {
  private results = new Map<string, ToolResult>()
  private sessionResults = new Map<string, string[]>() // sessionId -> result IDs
  private maxResults = 100
  private maxResultSize = 50 * 1024 // 50KB
  private resultIdCounter = 0

  /**
   * Store tool result
   */
  store(result: Omit<ToolResult, 'timestamp'>): string {
    const id = `result-${++this.resultIdCounter}-${Date.now()}`

    const fullResult: ToolResult = {
      ...result,
      timestamp: Date.now()
    }

    // Check size
    const serialized = JSON.stringify(fullResult)
    if (serialized.length > this.maxResultSize) {
      // Truncate output
      fullResult.output = this.truncateOutput(fullResult.output)
    }

    this.ensureCapacity()
    this.results.set(id, fullResult)

    // Track by session
    const sessionIds = this.sessionResults.get(result.sessionId) ?? []
    sessionIds.push(id)
    this.sessionResults.set(result.sessionId, sessionIds)

    return id
  }

  /**
   * Truncate large output
   */
  private truncateOutput(output: any): any {
    if (typeof output === 'string') {
      return output.slice(0, this.maxResultSize) + '... [truncated]'
    }

    if (typeof output === 'object') {
      const serialized = JSON.stringify(output)
      if (serialized.length > this.maxResultSize) {
        return { truncated: true, preview: serialized.slice(0, 1000) }
      }
    }

    return output
  }

  /**
   * Get result by ID
   */
  get(id: string): ToolResult | undefined {
    return this.results.get(id)
  }

  /**
   * Get results for session
   */
  getForSession(sessionId: string): ToolResult[] {
    const ids = this.sessionResults.get(sessionId) ?? []
    return ids.map(id => this.results.get(id)).filter(Boolean) as ToolResult[]
  }

  /**
   * Get results for tool
   */
  getForTool(toolName: string): ToolResult[] {
    return Array.from(this.results.values())
      .filter(r => r.toolName === toolName)
  }

  /**
   * Get recent results
   */
  getRecent(count: number): ToolResult[] {
    return Array.from(this.results.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, count)
  }

  /**
   * Clear results for session
   */
  clearForSession(sessionId: string): number {
    const ids = this.sessionResults.get(sessionId) ?? []
    let cleared = 0

    for (const id of ids) {
      if (this.results.delete(id)) cleared++
    }

    this.sessionResults.delete(sessionId)

    return cleared
  }

  /**
   * Ensure capacity
   */
  private ensureCapacity(): void {
    while (this.results.size >= this.maxResults) {
      // Evict oldest
      const oldestId = Array.from(this.results.keys())[0]
      if (oldestId) {
        const result = this.results.get(oldestId)

        // Remove from session tracking
        if (result) {
          const sessionIds = this.sessionResults.get(result.sessionId) ?? []
          const filtered = sessionIds.filter(id => id !== oldestId)
          this.sessionResults.set(result.sessionId, filtered)
        }

        this.results.delete(oldestId)
      }
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    totalResults: number
    maxResults: number
    sessionCount: number
    averageDuration: number
    successRate: number
  } {
    const results = Array.from(this.results.values())
    const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0)
    const successCount = results.filter(r => r.success).length

    return {
      totalResults: results.length,
      maxResults: this.maxResults,
      sessionCount: this.sessionResults.size,
      averageDuration: results.length > 0 ? totalDuration / results.length : 0,
      successRate: results.length > 0 ? successCount / results.length : 0
    }
  }

  /**
   * Set max results
   */
  setMaxResults(max: number): void {
    this.maxResults = max
    this.ensureCapacity()
  }

  /**
   * Clear all
   */
  clear(): void {
    this.results.clear()
    this.sessionResults.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.resultIdCounter = 0
    this.maxResults = 100
    this.maxResultSize = 50 * 1024
  }
}

// Global singleton
export const toolResultStorage = new ToolResultStorage()

export default toolResultStorage