// @ts-nocheck

/**
 * Config Tool Pattern - 配置工具
 * 
 * Source: Claude Code tools/ConfigTool/ConfigTool.ts
 * Pattern: config tool + settings management + configuration + preferences
 */

interface ConfigEntry {
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'object'
  updatedAt: number
}

class ConfigTool {
  private config = new Map<string, ConfigEntry>()
  private history: Array<{ key: string; oldValue: any; newValue: any }> = []

  /**
   * Set config
   */
  set(key: string, value: any): ConfigEntry {
    const type = this.getType(value)

    const entry: ConfigEntry = {
      key,
      value,
      type,
      updatedAt: Date.now()
    }

    const existing = this.config.get(key)
    if (existing) {
      this.history.push({ key, oldValue: existing.value, newValue: value })
    }

    this.config.set(key, entry)

    return entry
  }

  /**
   * Get type
   */
  private getType(value: any): ConfigEntry['type'] {
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    return 'object'
  }

  /**
   * Get config
   */
  get(key: string): any {
    return this.config.get(key)?.value
  }

  /**
   * Get entry
   */
  getEntry(key: string): ConfigEntry | undefined {
    return this.config.get(key)
  }

  /**
   * Get all config
   */
  getAll(): Record<string, any> {
    const result: Record<string, any> = {}

    for (const [key, entry] of this.config) {
      result[key] = entry.value
    }

    return result
  }

  /**
   * Delete config
   */
  delete(key: string): boolean {
    const existing = this.config.get(key)
    if (existing) {
      this.history.push({ key, oldValue: existing.value, newValue: undefined })
    }

    return this.config.delete(key)
  }

  /**
   * Has config
   */
  has(key: string): boolean {
    return this.config.has(key)
  }

  /**
   * Get history
   */
  getHistory(): Array<{ key: string; oldValue: any; newValue: any }> {
    return [...this.history]
  }

  /**
   * Get history for key
   */
  getHistoryForKey(key: string): Array<{ key: string; oldValue: any; newValue: any }> {
    return this.history.filter(h => h.key === key)
  }

  /**
   * Get stats
   */
  getStats(): {
    entriesCount: number
    byType: Record<ConfigEntry['type'], number>
    historyCount: number
  } {
    const byType: Record<ConfigEntry['type'], number> = {
      string: 0, number: 0, boolean: 0, object: 0
    }

    for (const entry of this.config.values()) {
      byType[entry.type]++
    }

    return {
      entriesCount: this.config.size,
      byType,
      historyCount: this.history.length
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.config.clear()
    this.history = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const configTool = new ConfigTool()

export default configTool