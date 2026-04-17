// @ts-nocheck
class NotifierService {
    notifications = [];
    notificationCounter = 0;
    unreadCount = 0;
    config = {
        enabled: true,
        sound: false,
        badge: true,
        desktop: true,
        terminal: true
    };
    /**
     * Send notification
     */
    notify(title, message, type = 'info') {
        if (!this.config.enabled) {
            throw new Error('Notifications disabled');
        }
        const id = `notify-${++this.notificationCounter}`;
        const notification = {
            id,
            title,
            message,
            type,
            timestamp: Date.now(),
            read: false
        };
        this.notifications.push(notification);
        this.unreadCount++;
        // Send to configured channels
        if (this.config.desktop) {
            this.sendDesktop(notification);
        }
        if (this.config.terminal) {
            this.sendTerminal(notification);
        }
        if (this.config.sound) {
            this.playSound(type);
        }
        return notification;
    }
    /**
     * Send desktop notification
     */
    sendDesktop(notification) {
        // Would use actual desktop notification API
        // For demo, just log
        console.log(`[Desktop Notify] ${notification.title}: ${notification.message}`);
    }
    /**
     * Send terminal notification
     */
    sendTerminal(notification) {
        const icon = this.getIcon(notification.type);
        console.log(`${icon} ${notification.title}: ${notification.message}`);
    }
    /**
     * Play sound
     */
    playSound(type) {
        // Would play actual sound
        // For demo, just log
        console.log(`[Sound] ${type} notification`);
    }
    /**
     * Get icon for type
     */
    getIcon(type) {
        switch (type) {
            case 'info': return 'ℹ️';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'success': return '✅';
            default: return '🔔';
        }
    }
    /**
     * Mark as read
     */
    markRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification)
            return false;
        if (!notification.read) {
            notification.read = true;
            this.unreadCount--;
        }
        return true;
    }
    /**
     * Mark all as read
     */
    markAllRead() {
        let marked = 0;
        for (const notification of this.notifications) {
            if (!notification.read) {
                notification.read = true;
                marked++;
            }
        }
        this.unreadCount = 0;
        return marked;
    }
    /**
     * Get unread count
     */
    getUnreadCount() {
        return this.unreadCount;
    }
    /**
     * Get all notifications
     */
    getAll() {
        return [...this.notifications];
    }
    /**
     * Get unread notifications
     */
    getUnread() {
        return this.notifications.filter(n => !n.read);
    }
    /**
     * Get recent notifications
     */
    getRecent(count) {
        return this.notifications.slice(-count);
    }
    /**
     * Clear all notifications
     */
    clear() {
        this.notifications = [];
        this.unreadCount = 0;
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get config
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Get stats
     */
    getStats() {
        const byType = { info: 0, warning: 0, error: 0, success: 0 };
        for (const notification of this.notifications) {
            byType[notification.type]++;
        }
        return {
            total: this.notifications.length,
            unread: this.unreadCount,
            byType
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.notifications = [];
        this.notificationCounter = 0;
        this.unreadCount = 0;
        this.config = {
            enabled: true,
            sound: false,
            badge: true,
            desktop: true,
            terminal: true
        };
    }
}
// Global singleton
export const notifierService = new NotifierService();
export default notifierService;
//# sourceMappingURL=notifier-service.js.map