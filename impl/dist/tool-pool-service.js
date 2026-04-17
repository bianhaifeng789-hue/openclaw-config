// @ts-nocheck
class ToolPoolService {
    pool = new Map();
    categories = new Map();
    /**
     * Register tool
     */
    register(name, category, priority) {
        const tool = {
            name,
            category,
            enabled: true,
            priority: priority ?? 0,
            loadedAt: Date.now()
        };
        this.pool.set(name, tool);
        const categoryTools = this.categories.get(category) ?? [];
        categoryTools.push(name);
        this.categories.set(category, categoryTools);
        return tool;
    }
    /**
     * Get tool
     */
    getTool(name) {
        return this.pool.get(name);
    }
    /**
     * Get tools by category
     */
    getByCategory(category) {
        const toolNames = this.categories.get(category) ?? [];
        return toolNames
            .map(name => this.pool.get(name))
            .filter(t => t !== undefined);
    }
    /**
     * Get enabled tools
     */
    getEnabled() {
        return Array.from(this.pool.values())
            .filter(t => t.enabled)
            .sort((a, b) => b.priority - a.priority);
    }
    /**
     * Get all tools
     */
    getAll() {
        return Array.from(this.pool.values())
            .sort((a, b) => b.priority - a.priority);
    }
    /**
     * Enable tool
     */
    enable(name) {
        const tool = this.pool.get(name);
        if (!tool)
            return false;
        tool.enabled = true;
        return true;
    }
    /**
     * Disable tool
     */
    disable(name) {
        const tool = this.pool.get(name);
        if (!tool)
            return false;
        tool.enabled = false;
        return true;
    }
    /**
     * Unregister tool
     */
    unregister(name) {
        const tool = this.pool.get(name);
        if (!tool)
            return false;
        this.pool.delete(name);
        const categoryTools = this.categories.get(tool.category);
        if (categoryTools) {
            const index = categoryTools.indexOf(name);
            if (index !== -1)
                categoryTools.splice(index, 1);
        }
        return true;
    }
    /**
     * Get stats
     */
    getStats() {
        const tools = Array.from(this.pool.values());
        const byCategory = {};
        for (const [category, names] of this.categories) {
            byCategory[category] = names.length;
        }
        return {
            poolCount: tools.length,
            enabledCount: tools.filter(t => t.enabled).length,
            disabledCount: tools.filter(t => !t.enabled).length,
            categoriesCount: this.categories.size,
            byCategory
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.pool.clear();
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
export const toolPoolService = new ToolPoolService();
export default toolPoolService;
//# sourceMappingURL=tool-pool-service.js.map