// @ts-nocheck
class AgentTool {
    agents = new Map();
    agentCounter = 0;
    activeAgents = [];
    /**
     * Spawn agent
     */
    spawn(name, task) {
        const id = `agent-${++this.agentCounter}-${Date.now()}`;
        const agent = {
            id,
            name,
            status: 'active',
            task,
            createdAt: Date.now()
        };
        this.agents.set(id, agent);
        this.activeAgents.push(id);
        return agent;
    }
    /**
     * Get agent
     */
    getAgent(id) {
        return this.agents.get(id);
    }
    /**
     * Complete agent
     */
    complete(id, result) {
        const agent = this.agents.get(id);
        if (!agent || agent.status !== 'active')
            return false;
        agent.status = 'completed';
        agent.result = result ?? '';
        agent.completedAt = Date.now();
        const index = this.activeAgents.indexOf(id);
        if (index !== -1)
            this.activeAgents.splice(index, 1);
        return true;
    }
    /**
     * Fail agent
     */
    fail(id, reason) {
        const agent = this.agents.get(id);
        if (!agent || agent.status !== 'active')
            return false;
        agent.status = 'failed';
        agent.result = reason ?? '';
        agent.completedAt = Date.now();
        const index = this.activeAgents.indexOf(id);
        if (index !== -1)
            this.activeAgents.splice(index, 1);
        return true;
    }
    /**
     * Stop agent
     */
    stop(id) {
        return this.fail(id, 'Stopped by user');
    }
    /**
     * Get active agents
     */
    getActive() {
        return this.activeAgents
            .map(id => this.agents.get(id))
            .filter(a => a !== undefined);
    }
    /**
     * Get completed agents
     */
    getCompleted() {
        return Array.from(this.agents.values())
            .filter(a => a.status === 'completed');
    }
    /**
     * Get failed agents
     */
    getFailed() {
        return Array.from(this.agents.values())
            .filter(a => a.status === 'failed');
    }
    /**
     * Get all agents
     */
    getAll() {
        return Array.from(this.agents.values());
    }
    /**
     * Get stats
     */
    getStats() {
        const agents = Array.from(this.agents.values());
        const completed = agents.filter(a => a.status === 'completed');
        const failed = agents.filter(a => a.status === 'failed');
        return {
            agentsCount: agents.length,
            activeCount: this.activeAgents.length,
            completedCount: completed.length,
            failedCount: failed.length,
            successRate: (completed.length + failed.length) > 0 ? completed.length / (completed.length + failed.length) : 0
        };
    }
    /**
     * Clear completed
     */
    clearCompleted() {
        const completed = this.getCompleted();
        const failed = this.getFailed();
        for (const agent of completed) {
            this.agents.delete(agent.id);
        }
        for (const agent of failed) {
            this.agents.delete(agent.id);
        }
        return completed.length + failed.length;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.agents.clear();
        this.activeAgents = [];
        this.agentCounter = 0;
    }
}
// Global singleton
export const agentTool = new AgentTool();
export default agentTool;
//# sourceMappingURL=agent-tool.js.map