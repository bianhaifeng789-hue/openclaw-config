/**
 * LSP Client for coding-agent
 *
 * Manages communication with an LSP server process via stdio.
 * Adapted from Claude Code's LSPClient.ts
 */
import type { InitializeParams, InitializeResult, ServerCapabilities } from 'vscode-languageserver-protocol';
/**
 * LSP client interface.
 */
export type LSPClient = {
    readonly capabilities: ServerCapabilities | undefined;
    readonly isInitialized: boolean;
    start: (command: string, args: string[], options?: {
        env?: Record<string, string>;
        cwd?: string;
    }) => Promise<void>;
    initialize: (params: InitializeParams) => Promise<InitializeResult>;
    sendRequest: <TResult>(method: string, params: unknown) => Promise<TResult>;
    sendNotification: (method: string, params: unknown) => Promise<void>;
    onNotification: (method: string, handler: (params: unknown) => void) => void;
    onRequest: <TParams, TResult>(method: string, handler: (params: TParams) => TResult | Promise<TResult>) => void;
    stop: () => Promise<void>;
};
/**
 * Create an LSP client wrapper using vscode-jsonrpc.
 */
export declare function createLSPClient(serverName: string, onCrash?: (error: Error) => void): LSPClient;
//# sourceMappingURL=LSPClient.d.ts.map