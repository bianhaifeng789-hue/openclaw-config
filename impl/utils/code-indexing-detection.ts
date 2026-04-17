// @ts-nocheck

/**
 * Code Indexing Detection Pattern - 代码索引检测
 * 
 * Source: Claude Code utils/codeIndexing.ts + services/codeIndexing.ts
 * Pattern: code indexing + language detection + file patterns + indexing status
 */

interface IndexingConfig {
  enabled: boolean
  languages: string[]
  excludePatterns: string[]
  maxFileSize: number
}

interface IndexingStatus {
  indexedFiles: number
  indexedTokens: number
  lastIndexed: number
  languageCounts: Record<string, number>
}

class CodeIndexingDetection {
  private status: IndexingStatus = {
    indexedFiles: 0,
    indexedTokens: 0,
    lastIndexed: 0,
    languageCounts: {}
  }

  private config: IndexingConfig = {
    enabled: true,
    languages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java'],
    excludePatterns: ['node_modules', '.git', 'dist', 'build'],
    maxFileSize: 100 * 1024 // 100KB
  }

  /**
   * Detect language from file path
   */
  detectLanguage(filePath: string): string | null {
    const extension = filePath.split('.').pop()?.toLowerCase()

    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'go': 'go',
      'rs': 'rust',
      'java': 'java',
      'kt': 'kotlin',
      'cpp': 'cpp',
      'c': 'c',
      'h': 'c',
      'hpp': 'cpp',
      'rb': 'ruby',
      'php': 'php',
      'swift': 'swift',
      'm': 'objective-c',
      'scala': 'scala',
      'cs': 'csharp'
    }

    return languageMap[extension ?? ''] ?? null
  }

  /**
   * Check if file should be indexed
   */
  shouldIndex(filePath: string, fileSize: number): boolean {
    if (!this.config.enabled) return false

    // Check size
    if (fileSize > this.config.maxFileSize) return false

    // Check language
    const language = this.detectLanguage(filePath)
    if (!language || !this.config.languages.includes(language)) return false

    // Check exclude patterns
    for (const pattern of this.config.excludePatterns) {
      if (filePath.includes(pattern)) return false
    }

    return true
  }

  /**
   * Update indexing status
   */
  updateStatus(fileCount: number, tokenCount: number, language: string): void {
    this.status.indexedFiles += fileCount
    this.status.indexedTokens += tokenCount
    this.status.lastIndexed = Date.now()

    this.status.languageCounts[language] =
      (this.status.languageCounts[language] ?? 0) + fileCount
  }

  /**
   * Get status
   */
  getStatus(): IndexingStatus {
    return { ...this.status }
  }

  /**
   * Get config
   */
  getConfig(): IndexingConfig {
    return { ...this.config }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<IndexingConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset status
   */
  resetStatus(): void {
    this.status = {
      indexedFiles: 0,
      indexedTokens: 0,
      lastIndexed: 0,
      languageCounts: {}
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): string[] {
    return [...this.config.languages]
  }

  /**
   * Add supported language
   */
  addLanguage(language: string): void {
    if (!this.config.languages.includes(language)) {
      this.config.languages.push(language)
    }
  }

  /**
   * Add exclude pattern
   */
  addExcludePattern(pattern: string): void {
    if (!this.config.excludePatterns.includes(pattern)) {
      this.config.excludePatterns.push(pattern)
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.resetStatus()
    this.config = {
      enabled: true,
      languages: ['typescript', 'javascript', 'python', 'go', 'rust', 'java'],
      excludePatterns: ['node_modules', '.git', 'dist', 'build'],
      maxFileSize: 100 * 1024
    }
  }
}

// Global singleton
export const codeIndexingDetection = new CodeIndexingDetection()

export default codeIndexingDetection