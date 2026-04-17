// @ts-nocheck
class SendMessageTool {
    messages = [];
    messageCounter = 0;
    /**
     * Send message
     */
    send(recipient, content, type) {
        const id = `msg-${++this.messageCounter}-${Date.now()}`;
        const message = {
            id,
            recipient,
            content,
            type: type ?? 'text',
            success: true,
            timestamp: Date.now()
        };
        this.messages.push(message);
        return message;
    }
    /**
     * Send text
     */
    sendText(recipient, content) {
        return this.send(recipient, content, 'text');
    }
    /**
     * Send card
     */
    sendCard(recipient, content) {
        return this.send(recipient, content, 'card');
    }
    /**
     * Send notification
     */
    sendNotification(recipient, content) {
        return this.send(recipient, content, 'notification');
    }
    /**
     * Get message
     */
    getMessage(id) {
        return this.messages.find(m => m.id === id);
    }
    /**
     * Get messages by recipient
     */
    getByRecipient(recipient) {
        return this.messages.filter(m => m.recipient === recipient);
    }
    /**
     * Get recent messages
     */
    getRecent(count = 10) {
        return this.messages.slice(-count);
    }
    /**
     * Get failed messages
     */
    getFailed() {
        return this.messages.filter(m => !m.success);
    }
    /**
     * Get stats
     */
    getStats() {
        const byType = {
            text: 0, card: 0, notification: 0
        };
        for (const message of this.messages) {
            byType[message.type]++;
        }
        const uniqueRecipients = new Set(this.messages.map(m => m.recipient)).size;
        return {
            messagesCount: this.messages.length,
            successfulCount: this.messages.filter(m => m.success).length,
            failedCount: this.messages.filter(m => !m.success).length,
            byType,
            uniqueRecipients: uniqueRecipients
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.messages = [];
        this.messageCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const sendMessageTool = new SendMessageTool();
export default sendMessageTool;
//# sourceMappingURL=send-message-tool.js.map