// @ts-nocheck
class EnterPlanModeTool {
    states = [];
    stateCounter = 0;
    currentPlan = null;
    /**
     * Enter plan mode
     */
    enter(plan) {
        const id = `plan-${++this.stateCounter}-${Date.now()}`;
        const state = {
            id,
            active: true,
            plan,
            steps: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        this.states.push(state);
        this.currentPlan = state;
        return state;
    }
    /**
     * Add step
     */
    addStep(description) {
        if (!this.currentPlan)
            return false;
        this.currentPlan.steps.push({
            description,
            status: 'pending'
        });
        this.currentPlan.updatedAt = Date.now();
        return true;
    }
    /**
     * Complete step
     */
    completeStep(index) {
        if (!this.currentPlan)
            return false;
        const step = this.currentPlan.steps[index];
        if (!step)
            return false;
        step.status = 'completed';
        this.currentPlan.updatedAt = Date.now();
        return true;
    }
    /**
     * Get current plan
     */
    getCurrentPlan() {
        return this.currentPlan;
    }
    /**
     * Get plan
     */
    getPlan(id) {
        return this.states.find(s => s.id === id);
    }
    /**
     * Get all plans
     */
    getAllPlans() {
        return [...this.states];
    }
    /**
     * Get stats
     */
    getStats() {
        const active = this.states.filter(s => s.active);
        const totalSteps = this.states.reduce((sum, s) => sum + s.steps.length, 0);
        const completedSteps = this.states.reduce((sum, s) => sum + s.steps.filter(st => st.status === 'completed').length, 0);
        return {
            plansCount: this.states.length,
            activePlans: active.length,
            totalSteps: totalSteps,
            completedSteps: completedSteps
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.states = [];
        this.currentPlan = null;
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
export const enterPlanModeTool = new EnterPlanModeTool();
export default enterPlanModeTool;
//# sourceMappingURL=enter-plan-mode-tool.js.map