// @ts-nocheck
class ListMCPResourcesTool {
    resources = new Map();
    resourcesByServer = new Map();
    /**
     * Register resource
     */
    register(serverId, uri, name, description, mimeType) {
        const resource = {
            uri,
            name,
            description,
            mimeType,
            serverId
        };
        this.resources.set(uri, resource);
        const serverResources = this.resourcesByServer.get(serverId) ?? [];
        serverResources.push(uri);
        this.resourcesByServer.set(serverId, serverResources);
        return resource;
    }
    /**
     * List all resources
     */
    list() {
        return Array.from(this.resources.values());
    }
    /**
     * List by server
     */
    listByServer(serverId) {
        const uris = this.resourcesByServer.get(serverId) ?? [];
        return uris.map(uri => this.resources.get(uri)).filter(r => r !== undefined);
    }
    /**
     * List by mime type
     */
    listByMimeType(mimeType) {
        return Array.from(this.resources.values())
            .filter(r => r.mimeType === mimeType);
    }
    /**
     * Get resource
     */
    getResource(uri) {
        return this.resources.get(uri);
    }
    /**
     * Search resources
     */
    search(query) {
        const lowerQuery = query.toLowerCase();
        return Array.from(this.resources.values())
            .filter(r => r.uri.toLowerCase().includes(lowerQuery) ||
            r.name.toLowerCase().includes(lowerQuery) ||
            (r.description?.toLowerCase().includes(lowerQuery)));
    }
    /**
     * Unregister resource
     */
    unregister(uri) {
        const resource = this.resources.get(uri);
        if (!resource)
            return false;
        this.resources.delete(uri);
        const serverResources = this.resourcesByServer.get(resource.serverId);
        if (serverResources) {
            const index = serverResources.indexOf(uri);
            if (index !== -1)
                serverResources.splice(index, 1);
        }
        return true;
    }
    /**
     * Get stats
     */
    getStats() {
        const byMimeType = {};
        for (const resource of this.resources.values()) {
            const mime = resource.mimeType ?? 'unknown';
            byMimeType[mime] = (byMimeType[mime] ?? 0) + 1;
        }
        return {
            resourcesCount: this.resources.size,
            serversCount: this.resourcesByServer.size,
            byMimeType
        };
    }
    /**
     * Clear all
     */
    clear() {
        this.resources.clear();
        this.resourcesByServer.clear();
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const listMCPResourcesTool = new ListMCPResourcesTool();
export default listMCPResourcesTool;
//# sourceMappingURL=list-mcp-resources-tool.js.map