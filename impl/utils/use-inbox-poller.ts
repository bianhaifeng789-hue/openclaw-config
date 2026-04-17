// @ts-nocheck

/**
 * Use Inbox Poller Pattern - 收件箱轮询
 * 
 * Source: Claude Code hooks/useInboxPoller.ts
 * Pattern: inbox poller + message polling + notifications + periodic check
 */

interface InboxMessage {
  id: string
  type: 'notification' | 'task' | 'mention' | 'system'
  content: string
  priority: number
  read: boolean
  timestamp: number
}

class UseInboxPoller {
  private inbox: InboxMessage[] = []
  private pollIntervalMs = 30000
  private lastPollTime = 0
  private unreadCount = 0
  private handlers = new Set<(messages: InboxMessage[]) => void>()
  private polling = false

  /**
   * Start polling
   */
  start(): void {
    this.polling = true
    this.poll()
  }

  /**
   * Stop polling
   */
  stop(): void {
    this.polling = false
  }

  /**
   * Poll
   */
  private poll(): void {
    if (!this.polling) return

    this.lastPollTime = Date.now()

    // Would fetch from actual inbox
    // For demo, simulate

    // Schedule next poll
    setTimeout(() => this.poll(), this.pollIntervalMs)
  }

  /**
   * Set interval
   */
  setInterval(ms: number): void {
    this.pollIntervalMs = ms
  }

  /**
   * Get interval
   */
  getInterval(): number {
    return this.pollIntervalMs
  }

  /**
   * Add message
   */
  addMessage(type: InboxMessage['type'], content: string, priority?: number): InboxMessage {
    const id = `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

    const message: InboxMessage = {
      id,
      type,
      content,
      priority: priority ?? 0,
      read: false,
      timestamp: Date.now()
    }

    this.inbox.push(message)
    this.unreadCount++

    this.notifyHandlers()

    return message
  }

  /**
   * Mark read
   */
  markRead(id: string): boolean {
    const message = this.inbox.find(m => m.id === id)
    if (!message || message.read) return false

    message.read = true
    this.unreadCount--

    return true
  }

  /**
   * Mark all read
   */
  markAllRead(): number {
    let count = 0

    for (const message of this.inbox) {
      if (!message.read) {
        message.read = true
        count++
      }
    }

    this.unreadCount = 0

    return count
  }

  /**
   * Get inbox
   */
  getInbox(): InboxMessage[] {
    return [...this.inbox]
  }

  /**
   * Get unread
   */
  getUnread(): InboxMessage[] {
    return this.inbox.filter(m => !m.read)
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.unreadCount
  }

  /**
   * Get by type
   */
  getByType(type: InboxMessage['type']): InboxMessage[] {
    return this.inbox.filter(m => m.type === type)
  }

  /**
   * Clear inbox
   */
  clear(): void {
    this.inbox = []
    this.unreadCount = 0
  }

  /**
   * Register handler
   */
  onMessage(handler: (messages: InboxMessage[]) => void): () => void {
    this.handlers.add(handler)

    return () => this.handlers.delete(handler)
  }

  /**
   * Notify handlers
   */
  private notifyHandlers(): void {
    for (const handler of this.handlers) {
      handler(this.inbox)
    }
  }

  /**
   * Get stats
   */
  getStats(): {
    messagesCount: number
    unreadCount: number
    lastPollTime: number
    polling: boolean
    handlersCount: number
  } {
    return {
      messagesCount: this.inbox.length,
      unreadCount: this.unreadCount,
      lastPollTime: this.lastPollTime,
      polling: this.polling,
      handlersCount: this.handlers.size
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.stop()
    this.clear()
    this.handlers.clear()
    this.pollIntervalMs = 30000
    this.lastPollTime = 0
  }
}

// Global singleton
export const useInboxPoller = new UseInboxPoller()

export default useInboxPoller