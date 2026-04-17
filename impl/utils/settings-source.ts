// @ts-nocheck

/**
 * Settings Source Cascade Pattern - 配置源级联优先级
 * 
 * Source: Claude Code utils/settings/constants.ts
 * Pattern: 5 SettingSource array + EditableSettingSource + First Source Wins Policy
 */

/**
 * Setting sources in priority order (highest priority first)
 * First source wins: if a setting exists in higher priority source,
 * lower priority source value is ignored.
 */
export const SETTING_SOURCES = [
  'policy',      // MDM/enterprise policy (highest)
  'managed',     // Managed settings file
  'project',     // Project-level .claude/settings.json
  'user',        // User-level ~/.claude/settings.json
  'default',     // Built-in defaults (lowest)
] as const

export type SettingSource = typeof SETTING_SOURCES[number]

/**
 * Sources that can be edited by user (excludes policy/managed)
 */
export const EDITABLE_SETTING_SOURCES: SettingSource[] = [
  'project',
  'user',
  'default'
]

/**
 * Check if source is editable
 */
export function isEditableSource(source: SettingSource): boolean {
  return EDITABLE_SETTING_SOURCES.includes(source)
}

/**
 * Parse --settings flag value into sources array
 * Example: "--settings project,user" → ['project', 'user']
 */
export function parseSettingsSourcesFlag(flag: string | undefined): SettingSource[] {
  if (!flag) return [...SETTING_SOURCES]

  const sources = flag.split(',')
    .map(s => s.trim() as SettingSource)
    .filter(s => SETTING_SOURCES.includes(s))

  if (sources.length === 0) {
    console.warn(`Invalid --settings flag: ${flag}, using all sources`)
    return [...SETTING_SOURCES]
  }

  return sources
}

/**
 * Settings Source Cascade Manager
 * Implements First Source Wins policy
 */
class SettingsSourceCascade {
  private sources: SettingSource[] = [...SETTING_SOURCES]
  private values = new Map<string, Map<SettingSource, unknown>>()

  /**
   * Set value for a key at a specific source
   */
  set(key: string, value: unknown, source: SettingSource): void {
    if (!this.values.has(key)) {
      this.values.set(key, new Map())
    }
    this.values.get(key)!.set(source, value)
  }

  /**
   * Get value for a key using First Source Wins policy
   * Returns value from highest priority source that has the key
   */
  get(key: string): unknown | undefined {
    const sourceMap = this.values.get(key)
    if (!sourceMap) return undefined

    // Iterate in priority order
    for (const source of this.sources) {
      if (sourceMap.has(source)) {
        return sourceMap.get(source)
      }
    }

    return undefined
  }

  /**
   * Get value with source info
   */
  getWithSource(key: string): { value: unknown; source: SettingSource } | undefined {
    const sourceMap = this.values.get(key)
    if (!sourceMap) return undefined

    for (const source of this.sources) {
      if (sourceMap.has(source)) {
        return { value: sourceMap.get(source)!, source }
      }
    }

    return undefined
  }

  /**
   * Get all values merged (for display/debug)
   */
  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key] of this.values) {
      const value = this.get(key)
      if (value !== undefined) {
        result[key] = value
      }
    }
    return result
  }

  /**
   * Delete key from a specific source
   */
  delete(key: string, source: SettingSource): boolean {
    const sourceMap = this.values.get(key)
    if (!sourceMap) return false
    return sourceMap.delete(source)
  }

  /**
   * Clear all values from a source
   */
  clearSource(source: SettingSource): void {
    for (const sourceMap of this.values.values()) {
      sourceMap.delete(source)
    }
  }

  /**
   * Get configured sources
   */
  getSources(): SettingSource[] {
    return [...this.sources]
  }

  /**
   * Set custom sources order
   */
  setSources(sources: SettingSource[]): void {
    // Validate all sources are valid
    for (const s of sources) {
      if (!SETTING_SOURCES.includes(s)) {
        throw new Error(`Invalid source: ${s}`)
      }
    }
    this.sources = sources
  }

  /**
   * Reset cascade
   */
  _reset(): void {
    this.sources = [...SETTING_SOURCES]
    this.values.clear()
  }
}

// Global singleton
export const settingsCascade = new SettingsSourceCascade()

export default settingsCascade