// @ts-nocheck
class LSPClientService {
    connected = false;
    capabilities = [];
    diagnostics = new Map();
    completions = [];
    serverName = null;
    /**
     * Initialize LSP client
     */
    async initialize(serverCommand) {
        // Would spawn LSP server process
        // For demo, simulate
        this.connected = true;
        this.capabilities = ['diagnostics', 'completions', 'hover', 'definitions'];
        this.serverName = serverCommand;
        return true;
    }
    /**
     * Shutdown
     */
    async shutdown() {
        this.connected = false;
        this.capabilities = [];
        this.serverName = null;
        this.diagnostics.clear();
        this.completions = [];
    }
    /**
     * Is connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Get capabilities
     */
    getCapabilities() {
        return [...this.capabilities];
    }
    /**
     * Open file
     */
    openFile(uri, content) {
        // Would send textDocument/didOpen
        // For demo, simulate diagnostics
        this.simulateDiagnostics(uri, content);
    }
    /**
     * Simulate diagnostics
     */
    simulateDiagnostics(uri, content) {
        // Would receive from server
        // For demo, generate simple diagnostics
        const lines = content.split('\n');
        const diagnostics = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('TODO')) {
                diagnostics.push({
                    uri,
                    range: {
                        start: { line: i, character: 0 },
                        end: { line: i, character: lines[i].length }
                    },
                    severity: 'hint',
                    message: 'TODO found',
                    source: 'lsp'
                });
            }
        }
        this.diagnostics.set(uri, diagnostics);
    }
    /**
     * Get diagnostics
     */
    getDiagnostics(uri) {
        return this.diagnostics.get(uri) ?? [];
    }
    /**
     * Get all diagnostics
     */
    getAllDiagnostics() {
        return Array.from(this.diagnostics.values()).flat();
    }
    /**
     * Request completions
     */
    async requestCompletions(uri, position) {
        // Would send textDocument/completion
        // For demo, return mock completions
        this.completions = [
            { label: 'function', kind: 'keyword', insertText: 'function' },
            { label: 'const', kind: 'keyword', insertText: 'const' },
            { label: 'let', kind: 'keyword', insertText: 'let' }
        ];
        return this.completions;
    }
    /**
     * Request hover
     */
    async requestHover(uri, position) {
        // Would send textDocument/hover
        // For demo, return mock
        return 'Hover information for this symbol';
    }
    /**
     * Request definition
     */
    async requestDefinition(uri, position) {
        // Would send textDocument/definition
        // For demo, return null
        return null;
    }
    /**
     * Change file
     */
    changeFile(uri, content) {
        // Would send textDocument/didChange
        this.simulateDiagnostics(uri, content);
    }
    /**
     * Close file
     */
    closeFile(uri) {
        // Would send textDocument/didClose
        this.diagnostics.delete(uri);
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            connected: this.connected,
            capabilitiesCount: this.capabilities.length,
            diagnosticsCount: this.getAllDiagnostics().length,
            filesCount: this.diagnostics.size,
            serverName: this.serverName
        };
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.connected = false;
        this.capabilities = [];
        this.diagnostics.clear();
        this.completions = [];
        this.serverName = null;
    }
}
// Global singleton
export const lspClientService = new LSPClientService();
export default lspClientService;
//# sourceMappingURL=lsp-client-service.js.map