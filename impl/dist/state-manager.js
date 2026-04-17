// @ts-nocheck
class StateManager {
    states = new Map();
    transitions = new Map();
    stateCounter = 0;
    /**
     * Define allowed transitions
     */
    defineTransitions(stateId, transitions) {
        this.transitions.set(stateId, transitions);
    }
    /**
     * Create state
     */
    create(initialState, metadata) {
        const id = `state-${++this.stateCounter}-${Date.now()}`;
        const state = {
            id,
            current: initialState,
            history: [],
            metadata: metadata ?? {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.states.set(id, state);
        return state;
    }
    /**
     * Transition state
     */
    transition(stateId, action) {
        const state = this.states.get(stateId);
        if (!state)
            return false;
        const allowed = this.transitions.get(stateId) ?? [];
        const transition = allowed.find(t => t.from === state.current && t.action === action);
        if (!transition)
            return false;
        const record = {
            from: state.current,
            to: transition.to,
            action,
            timestamp: Date.now()
        };
        state.history.push(record);
        state.current = transition.to;
        state.updatedAt = Date.now();
        return true;
    }
    /**
     * Force state
     */
    force(stateId, newState) {
        const state = this.states.get(stateId);
        if (!state)
            return false;
        state.current = newState;
        state.updatedAt = Date.now();
        return true;
    }
    /**
     * Get state
     */
    getState(stateId) {
        return this.states.get(stateId);
    }
    /**
     * Get current
     */
    getCurrent(stateId) {
        const state = this.states.get(stateId);
        return state?.current ?? null;
    }
    /**
     * Get history
     */
    getHistory(stateId) {
        const state = this.states.get(stateId);
        return state?.history ?? [];
    }
    /**
     * Can transition
     */
    canTransition(stateId, action) {
        const state = this.states.get(stateId);
        if (!state)
            return false;
        const allowed = this.transitions.get(stateId) ?? [];
        return allowed.some(t => t.from === state.current && t.action === action);
    }
    /**
     * Get allowed actions
     */
    getAllowedActions(stateId) {
        const state = this.states.get(stateId);
        if (!state)
            return [];
        const allowed = this.transitions.get(stateId) ?? [];
        return allowed.filter(t => t.from === state.current).map(t => t.action);
    }
    /**
     * Delete state
     */
    deleteState(stateId) {
        return this.states.delete(stateId);
    }
    /**
     * Get stats
     */
    getStats() {
        const states = Array.from(this.states.values());
        const avgHistory = states.length > 0
            ? states.reduce((sum, s) => sum + s.history.length, 0) / states.length
            : 0;
        return {
            statesCount: states.length,
            transitionsCount: this.transitions.size,
            averageHistoryLength: avgHistory
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.states.clear();
        this.transitions.clear();
        this.stateCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const stateManager = new StateManager();
export default stateManager;
//# sourceMappingURL=state-manager.js.map