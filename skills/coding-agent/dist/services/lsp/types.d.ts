/**
 * LSP Types for coding-agent
 *
 * Simplified types for Language Server Protocol integration.
 */
export type LspServerState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
/**
 * Scoped LSP server configuration.
 */
export type ScopedLspServerConfig = {
    /** Command to start the LSP server */
    command: string;
    /** Arguments to pass to the command */
    args?: string[];
    /** Environment variables */
    env?: Record<string, string>;
    /** Working directory */
    workspaceFolder?: string;
    /** Map of file extensions to language IDs */
    extensionToLanguage: Record<string, string>;
    /** Server-specific initialization options */
    initializationOptions?: Record<string, unknown>;
    /** Timeout for server startup (ms) */
    startupTimeout?: number;
    /** Maximum restart attempts */
    maxRestarts?: number;
};
//# sourceMappingURL=types.d.ts.map