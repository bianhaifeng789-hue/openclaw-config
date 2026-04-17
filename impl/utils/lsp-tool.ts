// @ts-nocheck

/**
 * LSP Tool Pattern - LSP工具
 * 
 * Source: Claude Code tools/LSPTool/LSPTool.ts
 * Pattern: LSP tool + language server integration + diagnostics + features
 */

interface LSPToolResult {
  action: string
  file: string
  position?: { line: number; character: number }
  result: any
  timestamp: number
}

class LSPTool {
  private results: LSPToolResult[] = []
  private lspClient: LSPClientService | null = null

  /**
   * Initialize
   */
  initialize(client: LSPClientService): void {
    this.lspClient = client
  }

  /**
   * Get diagnostics
   */
  diagnostics(filePath: string): LSPToolResult {
    const diagnostics = this.lspClient?.getDiagnostics(filePath) ?? []

    const result: LSPToolResult = {
      action: 'diagnostics',
      file: filePath,
      result: diagnostics,
      timestamp: Date.now()
    }

    this.results.push(result)

    return result
  }

  /**
   * Get completions
   */
  completions(filePath: string, line: number, character: number): LSPToolResult {
    const completions = this.lspClient?.requestCompletions(filePath, { line, character }) ?? []

    const result: LSPToolResult = {
      action: 'completions',
      file: filePath,
      position: { line, character },
      result: completions,
      timestamp: Date.now()
    }

    this.results.push(result)

    return result
  }

  /**
   * Get hover
   */
  hover(filePath: string, line: number, character: number): LSPToolResult {
    const hoverInfo = this.lspClient?.requestHover(filePath, { line, character }) ?? null

    const result: LSPToolResult = {
      action: 'hover',
      file: filePath,
      position: { line, character },
      result: hoverInfo,
      timestamp: Date.now()
    }

    this.results.push(result)

    return result
  }

  /**
   * Get definition
   */
  definition(filePath: string, line: number, character: number): LSPToolResult {
    const definitions = this.lspClient?.requestDefinition(filePath, { line, character }) ?? null

    const result: LSPToolResult = {
      action: 'definition',
      file: filePath,
      position: { line, character },
      result: definitions,
      timestamp: Date.now()
    }

    this.results.push(result)

    return result
  }

  /**
   * Get results
   */
  getResults(): LSPToolResult[] {
    return [...this.results]
  }

  /**
   * Get results by action
   */
  getByAction(action: string): LSPToolResult[] {
    return this.results.filter(r => r.action === action)
  }

  /**
   * Get recent results
   */
  getRecent(count: number = 10): LSPToolResult[] {
    return this.results.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    resultsCount: number
    byAction: Record<string, number>
    averageResultSize: number
  } {
    const byAction: Record<string, number> = {}

    for (const result of this.results) {
      byAction[result.action] = (byAction[result.action] ?? 0) + 1
    }

    const avgSize = this.results.length > 0
      ? this.results.reduce((sum, r) => sum + JSON.stringify(r.result).length, 0) / this.results.length
      : 0

    return {
      resultsCount: this.results.length,
      byAction,
      averageResultSize: avgSize
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
    this.lspClient = null
  }
}

// Global singleton
export const lspTool = new LSPTool()

// Import LSPClientService type
import { LSPClientService } from './lsp-client-service'

export default lspTool