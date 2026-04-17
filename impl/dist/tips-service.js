// @ts-nocheck
class TipsService {
    tips = new Map();
    shownToday = new Set();
    tipCounter = 0;
    lastShownTime = 0;
    config = {
        maxPerSession: 3,
        showIntervalMs: 10 * 60 * 1000, // 10 minutes
        categories: ['shortcut', 'feature', 'best_practice', 'troubleshooting']
    };
    /**
     * Add tip
     */
    addTip(tip) {
        const id = `tip-${++this.tipCounter}`;
        const fullTip = {
            id,
            ...tip
        };
        this.tips.set(id, fullTip);
        return fullTip;
    }
    /**
     * Get tip to show
     */
    getTipToShow(context) {
        // Check limits
        if (this.shownToday.size >= this.config.maxPerSession) {
            return null;
        }
        if (Date.now() - this.lastShownTime < this.config.showIntervalMs) {
            return null;
        }
        // Get available tips
        const available = Array.from(this.tips.values())
            .filter(t => !this.shownToday.has(t.id))
            .filter(t => this.config.categories.includes(t.category))
            .filter(t => !context || !t.context || t.context.includes(context))
            .sort((a, b) => b.priority - a.priority);
        if (available.length === 0) {
            return null;
        }
        // Return top tip
        const tip = available[0];
        this.shownToday.add(tip.id);
        this.lastShownTime = Date.now();
        return tip;
    }
    /**
     * Format tip for display
     */
    formatTip(tip) {
        const categoryEmoji = {
            shortcut: '⌨️',
            feature: '✨',
            best_practice: '💡',
            troubleshooting: '🔧'
        };
        const emoji = categoryEmoji[tip.category] ?? '📝';
        return `${emoji} **${tip.title}**\n${tip.content}`;
    }
    /**
     * Get tip by ID
     */
    getById(id) {
        return this.tips.get(id);
    }
    /**
     * Get tips by category
     */
    getByCategory(category) {
        return Array.from(this.tips.values())
            .filter(t => t.category === category);
    }
    /**
     * Get all tips
     */
    getAll() {
        return Array.from(this.tips.values());
    }
    /**
     * Mark tip as shown
     */
    markShown(id) {
        this.shownToday.add(id);
        this.lastShownTime = Date.now();
    }
    /**
     * Clear shown today (reset at midnight)
     */
    clearShownToday() {
        this.shownToday.clear();
        this.lastShownTime = 0;
    }
    /**
     * Set config
     */
    setConfig(config) {
        this.config = { ...this.config, ...config };
    }
    /**
     * Get stats
     */
    getStats() {
        const categoriesCount = {
            shortcut: 0,
            feature: 0,
            best_practice: 0,
            troubleshooting: 0
        };
        for (const tip of this.tips.values()) {
            categoriesCount[tip.category]++;
        }
        return {
            totalTips: this.tips.size,
            shownToday: this.shownToday.size,
            categoriesCount
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.tips.clear();
        this.shownToday.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.tipCounter = 0;
        this.lastShownTime = 0;
        this.config = {
            maxPerSession: 3,
            showIntervalMs: 10 * 60 * 1000,
            categories: ['shortcut', 'feature', 'best_practice', 'troubleshooting']
        };
    }
}
// Global singleton
export const tipsService = new TipsService();
// Add default tips
tipsService.addTip({
    category: 'shortcut',
    title: '快速继续',
    content: '使用 "继续" 快速推进当前任务',
    priority: 80
});
tipsService.addTip({
    category: 'feature',
    title: '心跳任务',
    content: 'HEARTBEAT.md 定义定期检查任务',
    priority: 70
});
tipsService.addTip({
    category: 'best_practice',
    title: '记忆维护',
    content: '定期检查 memory/ 文件夹更新 MEMORY.md',
    priority: 90
});
tipsService.addTip({
    category: 'troubleshooting',
    title: '超时处理',
    content: '使用 abortSafeSleep 处理可中断操作',
    priority: 60
});
export default tipsService;
//# sourceMappingURL=tips-service.js.map