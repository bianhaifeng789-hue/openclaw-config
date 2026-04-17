// @ts-nocheck

/**
 * Diagnostic Tracking Pattern - 诊断追踪
 * 
 * Source: Claude Code services/diagnosticTracking.ts
 * Pattern: diagnostic tracking + metrics + health checks + alerts
 */

interface DiagnosticMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  tags?: Record<string, string>
}

interface DiagnosticAlert {
  id: string
  type: 'warning' | 'error' | 'critical'
  message: string
  metric: string
  threshold: number
  value: number
  timestamp: number
  resolved: boolean
}

class DiagnosticTracker {
  private metrics = new Map<string, DiagnosticMetric[]>()
  private alerts: DiagnosticAlert[] = []
  private thresholds = new Map<string, { warning: number; error: number; critical: number }>()
  private alertCounter = 0

  private config = {
    maxMetricHistory: 100,
    autoAlert: true
  }

  /**
   * Track metric
   */
  track(name: string, value: number, unit: string = '', tags?: Record<string, string>): DiagnosticMetric {
    const metric: DiagnosticMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    }

    const history = this.metrics.get(name) ?? []
    history.push(metric)

    // Trim history
    while (history.length > this.config.maxMetricHistory) {
      history.shift()
    }

    this.metrics.set(name, history)

    // Check thresholds
    if (this.config.autoAlert) {
      this.checkThreshold(name, value)
    }

    return metric
  }

  /**
   * Set threshold
   */
  setThreshold(name: string, warning: number, error: number, critical: number): void {
    this.thresholds.set(name, { warning, error, critical })
  }

  /**
   * Check threshold
   */
  private checkThreshold(name: string, value: number): void {
    const threshold = this.thresholds.get(name)
    if (!threshold) return

    let type: DiagnosticAlert['type'] | null = null

    if (value >= threshold.critical) type = 'critical'
    else if (value >= threshold.error) type = 'error'
    else if (value >= threshold.warning) type = 'warning'

    if (type) {
      this.createAlert(type, name, threshold[type], value)
    }
  }

  /**
   * Create alert
   */
  private createAlert(type: DiagnosticAlert['type'], metric: string, threshold: number, value: number): void {
    const alert: DiagnosticAlert = {
      id: `alert-${++this.alertCounter}`,
      type,
      message: `${metric} exceeded ${type} threshold: ${value} > ${threshold}`,
      metric,
      threshold,
      value,
      timestamp: Date.now(),
      resolved: false
    }

    this.alerts.push(alert)
  }

  /**
   * Resolve alert
   */
  resolveAlert(id: string): boolean {
    const alert = this.alerts.find(a => a.id === id)
    if (!alert) return false

    alert.resolved = true

    return true
  }

  /**
   * Get metric history
   */
  getMetricHistory(name: string): DiagnosticMetric[] {
    return this.metrics.get(name) ?? []
  }

  /**
   * Get latest metric
   */
  getLatest(name: string): DiagnosticMetric | undefined {
    const history = this.metrics.get(name)
    if (!history || history.length === 0) return undefined

    return history[history.length - 1]
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): DiagnosticAlert[] {
    return this.alerts.filter(a => !a.resolved)
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): DiagnosticAlert[] {
    return [...this.alerts]
  }

  /**
   * Get stats
   */
  getStats(): {
    metricsCount: number
    totalSamples: number
    activeAlerts: number
    resolvedAlerts: number
  } {
    const totalSamples = Array.from(this.metrics.values())
      .reduce((sum, h) => sum + h.length, 0)

    return {
      metricsCount: this.metrics.size,
      totalSamples,
      activeAlerts: this.getActiveAlerts().length,
      resolvedAlerts: this.alerts.filter(a => a.resolved).length
    }
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear()
  }

  /**
   * Clear alerts
   */
  clearAlerts(): void {
    this.alerts = []
    this.alertCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearMetrics()
    this.clearAlerts()
    this.thresholds.clear()
    this.config = {
      maxMetricHistory: 100,
      autoAlert: true
    }
  }
}

// Global singleton
export const diagnosticTracker = new DiagnosticTracker()

// Set default thresholds
diagnosticTracker.setThreshold('memory_usage', 80, 90, 95)
diagnosticTracker.setThreshold('error_rate', 1, 5, 10)
diagnosticTracker.setThreshold('latency_ms', 500, 1000, 5000)

export default diagnosticTracker