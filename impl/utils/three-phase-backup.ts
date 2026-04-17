// @ts-nocheck

/**
 * Three-Phase Backup Pattern - 三阶段备份
 * 
 * Source: Claude Code utils/settings/changeDetector.ts + backup utils
 * Pattern: backup → validate → commit + rollback on failure + backup rotation
 */

type BackupPhase = 'created' | 'validated' | 'committed' | 'rolledback'

interface BackupEntry {
  id: string
  phase: BackupPhase
  content: Record<string, any>
  createdAt: number
  validatedAt?: number
  committedAt?: number
  rolledbackAt?: number
  error?: string
}

interface BackupConfig {
  maxBackups: number // Keep last N backups
  validateBeforeCommit: boolean
  autoRotate: boolean
}

class ThreePhaseBackup {
  private backups = new Map<string, BackupEntry>()
  private activeBackup: BackupEntry | null = null
  private backupCounter = 0

  private config: BackupConfig = {
    maxBackups: 10,
    validateBeforeCommit: true,
    autoRotate: true
  }

  /**
   * Phase 1: Create backup
   */
  createBackup(content: Record<string, any>): string {
    const id = `backup-${++this.backupCounter}-${Date.now()}`

    const entry: BackupEntry = {
      id,
      phase: 'created',
      content: this.deepClone(content),
      createdAt: Date.now()
    }

    this.backups.set(id, entry)
    this.activeBackup = entry

    // Rotate old backups
    if (this.config.autoRotate) {
      this.rotateBackups()
    }

    return id
  }

  /**
   * Phase 2: Validate backup
   */
  validateBackup(backupId: string): boolean {
    const entry = this.backups.get(backupId)
    if (!entry || entry.phase !== 'created') {
      return false
    }

    // Validate content
    const isValid = this.validateContent(entry.content)

    if (isValid) {
      entry.phase = 'validated'
      entry.validatedAt = Date.now()
      return true
    } else {
      // Invalid: rollback
      this.rollbackBackup(backupId, 'Validation failed')
      return false
    }
  }

  /**
   * Phase 3: Commit backup
   */
  commitBackup(backupId: string): boolean {
    const entry = this.backups.get(backupId)
    if (!entry) return false

    // Must be validated first (if configured)
    if (this.config.validateBeforeCommit && entry.phase !== 'validated') {
      this.rollbackBackup(backupId, 'Not validated')
      return false
    }

    // Commit
    entry.phase = 'committed'
    entry.committedAt = Date.now()

    // Clear active backup
    if (this.activeBackup?.id === backupId) {
      this.activeBackup = null
    }

    return true
  }

  /**
   * Rollback backup
   */
  rollbackBackup(backupId: string, reason?: string): boolean {
    const entry = this.backups.get(backupId)
    if (!entry) return false

    entry.phase = 'rolledback'
    entry.rolledbackAt = Date.now()
    entry.error = reason

    // Clear active backup
    if (this.activeBackup?.id === backupId) {
      this.activeBackup = null
    }

    return true
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backupId: string): Record<string, any> | null {
    const entry = this.backups.get(backupId)
    if (!entry || entry.phase !== 'committed') {
      return null
    }

    return this.deepClone(entry.content)
  }

  /**
   * Validate content (mock)
   */
  private validateContent(content: Record<string, any>): boolean {
    // Would do actual validation
    // For now, check if non-empty
    return Object.keys(content).length > 0
  }

  /**
   * Deep clone object
   */
  private deepClone(obj: Record<string, any>): Record<string, any> {
    return JSON.parse(JSON.stringify(obj))
  }

  /**
   * Rotate backups (keep last N)
   */
  private rotateBackups(): void {
    if (this.backups.size <= this.config.maxBackups) return

    // Find oldest to remove
    const entries = Array.from(this.backups.values())
      .filter(e => e.phase === 'committed')
      .sort((a, b) => a.createdAt - b.createdAt)

    // Remove oldest
    const toRemove = entries.slice(0, entries.length - this.config.maxBackups)
    for (const entry of toRemove) {
      this.backups.delete(entry.id)
    }
  }

  /**
   * Get backup by ID
   */
  getBackup(backupId: string): BackupEntry | undefined {
    return this.backups.get(backupId)
  }

  /**
   * Get active backup
   */
  getActiveBackup(): BackupEntry | null {
    return this.activeBackup
  }

  /**
   * Get committed backups
   */
  getCommittedBackups(): BackupEntry[] {
    return Array.from(this.backups.values())
      .filter(e => e.phase === 'committed')
      .sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number
    created: number
    validated: number
    committed: number
    rolledback: number
  } {
    let created = 0, validated = 0, committed = 0, rolledback = 0

    for (const entry of this.backups.values()) {
      if (entry.phase === 'created') created++
      else if (entry.phase === 'validated') validated++
      else if (entry.phase === 'committed') committed++
      else rolledback++
    }

    return { total: this.backups.size, created, validated, committed, rolledback }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<BackupConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.backups.clear()
    this.activeBackup = null
    this.backupCounter = 0
  }
}

// Global singleton
export const threePhaseBackup = new ThreePhaseBackup()

export default threePhaseBackup