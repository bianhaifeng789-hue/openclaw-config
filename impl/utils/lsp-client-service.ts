// @ts-nocheck

/**
 * LSP Client Pattern - LSP客户端
 * 
 * Source: Claude Code services/LSPClient.ts + services/lsp/LSPClient.ts + utils/lsp.ts
 * Pattern: LSP client + language server protocol + diagnostics + completions
 */

interface LSPDiagnostic {
  uri: string
  range: { start: { line: number; character: number }; end: { line: number; character: number } }
  severity: 'error' | 'warning' | 'info' | 'hint'
  message: string
  source?: string
}

interface LSPCompletion {
  label: string
  kind: string
  detail?: string
  documentation?: string
  insertText: string
}

class LSPClientService {
  private connected = false
  private capabilities: string[] = []
  private diagnostics = new Map<string, LSPDiagnostic[]>()
  private completions: LSPCompletion[] = []
  private serverName: string | null = null

  /**
   * Initialize LSP client
   */
  async initialize(serverCommand: string): boolean {
    // Would spawn LSP server process
    // For demo, simulate
    this.connected = true
    this.capabilities = ['diagnostics', 'completions', 'hover', 'definitions']
    this.serverName = serverCommand

    return true
  }

  /**
   * Shutdown
   */
  async shutdown(): void {
    this.connected = false
    this.capabilities = []
    this.serverName = null
    this.diagnostics.clear()
    this.completions = []
  }

  /**
   * Is connected
   */
  isConnected(): boolean {
    return this.connected
  }

  /**
   * Get capabilities
   */
  getCapabilities(): string[] {
    return [...this.capabilities]
  }

  /**
   * Open file
   */
  openFile(uri: string, content: string): void {
    // Would send textDocument/didOpen
    // For demo, simulate diagnostics
    this.simulateDiagnostics(uri, content)
  }

  /**
   * Simulate diagnostics
   */
  private simulateDiagnostics(uri: string, content: string): void {
    // Would receive from server
    // For demo, generate simple diagnostics
    const lines = content.split('\n')
    const diagnostics: LSPDiagnostic[] = []

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('TODO')) {
        diagnostics.push({
          uri,
          range: {
            start: { line: i, character: 0 },
            end: { line: i, character: lines[i].length }
          },
          severity: 'hint',
          message: 'TODO found',
          source: 'lsp'
        })
      }
    }

    this.diagnostics.set(uri, diagnostics)
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(uri: string): LSPDiagnostic[] {
    return this.diagnostics.get(uri) ?? []
  }

  /**
   * Get all diagnostics
   */
  getAllDiagnostics(): LSPDiagnostic[] {
    return Array.from(this.diagnostics.values()).flat()
  }

  /**
   * Request completions
   */
  async requestCompletions(uri: string, position: { line: number; character: number }): LSPCompletion[] {
    // Would send textDocument/completion
    // For demo, return mock completions
    this.completions = [
      { label: 'function', kind: 'keyword', insertText: 'function' },
      { label: 'const', kind: 'keyword', insertText: 'const' },
      { label: 'let', kind: 'keyword', insertText: 'let' }
    ]

    return this.completions
  }

  /**
   * Request hover
   */
  async requestHover(uri: string, position: { line: number; character: number }): string | null {
    // Would send textDocument/hover
    // For demo, return mock
    return 'Hover information for this symbol'
  }

  /**
   * Request definition
   */
  async requestDefinition(uri: string, position: { line: number; character: number }): Array<{ uri: string; range: any }> | null {
    // Would send textDocument/definition
    // For demo, return null
    return null
  }

  /**
   * Change file
   */
  changeFile(uri: string, content: string): void {
    // Would send textDocument/didChange
    this.simulateDiagnostics(uri, content)
  }

  /**
   * Close file
   */
  closeFile(uri: string): void {
    // Would send textDocument/didClose
    this.diagnostics.delete(uri)
  }

  /**
   * Get stats
   */
  getStats(): {
    connected: boolean
    capabilitiesCount: number
    diagnosticsCount: number
    filesCount: number
    serverName: string | null
  } {
    return {
      connected: this.connected,
      capabilitiesCount: this.capabilities.length,
      diagnosticsCount: this.getAllDiagnostics().length,
      filesCount: this.diagnostics.size,
      serverName: this.serverName
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.connected = false
    this.capabilities = []
    this.diagnostics.clear()
    this.completions = []
    this.serverName = null
  }
}

// Global singleton
export const lspClientService = new LSPClientService()

export default lspClientService