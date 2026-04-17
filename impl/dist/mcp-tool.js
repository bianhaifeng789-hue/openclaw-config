// @ts-nocheck
class MCPTool {
    calls = [];
    callCounter = 0;
    /**
     * Call MCP tool
     */
    async call(serverId, toolName, args) {
        const id = `mcp-call-${++this.callCounter}-${Date.now()}`;
        // Would call actual MCP tool
        // For demo, simulate
        const result = { serverId, toolName, args, simulated: true };
        const call = {
            id,
            serverId,
            toolName,
            args,
            result,
            timestamp: Date.now()
        };
        this.calls.push(call);
        return call;
    }
    /**
     * Call with validation
     */
    async callWithValidation(serverId, toolName, args) {
        // Would validate args
        return this.call(serverId, toolName, args);
    }
    /**
     * Get call
     */
    getCall(id) {
        return this.calls.find(c => c.id === id);
    }
    /**
     * Get calls by server
     */
    getByServer(serverId) {
        return this.calls.filter(c => c.serverId === serverId);
    }
    /**
     * Get calls by tool
     */
    getByTool(toolName) {
        return this.calls.filter(c => c.toolName === toolName);
    }
    /**
     * Get recent calls
     */
    getRecent(count = 10) {
        return this.calls.slice(-count);
    }
    /**
     * Get failed calls
     */
    getFailed() {
        return this.calls.filter(c => c.error);
    }
    /**
     * Get stats
     */
    getStats() {
        const byServer = {};
        const byTool = {};
        for (const call of this.calls) {
            byServer[call.serverId] = (byServer[call.serverId] ?? 0) + 1;
            byTool[call.toolName] = (byTool[call.toolName] ?? 0) + 1;
        }
        return {
            callsCount: this.calls.length,
            successfulCount: this.calls.filter(c => !c.error).length,
            failedCount: this.calls.filter(c => c.error).length,
            byServer,
            byTool
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.calls = [];
        this.callCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const mcpTool = new MCPTool();
export default mcpTool;
//# sourceMappingURL=mcp-tool.js.map