// @ts-nocheck
class ShellConfig {
    entries = [];
    parsedFiles = [];
    /**
     * Parse shell config file
     */
    parse(content) {
        const lines = content.split('\n');
        const entries = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line === '' || line.startsWith('#')) {
                entries.push({
                    type: 'comment',
                    key: '',
                    value: line,
                    line: i + 1
                });
                continue;
            }
            // Parse alias
            if (line.startsWith('alias ')) {
                const match = line.match(/^alias\s+(\w+)=(.+)$/);
                if (match) {
                    entries.push({
                        type: 'alias',
                        key: match[1],
                        value: match[2],
                        line: i + 1
                    });
                }
                continue;
            }
            // Parse export
            if (line.startsWith('export ')) {
                const match = line.match(/^export\s+(\w+)=(.+)$/);
                if (match) {
                    entries.push({
                        type: 'export',
                        key: match[1],
                        value: match[2],
                        line: i + 1
                    });
                }
                continue;
            }
            // Parse source
            if (line.startsWith('source ') || line.startsWith('.')) {
                const match = line.match(/^(?:source|\.)\s+(.+)$/);
                if (match) {
                    entries.push({
                        type: 'source',
                        key: '',
                        value: match[1],
                        line: i + 1
                    });
                }
                continue;
            }
            // Unknown
            entries.push({
                type: 'unknown',
                key: '',
                value: line,
                line: i + 1
            });
        }
        this.entries = entries;
        return entries;
    }
    /**
     * Quote string for shell
     */
    quote(str, shell = 'bash') {
        if (str === '')
            return "''";
        // Check if needs quoting
        if (/^[a-zA-Z0-9_\-\.\/]+$/.test(str))
            return str;
        // Escape single quotes and wrap
        if (shell === 'bash' || shell === 'zsh') {
            return `'${str.replace(/'/g, "'\\''")}'`;
        }
        if (shell === 'powershell') {
            return `"${str.replace(/"/g, '`"')}"`;
        }
        // Fish shell
        return `'${str.replace(/'/g, "\\\\'")}'`;
    }
    /**
     * Unquote shell string
     */
    unquote(str) {
        // Remove outer quotes
        if ((str.startsWith("'") && str.endsWith("'")) ||
            (str.startsWith('"') && str.endsWith('"'))) {
            return str.slice(1, -1);
        }
        return str;
    }
    /**
     * Escape for shell
     */
    escape(str) {
        return str.replace(/([\\'"$`\s!&|;()<>])/g, '\\$1');
    }
    /**
     * Get entry by key
     */
    getEntry(key) {
        return this.entries.find(e => e.key === key);
    }
    /**
     * Get entries by type
     */
    getByType(type) {
        return this.entries.filter(e => e.type === type);
    }
    /**
     * Get aliases
     */
    getAliases() {
        const aliases = {};
        for (const entry of this.getByType('alias')) {
            aliases[entry.key] = this.unquote(entry.value);
        }
        return aliases;
    }
    /**
     * Get exports
     */
    getExports() {
        const exports = {};
        for (const entry of this.getByType('export')) {
            exports[entry.key] = this.unquote(entry.value);
        }
        return exports;
    }
    /**
     * Get parsed files
     */
    getParsedFiles() {
        return [...this.parsedFiles];
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            totalEntries: this.entries.length,
            aliases: this.getByType('alias').length,
            exports: this.getByType('export').length,
            sources: this.getByType('source').length,
            comments: this.getByType('comment').length
        };
    }
    /**
     * Clear entries
     */
    clear() {
        this.entries = [];
        this.parsedFiles = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clear();
    }
}
// Global singleton
export const shellConfig = new ShellConfig();
export default shellConfig;
//# sourceMappingURL=shell-config.js.map