// @ts-nocheck

/**
 * JSON Utils Pattern - JSON工具
 * 
 * Source: Claude Code utils/json.ts
 * Pattern: JSON utils + JSON parsing + JSON handling + safe JSON
 */

interface JSONParseResult {
  success: boolean
  data?: any
  error?: string
  size?: number
  timestamp: number
}

class JSONUtilsService {
  private parseResults: JSONParseResult[] = []
  private parseCounter = 0

  /**
   * Safe parse
   */
  safeParse(json: string): JSONParseResult {
    const result: JSONParseResult = {
      success: false,
      timestamp: Date.now()
    }

    try {
      result.data = JSON.parse(json)
      result.success = true
      result.size = json.length
    } catch (e: any) {
      result.error = e.message
    }

    this.parseResults.push(result)

    return result
  }

  /**
   * Parse with reviver
   */
  parseWithReviver(json: string, reviver: (key: string, value: any) => any): JSONParseResult {
    const result: JSONParseResult = {
      success: false,
      timestamp: Date.now()
    }

    try {
      result.data = JSON.parse(json, reviver)
      result.success = true
      result.size = json.length
    } catch (e: any) {
      result.error = e.message
    }

    this.parseResults.push(result)

    return result
  }

  /**
   * Safe stringify
   */
  safeStringify(data: any, replacer?: any, space?: number): string {
    try {
      return JSON.stringify(data, replacer, space)
    } catch {
      return '{}'
    }
  }

  /**
   * Is valid JSON
   */
  isValid(json: string): boolean {
    try {
      JSON.parse(json)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get path
   */
  getPath(data: any, path: string): any {
    const keys = path.split('.')
    let current = data

    for (const key of keys) {
      if (current === undefined || current === null) return undefined
      current = current[key]
    }

    return current
  }

  /**
   * Set path
   */
  setPath(data: any, path: string, value: any): any {
    const keys = path.split('.')
    let current = data

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (current[key] === undefined) current[key] = {}
      current = current[key]
    }

    current[keys[keys.length - 1]] = value

    return data
  }

  /**
   * Get parse results
   */
  getParseResults(): JSONParseResult[] {
    return [...this.parseResults]
  }

  /**
   * Get stats
   */
  getStats(): {
    parseCount: number
    successCount: number
    failureCount: number
    averageSize: number
    successRate: number
  } {
    const avgSize = this.parseResults.length > 0
      ? this.parseResults.reduce((sum, r) => sum + (r.size ?? 0), 0) / this.parseResults.length
      : 0

    return {
      parseCount: this.parseResults.length,
      successCount: this.parseResults.filter(r => r.success).length,
      failureCount: this.parseResults.filter(r => !r.success).length,
      averageSize: avgSize,
      successRate: this.parseResults.length > 0
        ? this.parseResults.filter(r => r.success).length / this.parseResults.length
        : 0
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.parseResults = []
    this.parseCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const jsonUtilsService = new JSONUtilsService()

export default jsonUtilsService