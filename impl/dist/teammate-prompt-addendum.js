// @ts-nocheck
class TeammatePromptAddendum {
    addenda = new Map();
    sessionAddenda = new Map();
    /**
     * Register addendum
     */
    register(id, type, content, priority) {
        const addendum = {
            id,
            type,
            content,
            priority: priority ?? 0,
            enabled: true
        };
        this.addenda.set(id, addendum);
        return addendum;
    }
    /**
     * Add to session
     */
    addToSession(sessionId, addendumId) {
        const addendum = this.addenda.get(addendumId);
        if (!addendum)
            return false;
        const list = this.sessionAddenda.get(sessionId) ?? [];
        if (!list.includes(addendumId)) {
            list.push(addendumId);
        }
        this.sessionAddenda.set(sessionId, list);
        return true;
    }
    /**
     * Remove from session
     */
    removeFromSession(sessionId, addendumId) {
        const list = this.sessionAddenda.get(sessionId);
        if (!list)
            return false;
        const index = list.indexOf(addendumId);
        if (index === -1)
            return false;
        list.splice(index, 1);
        return true;
    }
    /**
     * Build addenda for session
     */
    build(sessionId) {
        const list = this.sessionAddenda.get(sessionId) ?? [];
        const addenda = list
            .map(id => this.addenda.get(id))
            .filter(a => a !== undefined && a.enabled);
        // Sort by priority
        addenda.sort((a, b) => b.priority - a.priority);
        const combinedContent = addenda.map(a => a.content).join('\n\n');
        return {
            sessionId,
            addenda,
            combinedContent,
            totalLength: combinedContent.length
        };
    }
    /**
     * Get addendum
     */
    getAddendum(id) {
        return this.addenda.get(id);
    }
    /**
     * Enable addendum
     */
    enable(id) {
        const addendum = this.addenda.get(id);
        if (!addendum)
            return false;
        addendum.enabled = true;
        return true;
    }
    /**
     * Disable addendum
     */
    disable(id) {
        const addendum = this.addenda.get(id);
        if (!addendum)
            return false;
        addendum.enabled = false;
        return true;
    }
    /**
     * Update content
     */
    updateContent(id, content) {
        const addendum = this.addenda.get(id);
        if (!addendum)
            return false;
        addendum.content = content;
        return true;
    }
    /**
     * Get by type
     */
    getByType(type) {
        return Array.from(this.addenda.values())
            .filter(a => a.type === type);
    }
    /**
     * Get session addenda
     */
    getSessionAddenda(sessionId) {
        const list = this.sessionAddenda.get(sessionId) ?? [];
        return list.map(id => this.addenda.get(id)).filter(a => a !== undefined);
    }
    /**
     * Get stats
     */
    getStats() {
        const addenda = Array.from(this.addenda.values());
        const byType = {
            context: 0, instruction: 0, constraint: 0, capability: 0
        };
        for (const a of addenda)
            byType[a.type]++;
        return {
            addendaCount: addenda.length,
            enabledCount: addenda.filter(a => a.enabled).length,
            sessionCount: this.sessionAddenda.size,
            byType
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.addenda.clear();
        this.sessionAddenda.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const teammatePromptAddendum = new TeammatePromptAddendum();
export default teammatePromptAddendum;
//# sourceMappingURL=teammate-prompt-addendum.js.map