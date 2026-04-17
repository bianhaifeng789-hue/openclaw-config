// @ts-nocheck

/**
 * IDE Detection Pattern - IDE检测
 * 
 * Source: Claude Code utils/ide.ts
 * Pattern: IDE detection + editor integration + VSCode/JetBrains detection
 */

interface IDEInfo {
  name: string
  version?: string
  type: 'vscode' | 'jetbrains' | 'vim' | 'emacs' | 'other'
  features: string[]
}

class IDEDetection {
  private detectedIDE: IDEInfo | null = null
  private supportedIDEs = ['vscode', 'jetbrains', 'vim', 'emacs', 'cursor', 'zed']

  /**
   * Detect IDE
   */
  detect(): IDEInfo {
    // Would check environment variables and processes
    // For demo, simulate detection
    const env = process.env

    // Check VSCode
    if (env.VSCODE_PID || env.VSCODE_IPC_HANDLE) {
      this.detectedIDE = {
        name: 'VSCode',
        type: 'vscode',
        features: ['settings', 'extensions', 'tasks', 'debug']
      }

      return this.detectedIDE
    }

    // Check JetBrains
    if (env.JETBRAINS_IDE || env._JAVA_OPTIONS?.includes('jetbrains')) {
      this.detectedIDE = {
        name: 'JetBrains',
        type: 'jetbrains',
        features: ['run', 'debug', 'refactor']
      }

      return this.detectedIDE
    }

    // Check Vim
    if (env.VIM || env.NVIM) {
      this.detectedIDE = {
        name: 'Vim',
        type: 'vim',
        features: ['editing']
      }

      return this.detectedIDE
    }

    // Default: unknown
    this.detectedIDE = {
      name: 'Unknown',
      type: 'other',
      features: []
    }

    return this.detectedIDE
  }

  /**
   * Get detected IDE
   */
  getDetectedIDE(): IDEInfo | null {
    return this.detectedIDE
  }

  /**
   * Check if VSCode
   */
  isVSCode(): boolean {
    return this.detectedIDE?.type === 'vscode'
  }

  /**
   * Check if JetBrains
   */
  isJetBrains(): boolean {
    return this.detectedIDE?.type === 'jetbrains'
  }

  /**
   * Check if Vim
   */
  isVim(): boolean {
    return this.detectedIDE?.type === 'vim'
  }

  /**
   * Check if Emacs
   */
  isEmacs(): boolean {
    return this.detectedIDE?.type === 'emacs'
  }

  /**
   * Check if has feature
   */
  hasFeature(feature: string): boolean {
    return this.detectedIDE?.features.includes(feature) ?? false
  }

  /**
   * Get supported IDEs
   */
  getSupportedIDEs(): string[] {
    return [...this.supportedIDEs]
  }

  /**
   * Add supported IDE
   */
  addSupportedIDE(name: string): void {
    if (!this.supportedIDEs.includes(name)) {
      this.supportedIDEs.push(name)
    }
  }

  /**
   * Get IDE config path
   */
  getConfigPath(): string | null {
    if (!this.detectedIDE) return null

    switch (this.detectedIDE.type) {
      case 'vscode':
        return '.vscode/settings.json'
      case 'jetbrains':
        return '.idea/workspace.xml'
      case 'vim':
        return '.vimrc'
      case 'emacs':
        return '.emacs'
      default:
        return null
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    detected: boolean
    ideType: string | null
    ideName: string | null
    featuresCount: number
    supportedCount: number
  } {
    return {
      detected: this.detectedIDE !== null,
      ideType: this.detectedIDE?.type ?? null,
      ideName: this.detectedIDE?.name ?? null,
      featuresCount: this.detectedIDE?.features.length ?? 0,
      supportedCount: this.supportedIDEs.length
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.detectedIDE = null
    this.supportedIDEs = ['vscode', 'jetbrains', 'vim', 'emacs', 'cursor', 'zed']
  }
}

// Global singleton
export const ideDetection = new IDEDetection()

// Auto-detect on startup
ideDetection.detect()

export default ideDetection