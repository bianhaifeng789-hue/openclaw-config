/**
 * LSP Client for coding-agent
 * 
 * Manages communication with an LSP server process via stdio.
 * Adapted from Claude Code's LSPClient.ts
 */

import { type ChildProcess, spawn } from 'child_process'
import {
  createMessageConnection,
  type MessageConnection,
  StreamMessageReader,
  StreamMessageWriter,
  Trace,
} from 'vscode-jsonrpc/node.js'
import type {
  InitializeParams,
  InitializeResult,
  ServerCapabilities,
} from 'vscode-languageserver-protocol'

// Reference to global process
const globalProcess = process

/**
 * Simple debug logger - replace with proper logging if needed
 */
function logForDebugging(message: string): void {
  if (globalProcess.env.LSP_DEBUG) {
    console.error(`[LSP] ${message}`)
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * LSP client interface.
 */
export type LSPClient = {
  readonly capabilities: ServerCapabilities | undefined
  readonly isInitialized: boolean
  start: (
    command: string,
    args: string[],
    options?: {
      env?: Record<string, string>
      cwd?: string
    },
  ) => Promise<void>
  initialize: (params: InitializeParams) => Promise<InitializeResult>
  sendRequest: <TResult>(method: string, params: unknown) => Promise<TResult>
  sendNotification: (method: string, params: unknown) => Promise<void>
  onNotification: (method: string, handler: (params: unknown) => void) => void
  onRequest: <TParams, TResult>(
    method: string,
    handler: (params: TParams) => TResult | Promise<TResult>,
  ) => void
  stop: () => Promise<void>
}

/**
 * Create an LSP client wrapper using vscode-jsonrpc.
 */
export function createLSPClient(
  serverName: string,
  onCrash?: (error: Error) => void,
): LSPClient {
  let process: ChildProcess | undefined
  let connection: MessageConnection | undefined
  let capabilities: ServerCapabilities | undefined
  let isInitialized = false
  let startFailed = false
  let startError: Error | undefined
  let isStopping = false

  const pendingHandlers: Array<{
    method: string
    handler: (params: unknown) => void
  }> = []
  const pendingRequestHandlers: Array<{
    method: string
    handler: (params: unknown) => unknown | Promise<unknown>
  }> = []

  function checkStartFailed(): void {
    if (startFailed) {
      throw startError || new Error(`LSP server ${serverName} failed to start`)
    }
  }

  return {
    get capabilities(): ServerCapabilities | undefined {
      return capabilities
    },

    get isInitialized(): boolean {
      return isInitialized
    },

    async start(
      command: string,
      args: string[],
      options?: {
        env?: Record<string, string>
        cwd?: string
      },
    ): Promise<void> {
      try {
        process = spawn(command, args, {
          stdio: ['pipe', 'pipe', 'pipe'],
          env: { ...globalProcess.env, ...options?.env },
          cwd: options?.cwd,
          windowsHide: true,
        })

        if (!process.stdout || !process.stdin) {
          throw new Error('LSP server process stdio not available')
        }

        const spawnedProcess = process
        await new Promise<void>((resolve, reject) => {
          const onSpawn = (): void => {
            cleanup()
            resolve()
          }
          const onError = (error: Error): void => {
            cleanup()
            reject(error)
          }
          const cleanup = (): void => {
            spawnedProcess.removeListener('spawn', onSpawn)
            spawnedProcess.removeListener('error', onError)
          }
          spawnedProcess.once('spawn', onSpawn)
          spawnedProcess.once('error', onError)
        })

        if (process.stderr) {
          process.stderr.on('data', (data: Buffer) => {
            const output = data.toString().trim()
            if (output) {
              logForDebugging(`[LSP SERVER ${serverName}] ${output}`)
            }
          })
        }

        process.on('error', error => {
          if (!isStopping) {
            startFailed = true
            startError = error
            console.error(`LSP server ${serverName} failed to start: ${error.message}`)
          }
        })

        process.on('exit', (code, _signal) => {
          if (code !== 0 && code !== null && !isStopping) {
            isInitialized = false
            startFailed = false
            startError = undefined
            const crashError = new Error(
              `LSP server ${serverName} crashed with exit code ${code}`,
            )
            console.error(crashError.message)
            onCrash?.(crashError)
          }
        })

        process.stdin.on('error', (error: Error) => {
          if (!isStopping) {
            logForDebugging(`LSP server ${serverName} stdin error: ${error.message}`)
          }
        })

        const reader = new StreamMessageReader(process.stdout)
        const writer = new StreamMessageWriter(process.stdin)
        connection = createMessageConnection(reader, writer)

        connection.onError(([error, _message, _code]) => {
          if (!isStopping) {
            startFailed = true
            startError = error
            console.error(`LSP server ${serverName} connection error: ${error.message}`)
          }
        })

        connection.onClose(() => {
          if (!isStopping) {
            isInitialized = false
            logForDebugging(`LSP server ${serverName} connection closed`)
          }
        })

        connection.listen()

        connection
          .trace(Trace.Verbose, {
            log: (message: string) => {
              logForDebugging(`[LSP PROTOCOL ${serverName}] ${message}`)
            },
          })
          .catch((error: Error) => {
            logForDebugging(`Failed to enable tracing for ${serverName}: ${error.message}`)
          })

        for (const { method, handler } of pendingHandlers) {
          connection.onNotification(method, handler)
        }
        pendingHandlers.length = 0

        for (const { method, handler } of pendingRequestHandlers) {
          connection.onRequest(method, handler)
        }
        pendingRequestHandlers.length = 0

        logForDebugging(`LSP client started for ${serverName}`)
      } catch (error) {
        const err = error as Error
        console.error(`LSP server ${serverName} failed to start: ${err.message}`)
        throw error
      }
    },

    async initialize(params: InitializeParams): Promise<InitializeResult> {
      if (!connection) {
        throw new Error('LSP client not started')
      }

      checkStartFailed()

      try {
        const result: InitializeResult = await connection.sendRequest(
          'initialize',
          params,
        )

        capabilities = result.capabilities
        await connection.sendNotification('initialized', {})
        isInitialized = true
        logForDebugging(`LSP server ${serverName} initialized`)

        return result
      } catch (error) {
        const err = error as Error
        console.error(`LSP server ${serverName} initialize failed: ${err.message}`)
        throw error
      }
    },

    async sendRequest<TResult>(
      method: string,
      params: unknown,
    ): Promise<TResult> {
      if (!connection) {
        throw new Error('LSP client not started')
      }

      checkStartFailed()

      if (!isInitialized) {
        throw new Error('LSP server not initialized')
      }

      try {
        return await connection.sendRequest(method, params)
      } catch (error) {
        const err = error as Error
        console.error(`LSP server ${serverName} request ${method} failed: ${err.message}`)
        throw error
      }
    },

    async sendNotification(method: string, params: unknown): Promise<void> {
      if (!connection) {
        throw new Error('LSP client not started')
      }

      checkStartFailed()

      try {
        await connection.sendNotification(method, params)
      } catch (error) {
        const err = error as Error
        console.error(`LSP server ${serverName} notification ${method} failed: ${err.message}`)
        logForDebugging(`Notification ${method} failed but continuing`)
      }
    },

    onNotification(method: string, handler: (params: unknown) => void): void {
      if (!connection) {
        pendingHandlers.push({ method, handler })
        return
      }

      checkStartFailed()
      connection.onNotification(method, handler)
    },

    onRequest<TParams, TResult>(
      method: string,
      handler: (params: TParams) => TResult | Promise<TResult>,
    ): void {
      if (!connection) {
        pendingRequestHandlers.push({
          method,
          handler: handler as (params: unknown) => unknown | Promise<unknown>,
        })
        return
      }

      checkStartFailed()
      connection.onRequest(method, handler)
    },

    async stop(): Promise<void> {
      let shutdownError: Error | undefined
      isStopping = true

      try {
        if (connection) {
          await connection.sendRequest('shutdown', {})
          await connection.sendNotification('exit', {})
        }
      } catch (error) {
        const err = error as Error
        console.error(`LSP server ${serverName} stop failed: ${err.message}`)
        shutdownError = err
      } finally {
        if (connection) {
          try {
            connection.dispose()
          } catch (error) {
            logForDebugging(`Connection disposal failed for ${serverName}: ${errorMessage(error)}`)
          }
          connection = undefined
        }

        if (process) {
          process.removeAllListeners('error')
          process.removeAllListeners('exit')
          if (process.stdin) {
            process.stdin.removeAllListeners('error')
          }
          if (process.stderr) {
            process.stderr.removeAllListeners('data')
          }

          try {
            process.kill()
          } catch (error) {
            logForDebugging(`Process kill failed for ${serverName}: ${errorMessage(error)}`)
          }
          process = undefined
        }

        isInitialized = false
        capabilities = undefined
        isStopping = false

        if (shutdownError) {
          startFailed = true
          startError = shutdownError
        }

        logForDebugging(`LSP client stopped for ${serverName}`)
      }

      if (shutdownError) {
        throw shutdownError
      }
    },
  }
}