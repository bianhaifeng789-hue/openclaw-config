/**
 * LSP Server Manager - Simplified for coding-agent
 *
 * Routes LSP requests based on file extensions.
 */
import { type LSPServerInstance } from './LSPServerInstance.js';
export interface LSPServerManager {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    getServerForFile(filePath: string): LSPServerInstance | undefined;
}
export declare function createLSPServerManager(): LSPServerManager;
//# sourceMappingURL=LSPServerManager.d.ts.map