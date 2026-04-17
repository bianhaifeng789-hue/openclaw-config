// @ts-nocheck

/**
 * Remote Managed Settings Pattern - 远程管理设置
 * 
 * Source: Claude Code services/remoteManagedSettings/index.ts
 * Pattern: remote managed settings + MDM + policy + locked settings
 */

interface ManagedSetting {
  key: string
  value: any
  source: 'local' | 'mdm' | 'policy' | 'remote'
  locked: boolean
  precedence: number
}

class RemoteManagedSettings {
  private settings = new Map<string, ManagedSetting>()
  private mdmSettings = new Map<string, any>()
  private policySettings = new Map<string, any>()

  // Precedence order (higher number = higher priority)
  private precedenceOrder = {
    'policy': 100,
    'mdm': 80,
    'remote': 60,
    'local': 40
  }

  /**
   * Set local setting
   */
  setLocal(key: string, value: any): ManagedSetting {
    const existing = this.settings.get(key)

    // Check if locked
    if (existing?.locked && existing.source !== 'local') {
      throw new Error(`Setting ${key} is locked by ${existing.source}`)
    }

    const precedence = this.calculatePrecedence(key, 'local')

    const setting: ManagedSetting = {
      key,
      value,
      source: 'local',
      locked: existing?.locked ?? false,
      precedence
    }

    this.settings.set(key, setting)

    return setting
  }

  /**
   * Set MDM setting
   */
  setMDM(key: string, value: any, locked = true): void {
    this.mdmSettings.set(key, value)

    this.updateManagedSetting(key, value, 'mdm', locked)
  }

  /**
   * Set policy setting
   */
  setPolicy(key: string, value: any, locked = true): void {
    this.policySettings.set(key, value)

    this.updateManagedSetting(key, value, 'policy', locked)
  }

  /**
   * Update managed setting
   */
  private updateManagedSetting(key: string, value: any, source: ManagedSetting['source'], locked: boolean): void {
    const precedence = this.calculatePrecedence(key, source)

    const existing = this.settings.get(key)

    // Only update if higher precedence
    if (!existing || precedence >= existing.precedence) {
      this.settings.set(key, {
        key,
        value,
        source,
        locked,
        precedence
      })
    }
  }

  /**
   * Calculate precedence
   */
  private calculatePrecedence(key: string, source: ManagedSetting['source']): number {
    return this.precedenceOrder[source] ?? 0
  }

  /**
   * Get setting (resolves precedence)
   */
  get(key: string): any {
    const setting = this.settings.get(key)
    return setting?.value
  }

  /**
   * Get setting source
   */
  getSource(key: string): ManagedSetting['source'] | null {
    const setting = this.settings.get(key)
    return setting?.source ?? null
  }

  /**
   * Check if locked
   */
  isLocked(key: string): boolean {
    const setting = this.settings.get(key)
    return setting?.locked ?? false
  }

  /**
   * Get all locked settings
   */
  getLockedSettings(): ManagedSetting[] {
    return Array.from(this.settings.values()).filter(s => s.locked)
  }

  /**
   * Get settings by source
   */
  getBySource(source: ManagedSetting['source']): ManagedSetting[] {
    return Array.from(this.settings.values()).filter(s => s.source === source)
  }

  /**
   * Clear local setting
   */
  clearLocal(key: string): boolean {
    const setting = this.settings.get(key)
    if (!setting || setting.source !== 'local') return false

    return this.settings.delete(key)
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number
    locked: number
    bySource: Record<ManagedSetting['source'], number>
  } {
    const bySource: Record<ManagedSetting['source'], number> = {
      local: 0,
      mdm: 0,
      policy: 0,
      remote: 0
    }

    for (const setting of this.settings.values()) {
      bySource[setting.source]++
    }

    const locked = Array.from(this.settings.values()).filter(s => s.locked).length

    return {
      total: this.settings.size,
      locked,
      bySource
    }
  }

  /**
   * Clear all local settings
   */
  clearAllLocal(): number {
    let cleared = 0

    for (const [key, setting] of this.settings) {
      if (setting.source === 'local') {
        this.settings.delete(key)
        cleared++
      }
    }

    return cleared
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.settings.clear()
    this.mdmSettings.clear()
    this.policySettings.clear()
  }
}

// Global singleton
export const remoteManagedSettings = new RemoteManagedSettings()

export default remoteManagedSettings