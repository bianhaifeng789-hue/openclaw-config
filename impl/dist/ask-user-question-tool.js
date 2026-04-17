// @ts-nocheck
class AskUserQuestionTool {
    questions = new Map();
    questionCounter = 0;
    pendingQueue = [];
    /**
     * Ask question
     */
    ask(question, options) {
        const id = `question-${++this.questionCounter}-${Date.now()}`;
        const userQuestion = {
            id,
            question,
            options,
            timestamp: Date.now()
        };
        this.questions.set(id, userQuestion);
        this.pendingQueue.push(id);
        return userQuestion;
    }
    /**
     * Answer question
     */
    answer(id, answer) {
        const question = this.questions.get(id);
        if (!question)
            return false;
        question.answer = answer;
        question.answeredAt = Date.now();
        const index = this.pendingQueue.indexOf(id);
        if (index !== -1)
            this.pendingQueue.splice(index, 1);
        return true;
    }
    /**
     * Get question
     */
    getQuestion(id) {
        return this.questions.get(id);
    }
    /**
     * Get pending questions
     */
    getPending() {
        return this.pendingQueue
            .map(id => this.questions.get(id))
            .filter(q => q !== undefined);
    }
    /**
     * Get answered questions
     */
    getAnswered() {
        return Array.from(this.questions.values())
            .filter(q => q.answeredAt !== undefined);
    }
    /**
     * Get stats
     */
    getStats() {
        const answered = this.getAnswered();
        const avgResponseTime = answered.length > 0
            ? answered.reduce((sum, q) => sum + ((q.answeredAt ?? 0) - q.timestamp), 0) / answered.length
            : 0;
        return {
            questionsCount: this.questions.size,
            pendingCount: this.pendingQueue.length,
            answeredCount: answered.length,
            averageResponseTime: avgResponseTime
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.questions.clear();
        this.pendingQueue = [];
        this.questionCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const askUserQuestionTool = new AskUserQuestionTool();
export default askUserQuestionTool;
//# sourceMappingURL=ask-user-question-tool.js.map