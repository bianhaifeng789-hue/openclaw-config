// @ts-nocheck

/**
 * Use Status Pattern - 状态Hook
 * 
 * Source: Claude Code hooks/useStatus.ts
 * Pattern: status hook + system status + monitoring + health check
 */

interface SystemStatus {
  overall: 'healthy' | 'degraded' | 'critical' | 'unknown'
  components: Array<{ name: string; status: string; details?: string }>
  lastUpdated: number
  uptimeMs: number
}

class UseStatus {
  private status: SystemStatus = {
    overall: 'healthy',
    components: [],
    lastUpdated: Date.now(),
    uptimeMs: 0
  }
  private startTime = Date.now()
  private listeners = new Set<(status: SystemStatus) => void>()

  /**
   * Get status
   */
  getStatus(): SystemStatus {
    this.status.uptimeMs = Date.now() - this.startTime
    return { ...this.status }
  }

  /**
   * Update component status
   */
  updateComponent(name: string, status: string, details?: string): void {
    const existing = this.status.components.find(c => c.name === name)

    if (existing) {
      existing.status = status
      existing.details = details
    } else {
      this.status.components.push({ name, status, details })
    }

    this.status.lastUpdated = Date.now()
    this.recalculateOverall()
    this.notifyListeners()
  }

  /**
   * Recalculate overall status
   */
  private recalculateOverall(): void {
    const components = this.status.components

    if (components.some(c => c.status === 'critical')) {
      this.status.overall = 'critical'
    } else if (components.some(c => c.status === 'degraded')) {
      this.status.overall = 'degraded'
    } else if (components.every(c => c.status === 'healthy')) {
      this.status.overall = 'healthy'
    } else {
      this.status.overall = 'unknown'
    }
  }

  /**
   * Remove component
   */
  removeComponent(name: string): boolean {
    const index = this.status.components.findIndex(c => c.name === name)
    if (index === -1) return false

    this.status.components.splice(index, 1)
    this.recalculateOverall()
    this.notifyListeners()

    return true
  }

  /**
   * Get component
   */
  getComponent(name: string): { name: string; status: string; details?: string } | undefined {
    return this.status.components.find(c => c.name === name)
  }

  /**
   * Check health
   */
  isHealthy(): boolean {
    return this.status.overall === 'healthy'
  }

  /**
   * Check degraded
   */
  isDegraded(): boolean {
    return this.status.overall === 'degraded'
  }

  /**
   * Check critical
   */
  isCritical(): boolean {
    return this.status.overall === 'critical'
  }

  /**
   * Get uptime
   */
  getUptime(): number {
    return Date.now() - this.startTime
  }

  /**
   * Subscribe
   */
  subscribe(listener: (status: SystemStatus) => void): () => void {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  /**
   * Notify listeners
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getStatus())
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    componentsCount: number
    overallStatus: string
    uptimeMs: number
    listenersCount: number
    healthyComponents: number
  } {
    const healthy = this.status.components.filter(c => c.status === 'healthy').length

    return {
      componentsCount: this.status.components.length,
      overallStatus: this.status.overall,
      uptimeMs: this.getUptime(),
      listenersCount: this.listeners.size,
      healthyComponents: healthy
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.status = {
      overall: 'healthy',
      components: [],
      lastUpdated: Date.now(),
      uptimeMs: 0
    }
    this.startTime = Date.now()
    this.listeners.clear()
  }
}

// Global singleton
export const useStatus = new UseStatus()

// Initialize default components
useStatus.updateComponent('core', 'healthy')
useStatus.updateComponent('network', 'healthy')

export default useStatus