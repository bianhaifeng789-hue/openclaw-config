/**
 * LSP Server Manager - Simplified for coding-agent
 * 
 * Routes LSP requests based on file extensions.
 */

import { createLSPServerInstance, type LSPServerInstance } from './LSPServerInstance.js'
import type { ServerCapabilities } from 'vscode-languageserver-protocol'

interface LSPServerConfig {
  command: string
  args: string[]
  extensions: string[]
  cwd?: string
}

const DEFAULT_SERVERS: Record<string, LSPServerConfig> = {
  typescript: {
    command: 'typescript-language-server',
    args: ['--stdio'],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  python: {
    command: 'pylsp',
    args: [],
    extensions: ['.py'],
  },
  rust: {
    command: 'rust-analyzer',
    args: [],
    extensions: ['.rs'],
  },
}

export interface LSPServerManager {
  initialize(): Promise<void>
  shutdown(): Promise<void>
  getServerForFile(filePath: string): LSPServerInstance | undefined
}

export function createLSPServerManager(): LSPServerManager {
  const servers: Map<string, LSPServerInstance> = new Map()

  return {
    async initialize(): Promise<void> {
      // Start all configured servers
      for (const [name, config] of Object.entries(DEFAULT_SERVERS)) {
        const server = createLSPServerInstance(config.command, config.args, config.cwd)
        try {
          await server.start()
          servers.set(name, server)
        } catch (error) {
          console.error(`Failed to start ${name} LSP server:`, error)
        }
      }
    },

    async shutdown(): Promise<void> {
      for (const server of servers.values()) {
        await server.stop()
      }
      servers.clear()
    },

    getServerForFile(filePath: string): LSPServerInstance | undefined {
      const ext = filePath.slice(filePath.lastIndexOf('.'))
      
      for (const [name, config] of Object.entries(DEFAULT_SERVERS)) {
        if (config.extensions.includes(ext)) {
          return servers.get(name)
        }
      }
      
      return undefined
    },
  }
}