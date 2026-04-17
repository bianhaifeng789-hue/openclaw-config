// @ts-nocheck

/**
 * Backend Registry Pattern - 后端注册
 * 
 * Source: Claude Code utils/swarm/backends/registry.ts + utils/swarm/backends/types.ts
 * Pattern: backend registry + registration + lookup + lifecycle
 */

interface BackendRegistration {
  id: string
  name: string
  endpoint: string
  protocol: 'http' | 'ws' | 'grpc'
  registeredAt: number
  lastActive: number
  config: Record<string, any>
}

class BackendRegistry {
  private registry = new Map<string, BackendRegistration>()
  private endpoints = new Map<string, string>() // endpoint -> id

  /**
   * Register backend
   */
  register(id: string, name: string, endpoint: string, protocol: BackendRegistration['protocol'], config?: Record<string, any>): BackendRegistration {
    const registration: BackendRegistration = {
      id,
      name,
      endpoint,
      protocol,
      registeredAt: Date.now(),
      lastActive: Date.now(),
      config: config ?? {}
    }

    this.registry.set(id, registration)
    this.endpoints.set(endpoint, id)

    return registration
  }

  /**
   * Unregister backend
   */
  unregister(id: string): boolean {
    const reg = this.registry.get(id)
    if (!reg) return false

    this.endpoints.delete(reg.endpoint)
    this.registry.delete(id)

    return true
  }

  /**
   * Get by ID
   */
  getById(id: string): BackendRegistration | undefined {
    return this.registry.get(id)
  }

  /**
   * Get by endpoint
   */
  getByEndpoint(endpoint: string): BackendRegistration | undefined {
    const id = this.endpoints.get(endpoint)
    if (!id) return undefined

    return this.registry.get(id)
  }

  /**
   * Get by name
   */
  getByName(name: string): BackendRegistration[] {
    return Array.from(this.registry.values())
      .filter(r => r.name === name)
  }

  /**
   * Get by protocol
   */
  getByProtocol(protocol: BackendRegistration['protocol']): BackendRegistration[] {
    return Array.from(this.registry.values())
      .filter(r => r.protocol === protocol)
  }

  /**
   * Update last active
   */
  updateLastActive(id: string): boolean {
    const reg = this.registry.get(id)
    if (!reg) return false

    reg.lastActive = Date.now()

    return true
  }

  /**
   * Update config
   */
  updateConfig(id: string, config: Record<string, any>): boolean {
    const reg = this.registry.get(id)
    if (!reg) return false

    reg.config = { ...reg.config, ...config }

    return true
  }

  /**
   * List all
   */
  list(): BackendRegistration[] {
    return Array.from(this.registry.values())
  }

  /**
   * Get active backends
   */
  getActive(thresholdMs: number = 60000): BackendRegistration[] {
    const now = Date.now()

    return Array.from(this.registry.values())
      .filter(r => now - r.lastActive < thresholdMs)
  }

  /**
   * Get stats
   */
  getStats(): {
    registeredCount: number
    endpointsCount: number
    byProtocol: Record<BackendRegistration['protocol'], number>
    activeCount: number
  } {
    const regs = Array.from(this.registry.values())

    const byProtocol: Record<BackendRegistration['protocol'], number> = {
      http: 0, ws: 0, grpc: 0
    }

    for (const r of regs) byProtocol[r.protocol]++

    return {
      registeredCount: regs.length,
      endpointsCount: this.endpoints.size,
      byProtocol,
      activeCount: this.getActive().length
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.registry.clear()
    this.endpoints.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const backendRegistry = new BackendRegistry()

export default backendRegistry