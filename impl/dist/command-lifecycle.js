// @ts-nocheck
class CommandLifecycle {
    commands = new Map();
    executions = new Map();
    executionCounter = 0;
    /**
     * Register command
     */
    register(id, name, description, handler, aliases, category) {
        const cmd = {
            id,
            name,
            description,
            handler,
            aliases: aliases ?? [],
            category: category ?? 'general',
            enabled: true
        };
        this.commands.set(id, cmd);
        // Register aliases
        for (const alias of cmd.aliases) {
            this.commands.set(alias, cmd);
        }
        return cmd;
    }
    /**
     * Unregister command
     */
    unregister(id) {
        const cmd = this.commands.get(id);
        if (!cmd)
            return false;
        this.commands.delete(id);
        // Remove aliases
        for (const alias of cmd.aliases) {
            this.commands.delete(alias);
        }
        return true;
    }
    /**
     * Get command
     */
    get(idOrName) {
        return this.commands.get(idOrName);
    }
    /**
     * Execute command
     */
    async execute(idOrName, ...args) {
        const cmd = this.commands.get(idOrName);
        const executionId = `exec-${++this.executionCounter}-${Date.now()}`;
        const execution = {
            id: executionId,
            commandId: idOrName,
            args,
            startTime: Date.now(),
            endTime: null,
            success: null
        };
        this.executions.set(executionId, execution);
        if (!cmd || !cmd.enabled) {
            execution.endTime = Date.now();
            execution.success = false;
            execution.error = 'Command not found or disabled';
            return execution;
        }
        try {
            await cmd.handler(...args);
            execution.endTime = Date.now();
            execution.success = true;
        }
        catch (e) {
            execution.endTime = Date.now();
            execution.success = false;
            execution.error = String(e);
        }
        return execution;
    }
    /**
     * Enable command
     */
    enable(id) {
        const cmd = this.commands.get(id);
        if (!cmd)
            return false;
        cmd.enabled = true;
        return true;
    }
    /**
     * Disable command
     */
    disable(id) {
        const cmd = this.commands.get(id);
        if (!cmd)
            return false;
        cmd.enabled = false;
        return true;
    }
    /**
     * Get commands by category
     */
    getByCategory(category) {
        return Array.from(this.commands.values())
            .filter(c => c.category === category);
    }
    /**
     * Get all commands
     */
    getAll() {
        return Array.from(this.commands.values())
            .filter(c => c.id === c.name); // Only primary, not aliases
    }
    /**
     * Get execution
     */
    getExecution(id) {
        return this.executions.get(id);
    }
    /**
     * Get recent executions
     */
    getRecentExecutions(count = 10) {
        return Array.from(this.executions.values())
            .sort((a, b) => b.startTime - a.startTime)
            .slice(0, count);
    }
    /**
     * Get stats
     */
    getStats() {
        const commands = Array.from(this.commands.values())
            .filter(c => c.id === c.name);
        const executions = Array.from(this.executions.values());
        const completed = executions.filter(e => e.endTime !== null);
        const successful = completed.filter(e => e.success === true);
        const avgDuration = completed.length > 0
            ? completed.reduce((sum, e) => sum + (e.endTime - e.startTime), 0) / completed.length
            : 0;
        return {
            commandsCount: commands.length,
            enabledCount: commands.filter(c => c.enabled).length,
            executionsCount: executions.length,
            successRate: completed.length > 0 ? successful.length / completed.length : 0,
            averageDurationMs: avgDuration
        };
    }
    /**
     * Clear executions
     */
    clearExecutions() {
        this.executions.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.commands.clear();
        this.executions.clear();
        this.executionCounter = 0;
    }
}
// Global singleton
export const commandLifecycle = new CommandLifecycle();
export default commandLifecycle;
//# sourceMappingURL=command-lifecycle.js.map