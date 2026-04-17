// @ts-nocheck
class BashTool {
    executions = [];
    executionCounter = 0;
    timeout = 30000;
    allowedCommands = [];
    /**
     * Execute command
     */
    async execute(command, cwd) {
        const id = `bash-${++this.executionCounter}-${Date.now()}`;
        const startTime = Date.now();
        // Would execute actual shell command
        // For demo, simulate
        const execution = {
            id,
            command,
            cwd: cwd ?? process.cwd(),
            exitCode: 0,
            stdout: `Simulated output for: ${command}`,
            stderr: '',
            durationMs: Date.now() - startTime,
            timestamp: Date.now()
        };
        this.executions.push(execution);
        return execution;
    }
    /**
     * Execute with timeout
     */
    async executeWithTimeout(command, timeoutMs, cwd) {
        this.timeout = timeoutMs;
        return this.execute(command, cwd);
    }
    /**
     * Allow command
     */
    allow(command) {
        this.allowedCommands.push(command);
    }
    /**
     * Check allowed
     */
    isAllowed(command) {
        if (this.allowedCommands.length === 0)
            return true;
        return this.allowedCommands.some(allowed => command.startsWith(allowed));
    }
    /**
     * Get execution
     */
    getExecution(id) {
        return this.executions.find(e => e.id === id);
    }
    /**
     * Get recent executions
     */
    getRecent(count = 10) {
        return this.executions.slice(-count);
    }
    /**
     * Get failed executions
     */
    getFailed() {
        return this.executions.filter(e => e.exitCode !== 0);
    }
    /**
     * Get successful executions
     */
    getSuccessful() {
        return this.executions.filter(e => e.exitCode === 0);
    }
    /**
     * Get by command
     */
    getByCommand(command) {
        return this.executions.filter(e => e.command === command);
    }
    /**
     * Set timeout
     */
    setTimeout(ms) {
        this.timeout = ms;
    }
    /**
     * Get timeout
     */
    getTimeout() {
        return this.timeout;
    }
    /**
     * Get stats
     */
    getStats() {
        const successful = this.getSuccessful();
        const failed = this.getFailed();
        const avgDuration = this.executions.length > 0
            ? this.executions.reduce((sum, e) => sum + e.durationMs, 0) / this.executions.length
            : 0;
        return {
            executionsCount: this.executions.length,
            successfulCount: successful.length,
            failedCount: failed.length,
            averageDurationMs: avgDuration,
            successRate: this.executions.length > 0 ? successful.length / this.executions.length : 0
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.executions = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
        this.executionCounter = 0;
        this.timeout = 30000;
        this.allowedCommands = [];
    }
}
// Global singleton
export const bashTool = new BashTool();
export default bashTool;
//# sourceMappingURL=bash-tool.js.map