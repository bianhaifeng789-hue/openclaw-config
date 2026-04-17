// @ts-nocheck
class CoordinatorModeService {
    state = {
        mode: 'single',
        agents: [],
        tasks: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    /**
     * Set mode
     */
    setMode(mode) {
        this.state.mode = mode;
        this.state.updatedAt = Date.now();
    }
    /**
     * Get mode
     */
    getMode() {
        return this.state.mode;
    }
    /**
     * Is single mode
     */
    isSingle() {
        return this.state.mode === 'single';
    }
    /**
     * Is multi mode
     */
    isMulti() {
        return this.state.mode === 'multi';
    }
    /**
     * Is swarm mode
     */
    isSwarm() {
        return this.state.mode === 'swarm';
    }
    /**
     * Add agent
     */
    addAgent(id, role) {
        this.state.agents.push({
            id,
            role,
            status: 'idle'
        });
        this.state.updatedAt = Date.now();
    }
    /**
     * Remove agent
     */
    removeAgent(id) {
        const index = this.state.agents.findIndex(a => a.id === id);
        if (index === -1)
            return false;
        this.state.agents.splice(index, 1);
        this.state.updatedAt = Date.now();
        return true;
    }
    /**
     * Update agent status
     */
    updateAgentStatus(id, status) {
        const agent = this.state.agents.find(a => a.id === id);
        if (!agent)
            return false;
        agent.status = status;
        this.state.updatedAt = Date.now();
        return true;
    }
    /**
     * Add task
     */
    addTask(id, assignee) {
        this.state.tasks.push({
            id,
            assignee,
            status: 'pending'
        });
        this.state.updatedAt = Date.now();
    }
    /**
     * Complete task
     */
    completeTask(id) {
        const task = this.state.tasks.find(t => t.id === id);
        if (!task)
            return false;
        task.status = 'completed';
        this.state.updatedAt = Date.now();
        return true;
    }
    /**
     * Get state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get agents
     */
    getAgents() {
        return [...this.state.agents];
    }
    /**
     * Get tasks
     */
    getTasks() {
        return [...this.state.tasks];
    }
    /**
     * Get active agents
     */
    getActiveAgents() {
        return this.state.agents.filter(a => a.status !== 'idle');
    }
    /**
     * Get pending tasks
     */
    getPendingTasks() {
        return this.state.tasks.filter(t => t.status === 'pending');
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            mode: this.state.mode,
            agentsCount: this.state.agents.length,
            activeAgentsCount: this.getActiveAgents().length,
            tasksCount: this.state.tasks.length,
            pendingTasksCount: this.getPendingTasks().length
        };
    }
    /**
     * Reset state
     */
    reset() {
        this.state = {
            mode: 'single',
            agents: [],
            tasks: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.reset();
    }
}
// Global singleton
export const coordinatorModeService = new CoordinatorModeService();
export default coordinatorModeService;
//# sourceMappingURL=coordinator-mode-service.js.map