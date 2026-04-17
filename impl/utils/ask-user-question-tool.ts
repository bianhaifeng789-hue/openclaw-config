// @ts-nocheck

/**
 * Ask User Question Tool Pattern - 询问用户问题工具
 * 
 * Source: Claude Code tools/AskUserQuestionTool/AskUserQuestionTool.ts + tools/AskUserQuestionTool/AskUserQuestionTool.tsx
 * Pattern: ask user question + user interaction + prompts + questions
 */

interface UserQuestion {
  id: string
  question: string
  options?: string[]
  answer?: string
  answeredAt?: number
  timestamp: number
}

class AskUserQuestionTool {
  private questions = new Map<string, UserQuestion>()
  private questionCounter = 0
  private pendingQueue: string[] = []

  /**
   * Ask question
   */
  ask(question: string, options?: string[]): UserQuestion {
    const id = `question-${++this.questionCounter}-${Date.now()}`

    const userQuestion: UserQuestion = {
      id,
      question,
      options,
      timestamp: Date.now()
    }

    this.questions.set(id, userQuestion)
    this.pendingQueue.push(id)

    return userQuestion
  }

  /**
   * Answer question
   */
  answer(id: string, answer: string): boolean {
    const question = this.questions.get(id)
    if (!question) return false

    question.answer = answer
    question.answeredAt = Date.now()

    const index = this.pendingQueue.indexOf(id)
    if (index !== -1) this.pendingQueue.splice(index, 1)

    return true
  }

  /**
   * Get question
   */
  getQuestion(id: string): UserQuestion | undefined {
    return this.questions.get(id)
  }

  /**
   * Get pending questions
   */
  getPending(): UserQuestion[] {
    return this.pendingQueue
      .map(id => this.questions.get(id))
      .filter(q => q !== undefined) as UserQuestion[]
  }

  /**
   * Get answered questions
   */
  getAnswered(): UserQuestion[] {
    return Array.from(this.questions.values())
      .filter(q => q.answeredAt !== undefined)
  }

  /**
   * Get stats
   */
  getStats(): {
    questionsCount: number
    pendingCount: number
    answeredCount: number
    averageResponseTime: number
  } {
    const answered = this.getAnswered()
    const avgResponseTime = answered.length > 0
      ? answered.reduce((sum, q) => sum + ((q.answeredAt ?? 0) - q.timestamp), 0) / answered.length
      : 0

    return {
      questionsCount: this.questions.size,
      pendingCount: this.pendingQueue.length,
      answeredCount: answered.length,
      averageResponseTime: avgResponseTime
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.questions.clear()
    this.pendingQueue = []
    this.questionCounter = 0
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const askUserQuestionTool = new AskUserQuestionTool()

export default askUserQuestionTool