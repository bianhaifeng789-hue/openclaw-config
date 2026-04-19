/**
 * LSP Server Manager - Simplified for coding-agent
 *
 * Routes LSP requests based on file extensions.
 */
import { createLSPServerInstance } from './LSPServerInstance.js';
const DEFAULT_SERVERS = {
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
};
export function createLSPServerManager() {
    const servers = new Map();
    return {
        async initialize() {
            // Start all configured servers
            for (const [name, config] of Object.entries(DEFAULT_SERVERS)) {
                const server = createLSPServerInstance(config.command, config.args, config.cwd);
                try {
                    await server.start();
                    servers.set(name, server);
                }
                catch (error) {
                    console.error(`Failed to start ${name} LSP server:`, error);
                }
            }
        },
        async shutdown() {
            for (const server of servers.values()) {
                await server.stop();
            }
            servers.clear();
        },
        getServerForFile(filePath) {
            const ext = filePath.slice(filePath.lastIndexOf('.'));
            for (const [name, config] of Object.entries(DEFAULT_SERVERS)) {
                if (config.extensions.includes(ext)) {
                    return servers.get(name);
                }
            }
            return undefined;
        },
    };
}
//# sourceMappingURL=LSPServerManager.js.map