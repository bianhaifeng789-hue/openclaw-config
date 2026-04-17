// @ts-nocheck
class MCPOutputStorage {
    outputs = new Map();
    outputsByServer = new Map();
    outputCounter = 0;
    maxOutputs = 100;
    /**
     * Store output
     */
    store(serverId, toolName, type, content, metadata) {
        const id = `output-${++this.outputCounter}-${Date.now()}`;
        const output = {
            id,
            serverId,
            toolName,
            type,
            content,
            metadata: metadata ?? {},
            storedAt: Date.now()
        };
        this.outputs.set(id, output);
        // Index by server
        const serverOutputs = this.outputsByServer.get(serverId) ?? [];
        serverOutputs.push(id);
        this.outputsByServer.set(serverId, serverOutputs);
        // Trim if over limit
        if (this.outputs.size > this.maxOutputs) {
            this.trimOld();
        }
        return output;
    }
    /**
     * Trim old outputs
     */
    trimOld() {
        const sorted = Array.from(this.outputs.entries())
            .sort((a, b) => b[1].storedAt - a[1].storedAt);
        // Remove oldest
        while (sorted.length > this.maxOutputs) {
            const [id, output] = sorted.pop();
            this.outputs.delete(id);
            const serverOutputs = this.outputsByServer.get(output.serverId);
            if (serverOutputs) {
                const index = serverOutputs.indexOf(id);
                if (index !== -1)
                    serverOutputs.splice(index, 1);
            }
        }
    }
    /**
     * Get output
     */
    getOutput(id) {
        return this.outputs.get(id);
    }
    /**
     * Get outputs by server
     */
    getByServer(serverId) {
        const ids = this.outputsByServer.get(serverId) ?? [];
        return ids.map(id => this.outputs.get(id)).filter(o => o !== undefined);
    }
    /**
     * Get outputs by tool
     */
    getByTool(toolName) {
        return Array.from(this.outputs.values())
            .filter(o => o.toolName === toolName);
    }
    /**
     * Get outputs by type
     */
    getByType(type) {
        return Array.from(this.outputs.values())
            .filter(o => o.type === type);
    }
    /**
     * Get recent outputs
     */
    getRecent(count = 10) {
        return Array.from(this.outputs.values())
            .sort((a, b) => b.storedAt - a.storedAt)
            .slice(0, count);
    }
    /**
     * Search outputs
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.outputs.values())
            .filter(o => {
            if (typeof o.content === 'string') {
                return o.content.toLowerCase().includes(lowerQuery);
            }
            return o.toolName.toLowerCase().includes(lowerQuery);
        });
    }
    /**
     * Delete output
     */
    delete(id) {
        const output = this.outputs.get(id);
        if (!output)
            return false;
        this.outputs.delete(id);
        const serverOutputs = this.outputsByServer.get(output.serverId);
        if (serverOutputs) {
            const index = serverOutputs.indexOf(id);
            if (index !== -1)
                serverOutputs.splice(index, 1);
        }
        return true;
    }
    /**
     * Clear server outputs
     */
    clearServer(serverId) {
        const ids = this.outputsByServer.get(serverId) ?? [];
        let count = 0;
        for (const id of ids) {
            if (this.outputs.delete(id))
                count++;
        }
        this.outputsByServer.delete(serverId);
        return count;
    }
    /**
     * Get stats
     */
    getStats() {
        const outputs = Array.from(this.outputs.values());
        const byType = {
            text: 0, image: 0, file: 0, error: 0
        };
        for (const o of outputs)
            byType[o.type]++;
        return {
            outputsCount: outputs.length,
            serversCount: this.outputsByServer.size,
            byType,
            maxOutputs: this.maxOutputs
        };
    }
    /**
     * Set max outputs
     */
    setMaxOutputs(max) {
        this.maxOutputs = max;
        this.trimOld();
    }
    /**
     * Clear all
     */
    clear() {
        this.outputs.clear();
        this.outputsByServer.clear();
        this.outputCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
        this.maxOutputs = 100;
    }
}
// Global singleton
export const mcpOutputStorage = new MCPOutputStorage();
export default mcpOutputStorage;
//# sourceMappingURL=mcp-output-storage.js.map