// @ts-nocheck

/**
 * List MCP Resources Tool Pattern - MCP资源列表工具
 * 
 * Source: Claude Code tools/ListMcpResourcesTool/ListMcpResourcesTool.ts
 * Pattern: list MCP resources + resource discovery + enumeration + catalog
 */

interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
  serverId: string
}

class ListMCPResourcesTool {
  private resources = new Map<string, MCPResource>()
  private resourcesByServer = new Map<string, string[]>()

  /**
   * Register resource
   */
  register(serverId: string, uri: string, name: string, description?: string, mimeType?: string): MCPResource {
    const resource: MCPResource = {
      uri,
      name,
      description,
      mimeType,
      serverId
    }

    this.resources.set(uri, resource)

    const serverResources = this.resourcesByServer.get(serverId) ?? []
    serverResources.push(uri)
    this.resourcesByServer.set(serverId, serverResources)

    return resource
  }

  /**
   * List all resources
   */
  list(): MCPResource[] {
    return Array.from(this.resources.values())
  }

  /**
   * List by server
   */
  listByServer(serverId: string): MCPResource[] {
    const uris = this.resourcesByServer.get(serverId) ?? []
    return uris.map(uri => this.resources.get(uri)).filter(r => r !== undefined) as MCPResource[]
  }

  /**
   * List by mime type
   */
  listByMimeType(mimeType: string): MCPResource[] {
    return Array.from(this.resources.values())
      .filter(r => r.mimeType === mimeType)
  }

  /**
   * Get resource
   */
  getResource(uri: string): MCPResource | undefined {
    return this.resources.get(uri)
  }

  /**
   * Search resources
   */
  search(query: string): MCPResource[] {
    const lowerQuery = query.toLowerCase()

    return Array.from(this.resources.values())
      .filter(r =>
        r.uri.toLowerCase().includes(lowerQuery) ||
        r.name.toLowerCase().includes(lowerQuery) ||
        (r.description?.toLowerCase().includes(lowerQuery))
      )
  }

  /**
   * Unregister resource
   */
  unregister(uri: string): boolean {
    const resource = this.resources.get(uri)
    if (!resource) return false

    this.resources.delete(uri)

    const serverResources = this.resourcesByServer.get(resource.serverId)
    if (serverResources) {
      const index = serverResources.indexOf(uri)
      if (index !== -1) serverResources.splice(index, 1)
    }

    return true
  }

  /**
   * Get stats
   */
  getStats(): {
    resourcesCount: number
    serversCount: number
    byMimeType: Record<string, number>
  } {
    const byMimeType: Record<string, number> = {}

    for (const resource of this.resources.values()) {
      const mime = resource.mimeType ?? 'unknown'
      byMimeType[mime] = (byMimeType[mime] ?? 0) + 1
    }

    return {
      resourcesCount: this.resources.size,
      serversCount: this.resourcesByServer.size,
      byMimeType
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.resources.clear()
    this.resourcesByServer.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const listMCPResourcesTool = new ListMCPResourcesTool()

export default listMCPResourcesTool