// @ts-nocheck

/**
 * UUID Utils Pattern - UUID工具
 * 
 * Source: Claude Code utils/uuid.ts
 * Pattern: UUID utils + UUID generation + unique IDs + identifiers
 */

interface UUIDInfo {
  uuid: string
  type: 'v4' | 'v1' | 'custom'
  createdAt: number
}

class UUIDUtilsService {
  private generated: UUIDInfo[] = []
  private generateCounter = 0

  /**
   * Generate v4 UUID
   */
  v4(): string {
    const uuid = this.generateV4()
    this.generated.push({ uuid, type: 'v4', createdAt: Date.now() })

    return uuid
  }

  /**
   * Generate v4
   */
  private generateV4(): string {
    const bytes = new Uint8Array(16)

    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256)
    }

    // Version 4
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    // Variant
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    return this.formatUUID(bytes)
  }

  /**
   * Format UUID
   */
  private formatUUID(bytes: Uint8Array): string {
    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))

    return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10, 16).join('')}`
  }

  /**
   * Generate custom ID
   */
  custom(prefix?: string, length?: number): string {
    const len = length ?? 8
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

    let id = ''
    for (let i = 0; i < len; i++) {
      id += chars[Math.floor(Math.random() * chars.length)]
    }

    const uuid = prefix ? `${prefix}-${id}` : id

    this.generated.push({ uuid, type: 'custom', createdAt: Date.now() })

    return uuid
  }

  /**
   * Generate timestamp ID
   */
  timestamp(prefix?: string): string {
    const ts = Date.now().toString(36)
    const uuid = prefix ? `${prefix}-${ts}` : ts

    this.generated.push({ uuid, type: 'v1', createdAt: Date.now() })

    return uuid
  }

  /**
   * Validate UUID
   */
  isValid(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return regex.test(uuid)
  }

  /**
   * Get generated
   */
  getGenerated(): UUIDInfo[] {
    return [...this.generated]
  }

  /**
   * Get recent
   */
  getRecent(count: number = 10): UUIDInfo[] {
    return this.generated.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    generatedCount: number
    byType: Record<UUIDInfo['type'], number>
  } {
    const byType: Record<UUIDInfo['type'], number> = { v4: 0, v1: 0, custom: 0 }

    for (const info of this.generated) {
      byType[info.type]++
    }

    return {
      generatedCount: this.generated.length,
      byType
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.generated = []
    this.generateCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const uuidUtilsService = new UUIDUtilsService()

export default uuidUtilsService