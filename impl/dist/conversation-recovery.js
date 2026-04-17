// @ts-nocheck
class ConversationRecovery {
    recovered = new Map();
    /**
     * Save conversation state
     */
    save(sessionId, messages, context) {
        const state = {
            sessionId,
            messages,
            context,
            recoveredAt: Date.now()
        };
        this.recovered.set(sessionId, state);
        return state;
    }
    /**
     * Recover conversation
     */
    recover(sessionId) {
        const state = this.recovered.get(sessionId);
        if (!state)
            return null;
        state.recoveredAt = Date.now();
        return state;
    }
    /**
     * Rebuild context from messages
     */
    rebuildContext(messages) {
        // Would extract context from message history
        // For demo, return basic context
        const userMessages = messages.filter(m => m.role === 'user');
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        return {
            messageCount: messages.length,
            userMessages: userMessages.length,
            assistantMessages: assistantMessages.length,
            lastUserMessage: userMessages.length > 0 ? userMessages[userMessages.length - 1].content : null,
            lastAssistantMessage: assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].content : null
        };
    }
    /**
     * Get conversation state
     */
    getState(sessionId) {
        return this.recovered.get(sessionId);
    }
    /**
     * Get all recovered conversations
     */
    getAllRecovered() {
        return Array.from(this.recovered.values());
    }
    /**
     * Get messages by session
     */
    getMessages(sessionId) {
        const state = this.recovered.get(sessionId);
        return state?.messages ?? [];
    }
    /**
     * Get context by session
     */
    getContext(sessionId) {
        const state = this.recovered.get(sessionId);
        return state?.context ?? null;
    }
    /**
     * Delete conversation state
     */
    delete(sessionId) {
        return this.recovered.delete(sessionId);
    }
    /**
     * Get stats
     */
    getStats() {
        const states = Array.from(this.recovered.values());
        const totalMessages = states.reduce((sum, s) => sum + s.messages.length, 0);
        const avgMessages = states.length > 0 ? totalMessages / states.length : 0;
        return {
            recoveredCount: states.length,
            totalMessages,
            averageMessages: avgMessages
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.recovered.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const conversationRecovery = new ConversationRecovery();
export default conversationRecovery;
//# sourceMappingURL=conversation-recovery.js.map