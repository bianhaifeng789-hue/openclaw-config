// @ts-nocheck

/**
 * Prompt Suggestion Core Pattern - 提示建议核心
 * 
 * Source: Claude Code services/PromptSuggestion/promptSuggestion.ts + utils/promptSuggestionCore.ts
 * Pattern: prompt suggestions + context-based + frequency control + relevance
 */

interface PromptSuggestion {
  id: string
  text: string
  category: 'task' | 'query' | 'action' | 'context'
  relevance: number
  context?: string
  timestamp: number
}

interface SuggestionConfig {
  maxPerDay: number
  minIntervalMs: number
  maxCacheSize: number
}

class PromptSuggestionCore {
  private suggestions: PromptSuggestion[] = []
  private sentToday = new Set<string>()
  private lastSentTime = 0
  private suggestionCounter = 0

  private config: SuggestionConfig = {
    maxPerDay: 5,
    minIntervalMs: 30 * 60 * 1000, // 30 minutes
    maxCacheSize: 50
  }

  /**
   * Generate suggestions based on context
   */
  generate(context: {
    recentTasks?: string[]
    currentFile?: string
    recentQueries?: string[]
    userPreferences?: Record<string, any>
  }): PromptSuggestion[] {
    const suggestions: PromptSuggestion[] = []

    // Task-based suggestions
    if (context.recentTasks?.length > 0) {
      const lastTask = context.recentTasks[context.recentTasks.length - 1]
      suggestions.push(this.createSuggestion(
        `继续 ${lastTask}`,
        'task',
        80,
        lastTask
      ))
    }

    // File-based suggestions
    if (context.currentFile) {
      suggestions.push(this.createSuggestion(
        `分析 ${context.currentFile}`,
        'context',
        70,
        context.currentFile
      ))
      suggestions.push(this.createSuggestion(
        `编辑 ${context.currentFile}`,
        'action',
        60,
        context.currentFile
      ))
    }

    // Query-based suggestions
    if (context.recentQueries?.length > 0) {
      const lastQuery = context.recentQueries[context.recentQueries.length - 1]
      suggestions.push(this.createSuggestion(
        `更多关于 ${lastQuery}`,
        'query',
        50,
        lastQuery
      ))
    }

    // Default suggestions
    suggestions.push(this.createSuggestion('检查进度', 'task', 40))
    suggestions.push(this.createSuggestion('总结工作', 'task', 30))

    // Sort by relevance
    suggestions.sort((a, b) => b.relevance - a.relevance)

    // Cache
    this.suggestions = suggestions.slice(0, this.config.maxCacheSize)

    return suggestions
  }

  /**
   * Create suggestion
   */
  private createSuggestion(text: string, category: PromptSuggestion['category'], relevance: number, context?: string): PromptSuggestion {
    return {
      id: `suggest-${++this.suggestionCounter}`,
      text,
      category,
      relevance,
      context,
      timestamp: Date.now()
    }
  }

  /**
   * Get suggestions to send (frequency-controlled)
   */
  getToSend(count: number): PromptSuggestion[] {
    // Check daily limit
    if (this.sentToday.size >= this.config.maxPerDay) {
      return []
    }

    // Check interval
    if (Date.now() - this.lastSentTime < this.config.minIntervalMs) {
      return []
    }

    // Get top suggestions not sent today
    const available = this.suggestions.filter(s => !this.sentToday.has(s.id))

    return available.slice(0, count)
  }

  /**
   * Mark suggestion as sent
   */
  markSent(id: string): void {
    this.sentToday.add(id)
    this.lastSentTime = Date.now()
  }

  /**
   * Get cached suggestions
   */
  getCached(): PromptSuggestion[] {
    return [...this.suggestions]
  }

  /**
   * Clear daily cache (reset at midnight)
   */
  clearDaily(): void {
    this.sentToday.clear()
    this.lastSentTime = 0
  }

  /**
   * Set config
   */
  setConfig(config: Partial<SuggestionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get stats
   */
  getStats(): {
    cachedCount: number
    sentTodayCount: number
    maxPerDay: number
    lastSentTime: number
  } {
    return {
      cachedCount: this.suggestions.length,
      sentTodayCount: this.sentToday.size,
      maxPerDay: this.config.maxPerDay,
      lastSentTime: this.lastSentTime
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.suggestions = []
    this.sentToday.clear()
    this.lastSentTime = 0
    this.suggestionCounter = 0
    this.config = {
      maxPerDay: 5,
      minIntervalMs: 30 * 60 * 1000,
      maxCacheSize: 50
    }
  }
}

// Global singleton
export const promptSuggestionCore = new PromptSuggestionCore()

export default promptSuggestionCore