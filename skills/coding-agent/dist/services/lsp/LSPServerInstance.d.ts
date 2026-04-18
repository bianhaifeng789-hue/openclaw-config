/**
 * LSP Server Instance - Simplified for coding-agent
 */
import type { ServerCapabilities } from 'vscode-languageserver-protocol';
export interface LSPServerInstance {
    readonly capabilities: ServerCapabilities | undefined;
    readonly isRunning: boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export declare function createLSPServerInstance(command: string, args: string[], cwd?: string): LSPServerInstance;
//# sourceMappingURL=LSPServerInstance.d.ts.map