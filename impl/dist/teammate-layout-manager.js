// @ts-nocheck
class TeammateLayoutManager {
    configs = new Map();
    states = new Map();
    /**
     * Create layout
     */
    createLayout(id, type, panels, mainPanel) {
        const config = {
            id,
            type,
            panels: panels.map((p, i) => ({ id: p, position: i, size: 100 / panels.length })),
            mainPanel
        };
        this.configs.set(id, config);
        return config;
    }
    /**
     * Apply layout
     */
    apply(sessionId, configId) {
        const config = this.configs.get(configId);
        if (!config)
            throw new Error('Config not found');
        const state = {
            sessionId,
            config,
            activePanel: config.mainPanel,
            visiblePanels: config.panels.map(p => p.id)
        };
        this.states.set(sessionId, state);
        return state;
    }
    /**
     * Get state
     */
    getState(sessionId) {
        return this.states.get(sessionId);
    }
    /**
     * Get config
     */
    getConfig(id) {
        return this.configs.get(id);
    }
    /**
     * Set active panel
     */
    setActive(sessionId, panelId) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        if (!state.visiblePanels.includes(panelId))
            return false;
        state.activePanel = panelId;
        return true;
    }
    /**
     * Show panel
     */
    showPanel(sessionId, panelId) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        if (!state.visiblePanels.includes(panelId)) {
            state.visiblePanels.push(panelId);
        }
        return true;
    }
    /**
     * Hide panel
     */
    hidePanel(sessionId, panelId) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        if (panelId === state.config.mainPanel)
            return false;
        state.visiblePanels = state.visiblePanels.filter(p => p !== panelId);
        return true;
    }
    /**
     * Resize panel
     */
    resize(sessionId, panelId, size) {
        const state = this.states.get(sessionId);
        if (!state)
            return false;
        const panel = state.config.panels.find(p => p.id === panelId);
        if (!panel)
            return false;
        panel.size = size;
        return true;
    }
    /**
     * Get visible panels
     */
    getVisible(sessionId) {
        const state = this.states.get(sessionId);
        return state?.visiblePanels ?? [];
    }
    /**
     * Get active panel
     */
    getActive(sessionId) {
        const state = this.states.get(sessionId);
        return state?.activePanel ?? null;
    }
    /**
     * Get stats
     */
    getStats() {
        const configs = Array.from(this.configs.values());
        const byType = {
            split: 0, tabs: 0, stack: 0, grid: 0
        };
        for (const c of configs)
            byType[c.type]++;
        return {
            configsCount: configs.length,
            statesCount: this.states.size,
            layoutsByType: byType
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.configs.clear();
        this.states.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const teammateLayoutManager = new TeammateLayoutManager();
export default teammateLayoutManager;
//# sourceMappingURL=teammate-layout-manager.js.map