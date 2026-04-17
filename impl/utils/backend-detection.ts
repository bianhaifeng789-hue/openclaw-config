// @ts-nocheck

/**
 * Backend Detection Pattern - 后端检测
 * 
 * Source: Claude Code utils/swarm/backends/detection.ts
 * Pattern: backend detection + service discovery + capability check
 */

interface BackendInfo {
  id: string
  type: 'local' | 'remote' | 'cloud' | 'hybrid'
  capabilities: string[]
  status: 'available' | 'unavailable' | 'degraded'
  latencyMs: number
  lastCheck: number
}

class BackendDetection {
  private backends = new Map<string, BackendInfo>()
  private preferredBackend: string | null = null

  /**
   * Register backend
   */
  register(id: string, type: BackendInfo['type'], capabilities: string[]): BackendInfo {
    const info: BackendInfo = {
      id,
      type,
      capabilities,
      status: 'available',
      latencyMs: 0,
      lastCheck: Date.now()
    }

    this.backends.set(id, info)

    return info
  }

  /**
   * Detect backends
   */
  detect(): BackendInfo[] {
    // Would probe actual backends
    // For demo, return registered
    return Array.from(this.backends.values())
  }

  /**
   * Check backend status
   */
  async checkStatus(id: string): BackendInfo['status'] {
    const backend = this.backends.get(id)
    if (!backend) return 'unavailable'

    // Would ping backend
    backend.lastCheck = Date.now()

    return backend.status
  }

  /**
   * Get backend
   */
  getBackend(id: string): BackendInfo | undefined {
    return this.backends.get(id)
  }

  /**
   * Get available backends
   */
  getAvailable(): BackendInfo[] {
    return Array.from(this.backends.values())
      .filter(b => b.status === 'available')
  }

  /**
   * Get backends by type
   */
  getByType(type: BackendInfo['type']): BackendInfo[] {
    return Array.from(this.backends.values())
      .filter(b => b.type === type)
  }

  /**
   * Set preferred backend
   */
  setPreferred(id: string): boolean {
    if (!this.backends.has(id)) return false

    this.preferredBackend = id

    return true
  }

  /**
   * Get preferred backend
   */
  getPreferred(): BackendInfo | null {
    if (!this.preferredBackend) return null

    return this.backends.get(this.preferredBackend) ?? null
  }

  /**
   * Check capability
   */
  hasCapability(id: string, capability: string): boolean {
    const backend = this.backends.get(id)
    return backend?.capabilities.includes(capability) ?? false
  }

  /**
   * Find backend with capability
   */
  findWithCapability(capability: string): BackendInfo | null {
    return Array.from(this.backends.values())
      .find(b => b.status === 'available' && b.capabilities.includes(capability)) ?? null
  }

  /**
   * Get stats
   */
  getStats(): {
    backendsCount: number
    availableCount: number
    byType: Record<BackendInfo['type'], number>
  } {
    const backends = Array.from(this.backends.values())

    const byType: Record<BackendInfo['type'], number> = {
      local: 0, remote: 0, cloud: 0, hybrid: 0
    }

    for (const b of backends) byType[b.type]++

    return {
      backendsCount: backends.length,
      availableCount: backends.filter(b => b.status === 'available').length,
      byType
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.backends.clear()
    this.preferredBackend = null
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const backendDetection = new BackendDetection()

export default backendDetection