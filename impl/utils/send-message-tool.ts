// @ts-nocheck

/**
 * Send Message Tool Pattern - 发送消息工具
 * 
 * Source: Claude Code tools/SendMessageTool/SendMessageTool.ts
 * Pattern: send message + messaging + communication + notifications
 */

interface SentMessage {
  id: string
  recipient: string
  content: string
  type: 'text' | 'card' | 'notification'
  success: boolean
  timestamp: number
}

class SendMessageTool {
  private messages: SentMessage[] = []
  private messageCounter = 0

  /**
   * Send message
   */
  send(recipient: string, content: string, type?: SentMessage['type']): SentMessage {
    const id = `msg-${++this.messageCounter}-${Date.now()}`

    const message: SentMessage = {
      id,
      recipient,
      content,
      type: type ?? 'text',
      success: true,
      timestamp: Date.now()
    }

    this.messages.push(message)

    return message
  }

  /**
   * Send text
   */
  sendText(recipient: string, content: string): SentMessage {
    return this.send(recipient, content, 'text')
  }

  /**
   * Send card
   */
  sendCard(recipient: string, content: string): SentMessage {
    return this.send(recipient, content, 'card')
  }

  /**
   * Send notification
   */
  sendNotification(recipient: string, content: string): SentMessage {
    return this.send(recipient, content, 'notification')
  }

  /**
   * Get message
   */
  getMessage(id: string): SentMessage | undefined {
    return this.messages.find(m => m.id === id)
  }

  /**
   * Get messages by recipient
   */
  getByRecipient(recipient: string): SentMessage[] {
    return this.messages.filter(m => m.recipient === recipient)
  }

  /**
   * Get recent messages
   */
  getRecent(count: number = 10): SentMessage[] {
    return this.messages.slice(-count)
  }

  /**
   * Get failed messages
   */
  getFailed(): SentMessage[] {
    return this.messages.filter(m => !m.success)
  }

  /**
   * Get stats
   */
  getStats(): {
    messagesCount: number
    successfulCount: number
    failedCount: number
    byType: Record<SentMessage['type'], number>
    uniqueRecipients: number
  } {
    const byType: Record<SentMessage['type'], number> = {
      text: 0, card: 0, notification: 0
    }

    for (const message of this.messages) {
      byType[message.type]++
    }

    const uniqueRecipients = new Set(this.messages.map(m => m.recipient)).size

    return {
      messagesCount: this.messages.length,
      successfulCount: this.messages.filter(m => m.success).length,
      failedCount: this.messages.filter(m => !m.success).length,
      byType,
      uniqueRecipients: uniqueRecipients
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.messages = []
    this.messageCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clearHistory()
  }
}

// Global singleton
export const sendMessageTool = new SendMessageTool()

export default sendMessageTool