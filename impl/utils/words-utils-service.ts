// @ts-nocheck

/**
 * Words Utils Pattern - 单词工具
 * 
 * Source: Claude Code utils/words.ts
 * Pattern: words utils + word counting + word extraction + text analysis
 */

interface WordsAnalysis {
  words: string[]
  count: number
  uniqueCount: number
  averageLength: number
  timestamp: number
}

class WordsUtilsService {
  private analyses: WordsAnalysis[] = []

  /**
   * Extract words
   */
  extract(text: string): WordsAnalysis {
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const unique = new Set(words)

    const analysis: WordsAnalysis = {
      words,
      count: words.length,
      uniqueCount: unique.size,
      averageLength: words.length > 0 ? words.reduce((sum, w) => sum + w.length, 0) / words.length : 0,
      timestamp: Date.now()
    }

    this.analyses.push(analysis)

    return analysis
  }

  /**
   * Count words
   */
  count(text: string): number {
    return this.extract(text).count
  }

  /**
   * Get unique words
   */
  unique(text: string): string[] {
    return [...new Set(text.split(/\s+/).filter(w => w.length > 0))]
  }

  /**
   * Get word frequency
   */
  frequency(text: string): Record<string, number> {
    const words = text.split(/\s+/).filter(w => w.length > 0)
    const freq: Record<string, number> = {}

    for (const word of words) {
      freq[word] = (freq[word] ?? 0) + 1
    }

    return freq
  }

  /**
   * Find longest word
   */
  longest(text: string): string {
    const words = text.split(/\s+/).filter(w => w.length > 0)

    if (words.length === 0) return ''

    return words.reduce((longest, current) => current.length > longest.length ? current : longest)
  }

  /**
   * Find shortest word
   */
  shortest(text: string): string {
    const words = text.split(/\s+/).filter(w => w.length > 0)

    if (words.length === 0) return ''

    return words.reduce((shortest, current) => current.length < shortest.length ? current : shortest)
  }

  /**
   * Get analyses
   */
  getAnalyses(): WordsAnalysis[] {
    return [...this.analyses]
  }

  /**
   * Get recent analyses
   */
  getRecent(count: number = 10): WordsAnalysis[] {
    return this.analyses.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    analysesCount: number
    totalWordsCount: number
    averageWordsCount: number
    averageUniqueCount: number
  } {
    const avgWords = this.analyses.length > 0
      ? this.analyses.reduce((sum, a) => sum + a.count, 0) / this.analyses.length
      : 0

    const avgUnique = this.analyses.length > 0
      ? this.analyses.reduce((sum, a) => sum + a.uniqueCount, 0) / this.analyses.length
      : 0

    return {
      analysesCount: this.analyses.length,
      totalWordsCount: this.analyses.reduce((sum, a) => sum + a.count, 0),
      averageWordsCount: avgWords,
      averageUniqueCount: avgUnique
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.analyses = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const wordsUtilsService = new WordsUtilsService()

export default wordsUtilsService