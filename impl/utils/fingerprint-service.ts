// @ts-nocheck

/**
 * Fingerprint Pattern - 指纹识别
 * 
 * Source: Claude Code utils/fingerprint.ts
 * Pattern: fingerprint + device ID + session fingerprint + uniqueness
 */

interface Fingerprint {
  id: string
  components: Record<string, string>
  hash: string
  createdAt: number
}

class FingerprintService {
  private fingerprints = new Map<string, Fingerprint>()
  private currentFingerprint: Fingerprint | null = null
  private fingerprintCounter = 0

  /**
   * Generate fingerprint
   */
  generate(components: Record<string, string>): Fingerprint {
    const id = `fp-${++this.fingerprintCounter}-${Date.now()}`

    // Generate hash from components
    const hash = this.hashComponents(components)

    const fingerprint: Fingerprint = {
      id,
      components,
      hash,
      createdAt: Date.now()
    }

    this.fingerprints.set(id, fingerprint)

    return fingerprint
  }

  /**
   * Hash components
   */
  private hashComponents(components: Record<string, string>): string {
    const values = Object.entries(components)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('|')

    // Simple hash
    let hash = 0
    for (let i = 0; i < values.length; i++) {
      hash = ((hash << 5) - hash) + values.charCodeAt(i)
      hash = hash & hash
    }

    return Math.abs(hash).toString(16).padStart(8, '0')
  }

  /**
   * Generate device fingerprint
   */
  generateDevice(): Fingerprint {
    const components = {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      hostname: 'unknown' // Would get actual hostname
    }

    this.currentFingerprint = this.generate(components)

    return this.currentFingerprint
  }

  /**
   * Generate session fingerprint
   */
  generateSession(sessionId: string): Fingerprint {
    const components = {
      sessionId,
      timestamp: Date.now().toString(),
      random: Math.random().toString(36).slice(2, 8)
    }

    return this.generate(components)
  }

  /**
   * Verify fingerprint
   */
  verify(id: string, components: Record<string, string>): boolean {
    const fingerprint = this.fingerprints.get(id)
    if (!fingerprint) return false

    const newHash = this.hashComponents(components)

    return fingerprint.hash === newHash
  }

  /**
   * Get fingerprint
   */
  getFingerprint(id: string): Fingerprint | undefined {
    return this.fingerprints.get(id)
  }

  /**
   * Get current fingerprint
   */
  getCurrent(): Fingerprint | null {
    return this.currentFingerprint
  }

  /**
   * Find by hash
   */
  findByHash(hash: string): Fingerprint[] {
    return Array.from(this.fingerprints.values())
      .filter(fp => fp.hash === hash)
  }

  /**
   * Get stats
   */
  getStats(): {
    totalFingerprints: number
    uniqueHashes: number
    oldest: number | null
    newest: number | null
  } {
    const fingerprints = Array.from(this.fingerprints.values())
    const uniqueHashes = new Set(fingerprints.map(fp => fp.hash)).size

    const timestamps = fingerprints.map(fp => fp.createdAt)
    const oldest = timestamps.length > 0 ? Math.min(...timestamps) : null
    const newest = timestamps.length > 0 ? Math.max(...timestamps) : null

    return {
      totalFingerprints: fingerprints.length,
      uniqueHashes,
      oldest,
      newest
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.fingerprints.clear()
    this.currentFingerprint = null
    this.fingerprintCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const fingerprintService = new FingerprintService()

export default fingerprintService