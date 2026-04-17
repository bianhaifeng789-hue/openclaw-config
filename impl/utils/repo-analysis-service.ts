// @ts-nocheck

/**
 * Repo Analysis Pattern - 仓库分析
 * 
 * Source: Claude Code utils/repoAnalysis.ts
 * Pattern: repo analysis + project detection + language stats + file patterns
 */

interface RepoAnalysis {
  languages: Record<string, number>
  frameworks: string[]
  fileTypes: Record<string, number>
  totalFiles: number
  totalSize: number
  hasTests: boolean
  hasDocs: boolean
  hasConfig: boolean
}

class RepoAnalysisService {
  private analyses = new Map<string, RepoAnalysis>()

  /**
   * Analyze repository
   */
  analyze(rootPath: string): RepoAnalysis {
    // Would scan directory and analyze files
    // For demo, simulate analysis
    const analysis: RepoAnalysis = {
      languages: {
        'TypeScript': 60,
        'JavaScript': 30,
        'JSON': 10
      },
      frameworks: ['react', 'jest'],
      fileTypes: {
        '.ts': 50,
        '.js': 30,
        '.json': 20
      },
      totalFiles: 100,
      totalSize: 500000,
      hasTests: true,
      hasDocs: true,
      hasConfig: true
    }

    this.analyses.set(rootPath, analysis)

    return analysis
  }

  /**
   * Detect language
   */
  detectLanguage(filePath: string): string | null {
    const ext = filePath.split('.').pop()?.toLowerCase()

    const langMap: Record<string, string> = {
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'py': 'Python',
      'go': 'Go',
      'rs': 'Rust',
      'java': 'Java',
      'rb': 'Ruby',
      'php': 'PHP'
    }

    return langMap[ext ?? ''] ?? null
  }

  /**
   * Detect framework
   */
  detectFrameworks(rootPath: string): string[] {
    // Would check package.json, requirements.txt, etc.
    // For demo, return common frameworks
    const analysis = this.analyses.get(rootPath)
    return analysis?.frameworks ?? []
  }

  /**
   * Check for tests
   */
  hasTests(rootPath: string): boolean {
    const analysis = this.analyses.get(rootPath)
    return analysis?.hasTests ?? false
  }

  /**
   * Check for docs
   */
  hasDocs(rootPath: string): boolean {
    const analysis = this.analyses.get(rootPath)
    return analysis?.hasDocs ?? false
  }

  /**
   * Get analysis
   */
  getAnalysis(rootPath: string): RepoAnalysis | undefined {
    return this.analyses.get(rootPath)
  }

  /**
   * Get language breakdown
   */
  getLanguageBreakdown(rootPath: string): Record<string, number> {
    const analysis = this.analyses.get(rootPath)
    return analysis?.languages ?? {}
  }

  /**
   * Get dominant language
   */
  getDominantLanguage(rootPath: string): string | null {
    const analysis = this.analyses.get(rootPath)
    if (!analysis) return null

    const languages = analysis.languages
    let dominant = ''
    let maxPercent = 0

    for (const [lang, percent] of Object.entries(languages)) {
      if (percent > maxPercent) {
        maxPercent = percent
        dominant = lang
      }
    }

    return dominant
  }

  /**
   * Get stats
   */
  getStats(): {
    analysesCount: number
    averageFiles: number
    averageSize: number
  } {
    const analyses = Array.from(this.analyses.values())

    const avgFiles = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.totalFiles, 0) / analyses.length
      : 0

    const avgSize = analyses.length > 0
      ? analyses.reduce((sum, a) => sum + a.totalSize, 0) / analyses.length
      : 0

    return {
      analysesCount: analyses.length,
      averageFiles: avgFiles,
      averageSize: avgSize
    }
  }

  /**
   * Clear analyses
   */
  clear(): void {
    this.analyses.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const repoAnalysisService = new RepoAnalysisService()

export default repoAnalysisService