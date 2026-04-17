// @ts-nocheck
class StatusNoticeService {
    notices = new Map();
    noticeCounter = 0;
    activeNotices = [];
    config = {
        maxNotices: 5,
        defaultDuration: 5000
    };
    /**
     * Show notice
     */
    show(type, message, detail, duration) {
        const id = `notice-${++this.noticeCounter}-${Date.now()}`;
        const notice = {
            id,
            type,
            message,
            detail,
            duration: duration ?? this.config.defaultDuration,
            dismissible: true,
            createdAt: Date.now(),
            dismissed: false
        };
        this.notices.set(id, notice);
        this.activeNotices.push(id);
        // Trim active notices
        while (this.activeNotices.length > this.config.maxNotices) {
            const oldest = this.activeNotices.shift();
            if (oldest)
                this.dismiss(oldest);
        }
        return notice;
    }
    /**
     * Show info
     */
    info(message, detail) {
        return this.show('info', message, detail);
    }
    /**
     * Show warning
     */
    warning(message, detail) {
        return this.show('warning', message, detail);
    }
    /**
     * Show error
     */
    error(message, detail) {
        return this.show('error', message, detail, 0); // No auto-dismiss
    }
    /**
     * Show success
     */
    success(message, detail) {
        return this.show('success', message, detail, 3000);
    }
    /**
     * Show loading
     */
    loading(message, detail) {
        return this.show('loading', message, detail, 0); // No auto-dismiss
    }
    /**
     * Dismiss notice
     */
    dismiss(id) {
        const notice = this.notices.get(id);
        if (!notice)
            return false;
        notice.dismissed = true;
        this.activeNotices = this.activeNotices.filter(n => n !== id);
        return true;
    }
    /**
     * Dismiss all
     */
    dismissAll() {
        let count = 0;
        for (const id of this.activeNotices) {
            if (this.dismiss(id))
                count++;
        }
        return count;
    }
    /**
     * Get notice
     */
    getNotice(id) {
        return this.notices.get(id);
    }
    /**
     * Get active notices
     */
    getActiveNotices() {
        return this.activeNotices
            .map(id => this.notices.get(id))
            .filter(n => n !== undefined);
    }
    /**
     * Get notices by type
     */
    getByType(type) {
        return Array.from(this.notices.values())
            .filter(n => n.type === type);
    }
    /**
     * Get stats
     */
    getStats() {
        const notices = Array.from(this.notices.values());
        const byType = {
            info: 0, warning: 0, error: 0, success: 0, loading: 0
        };
        for (const notice of notices) {
            byType[notice.type]++;
        }
        return {
            totalNotices: notices.length,
            activeNotices: this.activeNotices.length,
            dismissedNotices: notices.filter(n => n.dismissed).length,
            byType
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.notices.clear();
        this.activeNotices = [];
        this.noticeCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.config = {
            maxNotices: 5,
            defaultDuration: 5000
        };
    }
}
// Global singleton
export const statusNoticeService = new StatusNoticeService();
export default statusNoticeService;
//# sourceMappingURL=status-notice-service.js.map