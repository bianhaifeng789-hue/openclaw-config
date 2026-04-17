// @ts-nocheck
class ToolSearchUtils {
    tools = new Map();
    categories = new Set();
    /**
     * Register tool
     */
    register(tool) {
        this.tools.set(tool.name, tool);
        this.categories.add(tool.category);
    }
    /**
     * Unregister tool
     */
    unregister(name) {
        const tool = this.tools.get(name);
        if (!tool)
            return false;
        this.tools.delete(name);
        // Update category set
        const remainingInCategory = Array.from(this.tools.values())
            .some(t => t.category === tool.category);
        if (!remainingInCategory) {
            this.categories.delete(tool.category);
        }
        return true;
    }
    /**
     * Get tool by name
     */
    get(name) {
        return this.tools.get(name);
    }
    /**
     * Search tools by query
     */
    search(query, maxResults = 10) {
        const queryLower = query.toLowerCase();
        const results = [];
        for (const tool of this.tools.values()) {
            const score = this.calculateScore(tool, queryLower);
            if (score > 0) {
                const matchedOn = this.getMatchedOn(tool, queryLower);
                results.push({
                    tool,
                    score,
                    matchedOn
                });
            }
        }
        // Sort by score (descending)
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, maxResults);
    }
    /**
     * Calculate relevance score
     */
    calculateScore(tool, query) {
        let score = 0;
        // Exact name match
        if (tool.name.toLowerCase() === query) {
            score += 100;
        }
        // Name contains query
        if (tool.name.toLowerCase().includes(query)) {
            score += 50;
        }
        // Alias match
        for (const alias of tool.aliases) {
            if (alias.toLowerCase() === query) {
                score += 80;
            }
            if (alias.toLowerCase().includes(query)) {
                score += 30;
            }
        }
        // Description contains query
        if (tool.description.toLowerCase().includes(query)) {
            score += 20;
        }
        // Category match
        if (tool.category.toLowerCase().includes(query)) {
            score += 10;
        }
        // Boost by usage
        score += Math.min(10, tool.usageCount * 0.5);
        return score;
    }
    /**
     * Get matched attributes
     */
    getMatchedOn(tool, query) {
        const matched = [];
        if (tool.name.toLowerCase().includes(query))
            matched.push('name');
        if (tool.aliases.some(a => a.toLowerCase().includes(query)))
            matched.push('alias');
        if (tool.description.toLowerCase().includes(query))
            matched.push('description');
        if (tool.category.toLowerCase().includes(query))
            matched.push('category');
        return matched;
    }
    /**
     * Get tools by category
     */
    getByCategory(category) {
        return Array.from(this.tools.values())
            .filter(t => t.category === category);
    }
    /**
     * Get all categories
     */
    getCategories() {
        return Array.from(this.categories);
    }
    /**
     * Update usage count
     */
    updateUsage(name) {
        const tool = this.tools.get(name);
        if (tool) {
            tool.usageCount++;
            tool.lastUsed = Date.now();
        }
    }
    /**
     * Get most used tools
     */
    getMostUsed(count) {
        return Array.from(this.tools.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, count);
    }
    /**
     * Get recently used tools
     */
    getRecentlyUsed(count) {
        return Array.from(this.tools.values())
            .sort((a, b) => b.lastUsed - a.lastUsed)
            .slice(0, count);
    }
    /**
     * Get stats
     */
    getStats() {
        const tools = Array.from(this.tools.values());
        const totalUsage = tools.reduce((sum, t) => sum + t.usageCount, 0);
        return {
            totalTools: tools.length,
            totalCategories: this.categories.size,
            totalUsage
        };
    }
    /**
     * Clear all tools
     */
    clear() {
        this.tools.clear();
        this.categories.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const toolSearchUtils = new ToolSearchUtils();
export default toolSearchUtils;
//# sourceMappingURL=tool-search-utils.js.map