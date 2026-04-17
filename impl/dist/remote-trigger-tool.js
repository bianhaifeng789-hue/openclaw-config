// @ts-nocheck
class RemoteTriggerTool {
    triggers = [];
    triggerCounter = 0;
    /**
     * Trigger remote
     */
    trigger(target, action, payload) {
        const id = `trigger-${++this.triggerCounter}-${Date.now()}`;
        // Would send to remote agent
        // For demo, simulate
        const response = { target, action, status: 'triggered' };
        const trigger = {
            id,
            target,
            action,
            payload,
            success: true,
            response,
            timestamp: Date.now()
        };
        this.triggers.push(trigger);
        return trigger;
    }
    /**
     * Trigger agent
     */
    triggerAgent(agentId, action, payload) {
        return this.trigger(`agent:${agentId}`, action, payload);
    }
    /**
     * Trigger swarm
     */
    triggerSwarm(swarmId, action, payload) {
        return this.trigger(`swarm:${swarmId}`, action, payload);
    }
    /**
     * Trigger teammate
     */
    triggerTeammate(teammateId, action, payload) {
        return this.trigger(`teammate:${teammateId}`, action, payload);
    }
    /**
     * Get trigger
     */
    getTrigger(id) {
        return this.triggers.find(t => t.id === id);
    }
    /**
     * Get triggers by target
     */
    getByTarget(target) {
        return this.triggers.filter(t => t.target === target);
    }
    /**
     * Get recent triggers
     */
    getRecent(count = 10) {
        return this.triggers.slice(-count);
    }
    /**
     * Get failed triggers
     */
    getFailed() {
        return this.triggers.filter(t => !t.success);
    }
    /**
     * Get stats
     */
    getStats() {
        const successful = this.triggers.filter(t => t.success);
        const byTarget = {};
        for (const trigger of this.triggers) {
            byTarget[trigger.target] = (byTarget[trigger.target] ?? 0) + 1;
        }
        return {
            triggersCount: this.triggers.length,
            successfulCount: successful.length,
            failedCount: this.triggers.filter(t => !t.success).length,
            byTarget
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.triggers = [];
        this.triggerCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const remoteTriggerTool = new RemoteTriggerTool();
export default remoteTriggerTool;
//# sourceMappingURL=remote-trigger-tool.js.map