// @ts-nocheck

/**
 * Tips Service Pattern - 提示服务
 * 
 * Source: Claude Code services/tips/index.ts + utils/claudeCodeHints.ts
 * Pattern: tips + hints + tip rotation + context-aware tips + frequency
 */

interface Tip {
  id: string
  category: 'shortcut' | 'feature' | 'best_practice' | 'troubleshooting'
  title: string
  content: string
  context?: string
  priority: number
}

interface TipsConfig {
  maxPerSession: number
  showIntervalMs: number
  categories: Tip['category'][]
}

class TipsService {
  private tips = new Map<string, Tip>()
  private shownToday = new Set<string>()
  private tipCounter = 0
  private lastShownTime = 0

  private config: TipsConfig = {
    maxPerSession: 3,
    showIntervalMs: 10 * 60 * 1000, // 10 minutes
    categories: ['shortcut', 'feature', 'best_practice', 'troubleshooting']
  }

  /**
   * Add tip
   */
  addTip(tip: Omit<Tip, 'id'>): Tip {
    const id = `tip-${++this.tipCounter}`

    const fullTip: Tip = {
      id,
      ...tip
    }

    this.tips.set(id, fullTip)

    return fullTip
  }

  /**
   * Get tip to show
   */
  getTipToShow(context?: string): Tip | null {
    // Check limits
    if (this.shownToday.size >= this.config.maxPerSession) {
      return null
    }

    if (Date.now() - this.lastShownTime < this.config.showIntervalMs) {
      return null
    }

    // Get available tips
    const available = Array.from(this.tips.values())
      .filter(t => !this.shownToday.has(t.id))
      .filter(t => this.config.categories.includes(t.category))
      .filter(t => !context || !t.context || t.context.includes(context))
      .sort((a, b) => b.priority - a.priority)

    if (available.length === 0) {
      return null
    }

    // Return top tip
    const tip = available[0]

    this.shownToday.add(tip.id)
    this.lastShownTime = Date.now()

    return tip
  }

  /**
   * Format tip for display
   */
  formatTip(tip: Tip): string {
    const categoryEmoji: Record<Tip['category'], string> = {
      shortcut: '⌨️',
      feature: '✨',
      best_practice: '💡',
      troubleshooting: '🔧'
    }

    const emoji = categoryEmoji[tip.category] ?? '📝'

    return `${emoji} **${tip.title}**\n${tip.content}`
  }

  /**
   * Get tip by ID
   */
  getById(id: string): Tip | undefined {
    return this.tips.get(id)
  }

  /**
   * Get tips by category
   */
  getByCategory(category: Tip['category']): Tip[] {
    return Array.from(this.tips.values())
      .filter(t => t.category === category)
  }

  /**
   * Get all tips
   */
  getAll(): Tip[] {
    return Array.from(this.tips.values())
  }

  /**
   * Mark tip as shown
   */
  markShown(id: string): void {
    this.shownToday.add(id)
    this.lastShownTime = Date.now()
  }

  /**
   * Clear shown today (reset at midnight)
   */
  clearShownToday(): void {
    this.shownToday.clear()
    this.lastShownTime = 0
  }

  /**
   * Set config
   */
  setConfig(config: Partial<TipsConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get stats
   */
  getStats(): {
    totalTips: number
    shownToday: number
    categoriesCount: Record<Tip['category'], number>
  } {
    const categoriesCount: Record<Tip['category'], number> = {
      shortcut: 0,
      feature: 0,
      best_practice: 0,
      troubleshooting: 0
    }

    for (const tip of this.tips.values()) {
      categoriesCount[tip.category]++
    }

    return {
      totalTips: this.tips.size,
      shownToday: this.shownToday.size,
      categoriesCount
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.tips.clear()
    this.shownToday.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.tipCounter = 0
    this.lastShownTime = 0
    this.config = {
      maxPerSession: 3,
      showIntervalMs: 10 * 60 * 1000,
      categories: ['shortcut', 'feature', 'best_practice', 'troubleshooting']
    }
  }
}

// Global singleton
export const tipsService = new TipsService()

// Add default tips
tipsService.addTip({
  category: 'shortcut',
  title: '快速继续',
  content: '使用 "继续" 快速推进当前任务',
  priority: 80
})

tipsService.addTip({
  category: 'feature',
  title: '心跳任务',
  content: 'HEARTBEAT.md 定义定期检查任务',
  priority: 70
})

tipsService.addTip({
  category: 'best_practice',
  title: '记忆维护',
  content: '定期检查 memory/ 文件夹更新 MEMORY.md',
  priority: 90
})

tipsService.addTip({
  category: 'troubleshooting',
  title: '超时处理',
  content: '使用 abortSafeSleep 处理可中断操作',
  priority: 60
})

export default tipsService