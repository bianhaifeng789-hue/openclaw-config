// @ts-nocheck

/**
 * Conversation Recovery Pattern - 对话恢复
 * 
 * Source: Claude Code utils/conversationRecovery.ts
 * Pattern: conversation recovery + message history + context rebuild
 */

interface ConversationState {
  sessionId: string
  messages: Array<{ role: string; content: string }>
  context: Record<string, any>
  recoveredAt: number
  source?: string
}

class ConversationRecovery {
  private recovered = new Map<string, ConversationState>()

  /**
   * Save conversation state
   */
  save(sessionId: string, messages: Array<{ role: string; content: string }>, context: Record<string, any>): ConversationState {
    const state: ConversationState = {
      sessionId,
      messages,
      context,
      recoveredAt: Date.now()
    }

    this.recovered.set(sessionId, state)

    return state
  }

  /**
   * Recover conversation
   */
  recover(sessionId: string): ConversationState | null {
    const state = this.recovered.get(sessionId)
    if (!state) return null

    state.recoveredAt = Date.now()

    return state
  }

  /**
   * Rebuild context from messages
   */
  rebuildContext(messages: Array<{ role: string; content: string }>): Record<string, any> {
    // Would extract context from message history
    // For demo, return basic context
    const userMessages = messages.filter(m => m.role === 'user')
    const assistantMessages = messages.filter(m => m.role === 'assistant')

    return {
      messageCount: messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      lastUserMessage: userMessages.length > 0 ? userMessages[userMessages.length - 1].content : null,
      lastAssistantMessage: assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].content : null
    }
  }

  /**
   * Get conversation state
   */
  getState(sessionId: string): ConversationState | undefined {
    return this.recovered.get(sessionId)
  }

  /**
   * Get all recovered conversations
   */
  getAllRecovered(): ConversationState[] {
    return Array.from(this.recovered.values())
  }

  /**
   * Get messages by session
   */
  getMessages(sessionId: string): Array<{ role: string; content: string }> {
    const state = this.recovered.get(sessionId)
    return state?.messages ?? []
  }

  /**
   * Get context by session
   */
  getContext(sessionId: string): Record<string, any> | null {
    const state = this.recovered.get(sessionId)
    return state?.context ?? null
  }

  /**
   * Delete conversation state
   */
  delete(sessionId: string): boolean {
    return this.recovered.delete(sessionId)
  }

  /**
   * Get stats
   */
  getStats(): {
    recoveredCount: number
    totalMessages: number
    averageMessages: number
  } {
    const states = Array.from(this.recovered.values())
    const totalMessages = states.reduce((sum, s) => sum + s.messages.length, 0)
    const avgMessages = states.length > 0 ? totalMessages / states.length : 0

    return {
      recoveredCount: states.length,
      totalMessages,
      averageMessages: avgMessages
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.recovered.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const conversationRecovery = new ConversationRecovery()

export default conversationRecovery