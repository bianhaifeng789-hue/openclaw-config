// @ts-nocheck
class SkillToolService {
    executions = [];
    executionCounter = 0;
    loadedSkills = new Map();
    /**
     * Load skill
     */
    load(skillId, skillName) {
        this.loadedSkills.set(skillId, {
            name: skillName,
            loadedAt: Date.now()
        });
        return true;
    }
    /**
     * Execute skill
     */
    execute(skillId, input) {
        const id = `skill-${++this.executionCounter}-${Date.now()}`;
        const startTime = Date.now();
        const skill = this.loadedSkills.get(skillId);
        const execution = {
            id,
            skillId,
            skillName: skill?.name ?? 'unknown',
            input,
            output: { skillId, input, simulated: true },
            durationMs: Date.now() - startTime,
            timestamp: Date.now()
        };
        this.executions.push(execution);
        return execution;
    }
    /**
     * Unload skill
     */
    unload(skillId) {
        return this.loadedSkills.delete(skillId);
    }
    /**
     * Get execution
     */
    getExecution(id) {
        return this.executions.find(e => e.id === id);
    }
    /**
     * Get executions by skill
     */
    getBySkill(skillId) {
        return this.executions.filter(e => e.skillId === skillId);
    }
    /**
     * Get loaded skills
     */
    getLoaded() {
        return Array.from(this.loadedSkills.entries())
            .map(([skillId, data]) => ({ skillId, ...data }));
    }
    /**
     * Get recent executions
     */
    getRecent(count = 10) {
        return this.executions.slice(-count);
    }
    /**
     * Get stats
     */
    getStats() {
        const avgDuration = this.executions.length > 0
            ? this.executions.reduce((sum, e) => sum + e.durationMs, 0) / this.executions.length
            : 0;
        const bySkill = {};
        for (const execution of this.executions) {
            bySkill[execution.skillId] = (bySkill[execution.skillId] ?? 0) + 1;
        }
        return {
            executionsCount: this.executions.length,
            loadedSkillsCount: this.loadedSkills.size,
            averageDurationMs: avgDuration,
            bySkill
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.executions = [];
        this.loadedSkills.clear();
        this.executionCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const skillToolService = new SkillToolService();
export default skillToolService;
//# sourceMappingURL=skill-tool-service.js.map