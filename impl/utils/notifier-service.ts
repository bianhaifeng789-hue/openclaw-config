// @ts-nocheck

/**
 * Notifier Pattern - 通知器
 * 
 * Source: Claude Code services/notifier.ts + utils/terminal-notifier-state.json
 * Pattern: notifications + desktop notify + terminal notify + sound + badge
 */

interface NotificationConfig {
  enabled: boolean
  sound: boolean
  badge: boolean
  desktop: boolean
  terminal: boolean
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  timestamp: number
  read: boolean
}

class NotifierService {
  private notifications: Notification[] = []
  private notificationCounter = 0
  private unreadCount = 0

  private config: NotificationConfig = {
    enabled: true,
    sound: false,
    badge: true,
    desktop: true,
    terminal: true
  }

  /**
   * Send notification
   */
  notify(title: string, message: string, type: Notification['type'] = 'info'): Notification {
    if (!this.config.enabled) {
      throw new Error('Notifications disabled')
    }

    const id = `notify-${++this.notificationCounter}`

    const notification: Notification = {
      id,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false
    }

    this.notifications.push(notification)
    this.unreadCount++

    // Send to configured channels
    if (this.config.desktop) {
      this.sendDesktop(notification)
    }

    if (this.config.terminal) {
      this.sendTerminal(notification)
    }

    if (this.config.sound) {
      this.playSound(type)
    }

    return notification
  }

  /**
   * Send desktop notification
   */
  private sendDesktop(notification: Notification): void {
    // Would use actual desktop notification API
    // For demo, just log
    console.log(`[Desktop Notify] ${notification.title}: ${notification.message}`)
  }

  /**
   * Send terminal notification
   */
  private sendTerminal(notification: Notification): void {
    const icon = this.getIcon(notification.type)
    console.log(`${icon} ${notification.title}: ${notification.message}`)
  }

  /**
   * Play sound
   */
  private playSound(type: Notification['type']): void {
    // Would play actual sound
    // For demo, just log
    console.log(`[Sound] ${type} notification`)
  }

  /**
   * Get icon for type
   */
  private getIcon(type: Notification['type']): string {
    switch (type) {
      case 'info': return 'ℹ️'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'success': return '✅'
      default: return '🔔'
    }
  }

  /**
   * Mark as read
   */
  markRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id)
    if (!notification) return false

    if (!notification.read) {
      notification.read = true
      this.unreadCount--
    }

    return true
  }

  /**
   * Mark all as read
   */
  markAllRead(): number {
    let marked = 0

    for (const notification of this.notifications) {
      if (!notification.read) {
        notification.read = true
        marked++
      }
    }

    this.unreadCount = 0

    return marked
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.unreadCount
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications]
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read)
  }

  /**
   * Get recent notifications
   */
  getRecent(count: number): Notification[] {
    return this.notifications.slice(-count)
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications = []
    this.unreadCount = 0
  }

  /**
   * Set config
   */
  setConfig(config: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get config
   */
  getConfig(): NotificationConfig {
    return { ...this.config }
  }

  /**
   * Get stats
   */
  getStats(): {
    total: number
    unread: number
    byType: Record<Notification['type'], number>
  } {
    const byType: Record<Notification['type'], number> = { info: 0, warning: 0, error: 0, success: 0 }

    for (const notification of this.notifications) {
      byType[notification.type]++
    }

    return {
      total: this.notifications.length,
      unread: this.unreadCount,
      byType
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.notifications = []
    this.notificationCounter = 0
    this.unreadCount = 0
    this.config = {
      enabled: true,
      sound: false,
      badge: true,
      desktop: true,
      terminal: true
    }
  }
}

// Global singleton
export const notifierService = new NotifierService()

export default notifierService