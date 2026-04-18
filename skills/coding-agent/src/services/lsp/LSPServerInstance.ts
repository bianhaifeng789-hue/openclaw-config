/**
 * LSP Server Instance - Simplified for coding-agent
 */

import { type ChildProcess, spawn } from 'child_process'
import type { ServerCapabilities } from 'vscode-languageserver-protocol'

export interface LSPServerInstance {
  readonly capabilities: ServerCapabilities | undefined
  readonly isRunning: boolean
  start(): Promise<void>
  stop(): Promise<void>
}

export function createLSPServerInstance(
  command: string,
  args: string[],
  cwd?: string,
): LSPServerInstance {
  let childProcess: ChildProcess | undefined
  let capabilities: ServerCapabilities | undefined

  return {
    get capabilities() { return capabilities },
    get isRunning() { return childProcess !== undefined },

    async start() {
      childProcess = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd,
      })

      return new Promise<void>((resolve, reject) => {
        childProcess?.on('spawn', () => resolve())
        childProcess?.on('error', (err) => reject(err))
      })
    },

    async stop() {
      if (childProcess) {
        childProcess.kill()
        childProcess = undefined
      }
    },
  }
}