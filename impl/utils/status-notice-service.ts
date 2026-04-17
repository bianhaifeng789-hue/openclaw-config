// @ts-nocheck

/**
 * Status Notice Pattern - 状态通知
 * 
 * Source: Claude Code utils/statusNoticeDefinitions.tsx + utils/status.tsx
 * Pattern: status notice + notifications + status bar + UI updates
 */

interface StatusNotice {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'loading'
  message: string
  detail?: string
  duration?: number
  dismissible: boolean
  createdAt: number
  dismissed: boolean
}

class StatusNoticeService {
  private notices = new Map<string, StatusNotice>()
  private noticeCounter = 0
  private activeNotices: string[] = []

  private config = {
    maxNotices: 5,
    defaultDuration: 5000
  }

  /**
   * Show notice
   */
  show(type: StatusNotice['type'], message: string, detail?: string, duration?: number): StatusNotice {
    const id = `notice-${++this.noticeCounter}-${Date.now()}`

    const notice: StatusNotice = {
      id,
      type,
      message,
      detail,
      duration: duration ?? this.config.defaultDuration,
      dismissible: true,
      createdAt: Date.now(),
      dismissed: false
    }

    this.notices.set(id, notice)
    this.activeNotices.push(id)

    // Trim active notices
    while (this.activeNotices.length > this.config.maxNotices) {
      const oldest = this.activeNotices.shift()
      if (oldest) this.dismiss(oldest)
    }

    return notice
  }

  /**
   * Show info
   */
  info(message: string, detail?: string): StatusNotice {
    return this.show('info', message, detail)
  }

  /**
   * Show warning
   */
  warning(message: string, detail?: string): StatusNotice {
    return this.show('warning', message, detail)
  }

  /**
   * Show error
   */
  error(message: string, detail?: string): StatusNotice {
    return this.show('error', message, detail, 0) // No auto-dismiss
  }

  /**
   * Show success
   */
  success(message: string, detail?: string): StatusNotice {
    return this.show('success', message, detail, 3000)
  }

  /**
   * Show loading
   */
  loading(message: string, detail?: string): StatusNotice {
    return this.show('loading', message, detail, 0) // No auto-dismiss
  }

  /**
   * Dismiss notice
   */
  dismiss(id: string): boolean {
    const notice = this.notices.get(id)
    if (!notice) return false

    notice.dismissed = true
    this.activeNotices = this.activeNotices.filter(n => n !== id)

    return true
  }

  /**
   * Dismiss all
   */
  dismissAll(): number {
    let count = 0

    for (const id of this.activeNotices) {
      if (this.dismiss(id)) count++
    }

    return count
  }

  /**
   * Get notice
   */
  getNotice(id: string): StatusNotice | undefined {
    return this.notices.get(id)
  }

  /**
   * Get active notices
   */
  getActiveNotices(): StatusNotice[] {
    return this.activeNotices
      .map(id => this.notices.get(id))
      .filter(n => n !== undefined) as StatusNotice[]
  }

  /**
   * Get notices by type
   */
  getByType(type: StatusNotice['type']): StatusNotice[] {
    return Array.from(this.notices.values())
      .filter(n => n.type === type)
  }

  /**
   * Get stats
   */
  getStats(): {
    totalNotices: number
    activeNotices: number
    dismissedNotices: number
    byType: Record<StatusNotice['type'], number>
  } {
    const notices = Array.from(this.notices.values())
    const byType: Record<StatusNotice['type'], number> = {
      info: 0, warning: 0, error: 0, success: 0, loading: 0
    }

    for (const notice of notices) {
      byType[notice.type]++
    }

    return {
      totalNotices: notices.length,
      activeNotices: this.activeNotices.length,
      dismissedNotices: notices.filter(n => n.dismissed).length,
      byType
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.notices.clear()
    this.activeNotices = []
    this.noticeCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.config = {
      maxNotices: 5,
      defaultDuration: 5000
    }
  }
}

// Global singleton
export const statusNoticeService = new StatusNoticeService()

export default statusNoticeService