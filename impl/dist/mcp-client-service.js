// @ts-nocheck
class MCPClientService {
    servers = new Map();
    toolCalls = [];
    serverCounter = 0;
    /**
     * Connect to server
     */
    async connect(name, transport, config) {
        const id = `mcp-${++this.serverCounter}-${Date.now()}`;
        // Would spawn/connect to MCP server
        // For demo, simulate
        const server = {
            id,
            name,
            transport,
            connected: true,
            tools: [
                { name: 'read_file', description: 'Read file contents' },
                { name: 'write_file', description: 'Write file contents' }
            ],
            resources: [
                { uri: 'file:///', name: 'File system' }
            ]
        };
        this.servers.set(id, server);
        return server;
    }
    /**
     * Disconnect server
     */
    async disconnect(serverId) {
        const server = this.servers.get(serverId);
        if (!server)
            return false;
        server.connected = false;
        return true;
    }
    /**
     * Get server
     */
    getServer(serverId) {
        return this.servers.get(serverId);
    }
    /**
     * Get connected servers
     */
    getConnectedServers() {
        return Array.from(this.servers.values())
            .filter(s => s.connected);
    }
    /**
     * List tools
     */
    listTools(serverId) {
        const server = this.servers.get(serverId);
        return server?.tools ?? [];
    }
    /**
     * List resources
     */
    listResources(serverId) {
        const server = this.servers.get(serverId);
        return server?.resources ?? [];
    }
    /**
     * Call tool
     */
    async callTool(serverId, toolName, args) {
        const call = {
            serverId,
            toolName,
            arguments: args,
            timestamp: Date.now()
        };
        // Would call actual tool
        // For demo, simulate
        const server = this.servers.get(serverId);
        if (!server || !server.connected) {
            call.error = 'Server not connected';
        }
        else if (!server.tools.some(t => t.name === toolName)) {
            call.error = 'Tool not found';
        }
        else {
            call.result = { success: true, simulated: true };
        }
        this.toolCalls.push(call);
        return call;
    }
    /**
     * Read resource
     */
    async readResource(serverId, uri) {
        const server = this.servers.get(serverId);
        if (!server || !server.connected)
            return null;
        // Would read actual resource
        // For demo, return mock
        return { uri, content: 'Resource content' };
    }
    /**
     * Get tool call history
     */
    getToolCallHistory(limit) {
        const calls = [...this.toolCalls].reverse();
        return limit ? calls.slice(0, limit) : calls;
    }
    /**
     * Get calls by server
     */
    getCallsByServer(serverId) {
        return this.toolCalls.filter(c => c.serverId === serverId);
    }
    /**
     * Get stats
     */
    getStats() {
        const servers = Array.from(this.servers.values());
        const calls = this.toolCalls;
        const successful = calls.filter(c => !c.error).length;
        return {
            serversCount: servers.length,
            connectedCount: servers.filter(s => s.connected).length,
            totalTools: servers.reduce((sum, s) => sum + s.tools.length, 0),
            totalResources: servers.reduce((sum, s) => sum + s.resources.length, 0),
            callsCount: calls.length,
            successRate: calls.length > 0 ? successful / calls.length : 0
        };
    }
    /**
     * Clear tool calls
     */
    clearToolCalls() {
        this.toolCalls = [];
    }
    /**
     * Clear all
     */
    clear() {
        this.servers.clear();
        this.toolCalls = [];
        this.serverCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const mcpClientService = new MCPClientService();
export default mcpClientService;
//# sourceMappingURL=mcp-client-service.js.map