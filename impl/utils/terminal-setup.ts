// @ts-nocheck

/**
 * Terminal Setup Pattern - 终端设置
 * 
 * Source: Claude Code commands/terminalSetup/index.ts
 * Pattern: terminal setup + shell config + PATH + environment
 */

interface TerminalConfig {
  shell: 'bash' | 'zsh' | 'fish' | 'sh' | 'powershell'
  path: string[]
  env: Record<string, string>
  aliases: Record<string, string>
}

interface TerminalSetupResult {
  success: boolean
  configPath: string | null
  shell: string
  modified: boolean
}

class TerminalSetup {
  private config: TerminalConfig = {
    shell: 'bash',
    path: [],
    env: {},
    aliases: {}
  }

  private setupHistory: TerminalSetupResult[] = []

  /**
   * Detect shell
   */
  detectShell(): TerminalConfig['shell'] {
    const env = process.env

    if (env.SHELL?.includes('zsh')) return 'zsh'
    if (env.SHELL?.includes('bash')) return 'bash'
    if (env.SHELL?.includes('fish')) return 'fish'
    if (env.PSModulePath) return 'powershell'

    return 'bash'
  }

  /**
   * Get config file path
   */
  getConfigPath(shell: TerminalConfig['shell']): string | null {
    const home = process.env.HOME ?? '~'

    switch (shell) {
      case 'bash':
        return `${home}/.bashrc`
      case 'zsh':
        return `${home}/.zshrc`
      case 'fish':
        return `${home}/.config/fish/config.fish`
      case 'powershell':
        return null // PowerShell profile is different
      default:
        return null
    }
  }

  /**
   * Setup PATH
   */
  setupPath(additionalPaths: string[]): TerminalSetupResult {
    const shell = this.detectShell()
    const configPath = this.getConfigPath(shell)

    this.config.shell = shell
    this.config.path = [...this.config.path, ...additionalPaths]

    const result: TerminalSetupResult = {
      success: true,
      configPath,
      shell,
      modified: additionalPaths.length > 0
    }

    this.setupHistory.push(result)

    return result
  }

  /**
   * Add environment variable
   */
  addEnvVar(key: string, value: string): void {
    this.config.env[key] = value
  }

  /**
   * Add alias
   */
  addAlias(name: string, command: string): void {
    this.config.aliases[name] = command
  }

  /**
   * Generate config content
   */
  generateConfigContent(): string {
    const lines: string[] = []

    // PATH setup
    if (this.config.path.length > 0) {
      const pathExport = this.config.shell === 'fish'
        ? `set -gx PATH $PATH ${this.config.path.join(' ')}`
        : `export PATH="$PATH:${this.config.path.join(':')}"`
      lines.push(pathExport)
    }

    // Environment variables
    for (const [key, value] of Object.entries(this.config.env)) {
      const envExport = this.config.shell === 'fish'
        ? `set -gx ${key} "${value}"`
        : `export ${key}="${value}"`
      lines.push(envExport)
    }

    // Aliases
    for (const [name, command] of Object.entries(this.config.aliases)) {
      const aliasCmd = this.config.shell === 'fish'
        ? `alias ${name} "${command}"`
        : `alias ${name}="${command}"`
      lines.push(aliasCmd)
    }

    return lines.join('\n')
  }

  /**
   * Get config
   */
  getConfig(): TerminalConfig {
    return { ...this.config }
  }

  /**
   * Get setup history
   */
  getHistory(): TerminalSetupResult[] {
    return [...this.setupHistory]
  }

  /**
   * Get stats
   */
  getStats(): {
    shell: string
    pathCount: number
    envCount: number
    aliasCount: number
    setupCount: number
  } {
    return {
      shell: this.config.shell,
      pathCount: this.config.path.length,
      envCount: Object.keys(this.config.env).length,
      aliasCount: Object.keys(this.config.aliases).length,
      setupCount: this.setupHistory.length
    }
  }

  /**
   * Clear config
   */
  clear(): void {
    this.config = {
      shell: 'bash',
      path: [],
      env: {},
      aliases: {}
    }
    this.setupHistory = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const terminalSetup = new TerminalSetup()

// Auto-detect shell
terminalSetup.config.shell = terminalSetup.detectShell()

export default terminalSetup