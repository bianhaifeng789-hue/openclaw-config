// @ts-nocheck
class PromptSuggestionCore {
    suggestions = [];
    sentToday = new Set();
    lastSentTime = 0;
    suggestionCounter = 0;
    config = {
        maxPerDay: 5,
        minIntervalMs: 30 * 60 * 1000, // 30 minutes
        maxCacheSize: 50
    };
    /**
     * Generate suggestions based on context
     */
    generate(context) {
        const suggestions = [];
        // Task-based suggestions
        if (context.recentTasks?.length > 0) {
            const lastTask = context.recentTasks[context.recentTasks.length - 1];
            suggestions.push(this.createSuggestion(`继续 ${lastTask}`, 'task', 80, lastTask));
        }
        // File-based suggestions
        if (context.currentFile) {
            suggestions.push(this.createSuggestion(`分析 ${context.currentFile}`, 'context', 70, context.currentFile));
            suggestions.push(this.createSuggestion(`编辑 ${context.currentFile}`, 'action', 60, context.currentFile));
        }
        // Query-based suggestions
        if (context.recentQueries?.length > 0) {
            const lastQuery = context.recentQueries[context.recentQueries.length - 1];
            suggestions.push(this.createSuggestion(`更多关于 ${lastQuery}`, 'query', 50, lastQuery));
        }
        // Default suggestions
        suggestions.push(this.createSuggestion('检查进度', 'task', 40));
        suggestions.push(this.createSuggestion('总结工作', 'task', 30));
        // Sort by relevance
        suggestions.sort((a, b) => b.relevance - a.relevance);
        // Cache
        this.suggestions = suggestions.slice(0, this.config.maxCacheSize);
        return suggestions;
    }
    /**
     * Create suggestion
     */
    createSuggestion(text, category, relevance, context) {
        return {
            id: `suggest-${++this.suggestionCounter}`,
            text,
            category,
            relevance,
            context,
            timestamp: Date.now()
        };
    }
    /**
     * Get suggestions to send (frequency-controlled)
     */
    getToSend(count) {
        // Check daily limit
        if (this.sentToday.size >= this.config.maxPerDay) {
            return [];
        }
        // Check interval
        if (Date.now() - this.lastSentTime < this.config.minIntervalMs) {
            return [];
        }
        // Get top suggestions not sent today
        const available = this.suggestions.filter(s => !this.sentToday.has(s.id));
        return available.slice(0, count);
    }
    /**
     * Mark suggestion as sent
     */
    markSent(id) {
        this.sentToday.add(id);
        this.lastSentTime = Date.now();
    }
    /**
     * Get cached suggestions
     */
    getCached() {
        return [...this.suggestions];
    }
    /**
     * Clear daily cache (reset at midnight)
     */
    clearDaily() {
        this.sentToday.clear();
        this.lastSentTime = 0;
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
        return {
            cachedCount: this.suggestions.length,
            sentTodayCount: this.sentToday.size,
            maxPerDay: this.config.maxPerDay,
            lastSentTime: this.lastSentTime
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.suggestions = [];
        this.sentToday.clear();
        this.lastSentTime = 0;
        this.suggestionCounter = 0;
        this.config = {
            maxPerDay: 5,
            minIntervalMs: 30 * 60 * 1000,
            maxCacheSize: 50
        };
    }
}
// Global singleton
export const promptSuggestionCore = new PromptSuggestionCore();
export default promptSuggestionCore;
//# sourceMappingURL=prompt-suggestion-core.js.map