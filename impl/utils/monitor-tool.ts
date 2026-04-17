// @ts-nocheck

/**
 * Monitor Tool Pattern - Monitor工具
 * 
 * Source: Claude Code tools/MonitorTool/MonitorTool.ts
 * Pattern: monitor tool + file watching + change detection + real-time updates
 */

interface MonitorEvent {
  type: 'create' | 'modify' | 'delete'
  path: string
  timestamp: number
}

interface Monitor {
  id: string
  path: string
  events: MonitorEvent[]
  active: boolean
  createdAt: number
}

class MonitorTool {
  private monitors = new Map<string, Monitor>()
  private monitorCounter = 0
  private listeners = new Map<string, Set<(event: MonitorEvent) => void>>()

  /**
   * Create monitor
   */
  create(path: string): Monitor {
    const id = `monitor-${++this.monitorCounter}-${Date.now()}`

    const monitor: Monitor = {
      id,
      path,
      events: [],
      active: true,
      createdAt: Date.now()
    }

    this.monitors.set(id, monitor)

    return monitor
  }

  /**
   * Stop monitor
   */
  stop(id: string): boolean {
    const monitor = this.monitors.get(id)
    if (!monitor) return false

    monitor.active = false

    return true
  }

  /**
   * Start monitor
   */
  start(id: string): boolean {
    const monitor = this.monitors.get(id)
    if (!monitor) return false

    monitor.active = true

    return true
  }

  /**
   * Delete monitor
   */
  delete(id: string): boolean {
    this.listeners.delete(id)

    return this.monitors.delete(id)
  }

  /**
   * Record event
   */
  recordEvent(monitorId: string, type: MonitorEvent['type'], path: string): MonitorEvent {
    const monitor = this.monitors.get(monitorId)

    const event: MonitorEvent = {
      type,
      path,
      timestamp: Date.now()
    }

    if (monitor) {
      monitor.events.push(event)
    }

    // Notify listeners
    const listeners = this.listeners.get(monitorId)
    if (listeners) {
      for (const listener of listeners) {
        listener(event)
      }
    }

    return event
  }

  /**
   * Subscribe
   */
  subscribe(monitorId: string, listener: (event: MonitorEvent) => void): () => void {
    const listeners = this.listeners.get(monitorId) ?? new Set()
    listeners.add(listener)
    this.listeners.set(monitorId, listeners)

    return () => listeners.delete(listener)
  }

  /**
   * Get monitor
   */
  getMonitor(id: string): Monitor | undefined {
    return this.monitors.get(id)
  }

  /**
   * Get active monitors
   */
  getActive(): Monitor[] {
    return Array.from(this.monitors.values())
      .filter(m => m.active)
  }

  /**
   * Get events
   */
  getEvents(monitorId: string): MonitorEvent[] {
    return this.monitors.get(monitorId)?.events ?? []
  }

  /**
   * Get recent events
   */
  getRecentEvents(monitorId: string, count: number = 10): MonitorEvent[] {
    const events = this.getEvents(monitorId)
    return events.slice(-count)
  }

  /**
   * Get stats
   */
  getStats(): {
    monitorsCount: number
    activeCount: number
    totalEvents: number
    listenersCount: number
  } {
    const monitors = Array.from(this.monitors.values())
    const totalEvents = monitors.reduce((sum, m) => sum + m.events.length, 0)

    return {
      monitorsCount: monitors.length,
      activeCount: monitors.filter(m => m.active).length,
      totalEvents: totalEvents,
      listenersCount: this.listeners.size
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.monitors.clear()
    this.listeners.clear()
    this.monitorCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const monitorTool = new MonitorTool()

export default monitorTool