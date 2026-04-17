// @ts-nocheck
class SkillTool {
    skills = new Map();
    executions = [];
    skillCounter = 0;
    /**
     * Load skill
     */
    load(name, path, description, category) {
        const id = `skill-${++this.skillCounter}-${Date.now()}`;
        const skill = {
            id,
            name,
            description: description ?? '',
            path,
            category: category ?? 'general',
            enabled: true,
            loadedAt: Date.now()
        };
        this.skills.set(id, skill);
        return skill;
    }
    /**
     * Unload skill
     */
    unload(id) {
        return this.skills.delete(id);
    }
    /**
     * Execute skill
     */
    async execute(skillId, input) {
        const skill = this.skills.get(skillId);
        const startTime = Date.now();
        const execution = {
            skillId,
            input,
            output: '',
            success: false,
            durationMs: 0,
            timestamp: Date.now()
        };
        if (!skill || !skill.enabled) {
            execution.output = 'Skill not found or disabled';
            this.executions.push(execution);
            return execution;
        }
        // Would execute actual skill
        // For demo, simulate
        execution.output = `Executed skill ${skill.name} with input: ${input.slice(0, 50)}`;
        execution.success = true;
        execution.durationMs = Date.now() - startTime;
        this.executions.push(execution);
        return execution;
    }
    /**
     * Get skill
     */
    getSkill(id) {
        return this.skills.get(id);
    }
    /**
     * Get skill by name
     */
    getByName(name) {
        return Array.from(this.skills.values())
            .find(s => s.name === name);
    }
    /**
     * Get skills by category
     */
    getByCategory(category) {
        return Array.from(this.skills.values())
            .filter(s => s.category === category);
    }
    /**
     * Get enabled skills
     */
    getEnabled() {
        return Array.from(this.skills.values())
            .filter(s => s.enabled);
    }
    /**
     * Enable skill
     */
    enable(id) {
        const skill = this.skills.get(id);
        if (!skill)
            return false;
        skill.enabled = true;
        return true;
    }
    /**
     * Disable skill
     */
    disable(id) {
        const skill = this.skills.get(id);
        if (!skill)
            return false;
        skill.enabled = false;
        return true;
    }
    /**
     * Get execution history
     */
    getHistory() {
        return [...this.executions];
    }
    /**
     * Get recent executions
     */
    getRecentExecutions(count = 10) {
        return this.executions.slice(-count);
    }
    /**
     * Get executions by skill
     */
    getExecutionsBySkill(skillId) {
        return this.executions.filter(e => e.skillId === skillId);
    }
    /**
     * Get stats
     */
    getStats() {
        const skills = Array.from(this.skills.values());
        const executions = this.executions;
        const successful = executions.filter(e => e.success);
        const avgDuration = executions.length > 0
            ? executions.reduce((sum, e) => sum + e.durationMs, 0) / executions.length
            : 0;
        return {
            skillsCount: skills.length,
            enabledCount: skills.filter(s => s.enabled).length,
            executionsCount: executions.length,
            successRate: executions.length > 0 ? successful.length / executions.length : 0,
            averageDurationMs: avgDuration
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.skills.clear();
        this.executions = [];
        this.skillCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const skillTool = new SkillTool();
export default skillTool;
//# sourceMappingURL=skill-tool.js.map