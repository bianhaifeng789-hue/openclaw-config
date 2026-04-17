// @ts-nocheck
class AgentContextManager {
    contexts = new Map();
    inheritances = [];
    contextCounter = 0;
    /**
     * Create context
     */
    createContext(workload, parentId, role) {
        const agentId = `agent-${++this.contextCounter}-${Date.now()}`;
        const context = {
            agentId,
            parentId,
            workload,
            role,
            capabilities: [],
            createdAt: Date.now()
        };
        // Inherit from parent
        if (parentId) {
            this.inherit(parentId, agentId);
        }
        this.contexts.set(agentId, context);
        return context;
    }
    /**
     * Inherit context
     */
    inherit(fromId, toId, fields) {
        const parent = this.contexts.get(fromId);
        const child = this.contexts.get(toId);
        if (!parent || !child)
            return;
        const inheritFields = fields ?? ['capabilities', 'role', 'metadata'];
        for (const field of inheritFields) {
            if (parent[field]) {
                child[field] = parent[field];
            }
        }
        child.parentId = fromId;
        this.inheritances.push({
            from: fromId,
            to: toId,
            inheritedAt: Date.now(),
            fields: inheritFields
        });
    }
    /**
     * Get context
     */
    getContext(agentId) {
        return this.contexts.get(agentId);
    }
    /**
     * Update context
     */
    updateContext(agentId, updates) {
        const context = this.contexts.get(agentId);
        if (!context)
            return null;
        Object.assign(context, updates);
        return context;
    }
    /**
     * Add capability
     */
    addCapability(agentId, capability) {
        const context = this.contexts.get(agentId);
        if (!context)
            return;
        if (!context.capabilities) {
            context.capabilities = [];
        }
        if (!context.capabilities.includes(capability)) {
            context.capabilities.push(capability);
        }
    }
    /**
     * Check capability
     */
    hasCapability(agentId, capability) {
        const context = this.contexts.get(agentId);
        return context?.capabilities?.includes(capability) ?? false;
    }
    /**
     * Get children
     */
    getChildren(parentId) {
        return Array.from(this.contexts.values())
            .filter(c => c.parentId === parentId);
    }
    /**
     * Get ancestry
     */
    getAncestry(agentId) {
        const ancestry = [];
        let current = this.contexts.get(agentId);
        while (current?.parentId) {
            const parent = this.contexts.get(current.parentId);
            if (parent)
                ancestry.push(parent);
            current = parent;
        }
        return ancestry;
    }
    /**
     * Get all contexts
     */
    getAllContexts() {
        return Array.from(this.contexts.values());
    }
    /**
     * Get stats
     */
    getStats() {
        const contexts = Array.from(this.contexts.values());
        const roots = contexts.filter(c => !c.parentId);
        const parents = new Set(contexts.filter(c => c.parentId).map(c => c.parentId));
        const leaves = contexts.filter(c => !parents.has(c.agentId));
        return {
            contextCount: this.contexts.size,
            inheritanceCount: this.inheritances.length,
            rootCount: roots.length,
            leafCount: leaves.length
        };
    }
    /**
     * Delete context
     */
    deleteContext(agentId) {
        return this.contexts.delete(agentId);
    }
    /**
     * Clear all
     */
    clear() {
        this.contexts.clear();
        this.inheritances = [];
        this.contextCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const agentContextManager = new AgentContextManager();
export default agentContextManager;
//# sourceMappingURL=agent-context-manager.js.map