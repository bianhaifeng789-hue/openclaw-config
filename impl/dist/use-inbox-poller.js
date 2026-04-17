// @ts-nocheck
class UseInboxPoller {
    inbox = [];
    pollIntervalMs = 30000;
    lastPollTime = 0;
    unreadCount = 0;
    handlers = new Set();
    polling = false;
    /**
     * Start polling
     */
    start() {
        this.polling = true;
        this.poll();
    }
    /**
     * Stop polling
     */
    stop() {
        this.polling = false;
    }
    /**
     * Poll
     */
    poll() {
        if (!this.polling)
            return;
        this.lastPollTime = Date.now();
        // Would fetch from actual inbox
        // For demo, simulate
        // Schedule next poll
        setTimeout(() => this.poll(), this.pollIntervalMs);
    }
    /**
     * Set interval
     */
    setInterval(ms) {
        this.pollIntervalMs = ms;
    }
    /**
     * Get interval
     */
    getInterval() {
        return this.pollIntervalMs;
    }
    /**
     * Add message
     */
    addMessage(type, content, priority) {
        const id = `inbox-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const message = {
            id,
            type,
            content,
            priority: priority ?? 0,
            read: false,
            timestamp: Date.now()
        };
        this.inbox.push(message);
        this.unreadCount++;
        this.notifyHandlers();
        return message;
    }
    /**
     * Mark read
     */
    markRead(id) {
        const message = this.inbox.find(m => m.id === id);
        if (!message || message.read)
            return false;
        message.read = true;
        this.unreadCount--;
        return true;
    }
    /**
     * Mark all read
     */
    markAllRead() {
        let count = 0;
        for (const message of this.inbox) {
            if (!message.read) {
                message.read = true;
                count++;
            }
        }
        this.unreadCount = 0;
        return count;
    }
    /**
     * Get inbox
     */
    getInbox() {
        return [...this.inbox];
    }
    /**
     * Get unread
     */
    getUnread() {
        return this.inbox.filter(m => !m.read);
    }
    /**
     * Get unread count
     */
    getUnreadCount() {
        return this.unreadCount;
    }
    /**
     * Get by type
     */
    getByType(type) {
        return this.inbox.filter(m => m.type === type);
    }
    /**
     * Clear inbox
     */
    clear() {
        this.inbox = [];
        this.unreadCount = 0;
    }
    /**
     * Register handler
     */
    onMessage(handler) {
        this.handlers.add(handler);
        return () => this.handlers.delete(handler);
    }
    /**
     * Notify handlers
     */
    notifyHandlers() {
        for (const handler of this.handlers) {
            handler(this.inbox);
        }
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            messagesCount: this.inbox.length,
            unreadCount: this.unreadCount,
            lastPollTime: this.lastPollTime,
            polling: this.polling,
            handlersCount: this.handlers.size
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.stop();
        this.clear();
        this.handlers.clear();
        this.pollIntervalMs = 30000;
        this.lastPollTime = 0;
    }
}
// Global singleton
export const useInboxPoller = new UseInboxPoller();
export default useInboxPoller;
//# sourceMappingURL=use-inbox-poller.js.map