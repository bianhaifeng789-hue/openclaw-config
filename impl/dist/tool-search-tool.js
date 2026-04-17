// @ts-nocheck
class ToolSearchTool {
    tools = new Map();
    searchHistory = [];
    /**
     * Register tool
     */
    register(id, name, description, category) {
        const tool = {
            id,
            name,
            description,
            category,
            enabled: true
        };
        this.tools.set(id, tool);
        return tool;
    }
    /**
     * Search tools
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        const results = Array.from(this.tools.values())
            .filter(t => t.enabled &&
            (t.name.toLowerCase().includes(lowerQuery) ||
                t.description.toLowerCase().includes(lowerQuery) ||
                t.category.toLowerCase().includes(lowerQuery)));
        this.searchHistory.push({ query, results });
        return results;
    }
    /**
     * Get tool by ID
     */
    getById(id) {
        return this.tools.get(id);
    }
    /**
     * Get tool by name
     */
    getByName(name) {
        return Array.from(this.tools.values())
            .find(t => t.name === name);
    }
    /**
     * Get tools by category
     */
    getByCategory(category) {
        return Array.from(this.tools.values())
            .filter(t => t.category === category && t.enabled);
    }
    /**
     * Get all tools
     */
    getAll() {
        return Array.from(this.tools.values())
            .filter(t => t.enabled);
    }
    /**
     * Enable tool
     */
    enable(id) {
        const tool = this.tools.get(id);
        if (!tool)
            return false;
        tool.enabled = true;
        return true;
    }
    /**
     * Disable tool
     */
    disable(id) {
        const tool = this.tools.get(id);
        if (!tool)
            return false;
        tool.enabled = false;
        return true;
    }
    /**
     * Get search history
     */
    getSearchHistory() {
        return [...this.searchHistory];
    }
    /**
     * Get stats
     */
    getStats() {
        const tools = Array.from(this.tools.values());
        const byCategory = {};
        for (const tool of tools) {
            if (tool.enabled) {
                byCategory[tool.category] = (byCategory[tool.category] ?? 0) + 1;
            }
        }
        return {
            toolsCount: tools.length,
            enabledCount: tools.filter(t => t.enabled).length,
            byCategory,
            searchesCount: this.searchHistory.length
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.tools.clear();
        this.searchHistory = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const toolSearchTool = new ToolSearchTool();
export default toolSearchTool;
//# sourceMappingURL=tool-search-tool.js.map