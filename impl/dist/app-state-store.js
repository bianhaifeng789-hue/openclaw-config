// @ts-nocheck
class AppStateStore {
    state = {
        sessionId: null,
        modelId: null,
        projectPath: null,
        status: 'idle',
        messages: [],
        tools: [],
        config: {}
    };
    subscriptions = new Map();
    subscriptionCounter = 0;
    /**
     * Get state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Update state
     */
    update(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        // Notify subscribers
        for (const sub of this.subscriptions.values()) {
            const prevValue = sub.selector(prevState);
            const newValue = sub.selector(this.state);
            if (prevValue !== newValue) {
                sub.callback(newValue);
            }
        }
    }
    /**
     * Subscribe
     */
    subscribe(selector, callback) {
        const id = `sub-${++this.subscriptionCounter}`;
        this.subscriptions.set(id, {
            id,
            selector,
            callback
        });
        return id;
    }
    /**
     * Unsubscribe
     */
    unsubscribe(id) {
        return this.subscriptions.delete(id);
    }
    /**
     * Select value
     */
    select(selector) {
        return selector(this.state);
    }
    /**
     * Get session ID
     */
    getSessionId() {
        return this.state.sessionId;
    }
    /**
     * Get model ID
     */
    getModelId() {
        return this.state.modelId;
    }
    /**
     * Get status
     */
    getStatus() {
        return this.state.status;
    }
    /**
     * Add message
     */
    addMessage(role, content) {
        const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        this.state.messages.push({ id, role, content });
        this.update({ messages: this.state.messages });
        return id;
    }
    /**
     * Clear messages
     */
    clearMessages() {
        this.update({ messages: [] });
    }
    /**
     * Add tool
     */
    addTool(name, status) {
        const id = `tool-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        this.state.tools.push({ id, name, status });
        this.update({ tools: this.state.tools });
        return id;
    }
    /**
     * Update tool status
     */
    updateToolStatus(toolId, status) {
        const tool = this.state.tools.find(t => t.id === toolId);
        if (!tool)
            return false;
        tool.status = status;
        this.update({ tools: this.state.tools });
        return true;
    }
    /**
     * Set config
     */
    setConfig(key, value) {
        this.state.config[key] = value;
        this.update({ config: this.state.config });
    }
    /**
     * Get config
     */
    getConfig(key) {
        return this.state.config[key];
    }
    /**
     * Reset state
     */
    reset() {
        this.state = {
            sessionId: null,
            modelId: null,
            projectPath: null,
            status: 'idle',
            messages: [],
            tools: [],
            config: {}
        };
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            subscriptionsCount: this.subscriptions.size,
            messagesCount: this.state.messages.length,
            toolsCount: this.state.tools.length,
            configKeys: Object.keys(this.state.config).length
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.reset();
        this.subscriptions.clear();
        this.subscriptionCounter = 0;
    }
}
// Global singleton
export const appStateStore = new AppStateStore();
export default appStateStore;
//# sourceMappingURL=app-state-store.js.map