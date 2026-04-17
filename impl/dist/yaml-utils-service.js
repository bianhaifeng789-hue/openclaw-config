// @ts-nocheck
class YAMLUtilsService {
    parseResults = [];
    /**
     * Parse YAML (basic)
     */
    parse(yaml) {
        const result = {
            success: false,
            timestamp: Date.now()
        };
        try {
            // Basic YAML parsing - would use proper YAML parser in production
            result.data = this.parseBasic(yaml);
            result.success = true;
        }
        catch (e) {
            result.error = e.message;
        }
        this.parseResults.push(result);
        return result;
    }
    /**
     * Parse basic YAML
     */
    parseBasic(yaml) {
        const result = {};
        const lines = yaml.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#'))
                continue;
            const [key, ...valueParts] = trimmed.split(':');
            if (key && valueParts.length > 0) {
                const value = valueParts.join(':').trim();
                result[key.trim()] = this.parseValue(value);
            }
        }
        return result;
    }
    /**
     * Parse value
     */
    parseValue(value) {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        if (value === 'null')
            return null;
        if (/^\d+$/.test(value))
            return parseInt(value);
        if (/^\d+\.\d+$/.test(value))
            return parseFloat(value);
        if (value.startsWith('"') && value.endsWith('"'))
            return value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'"))
            return value.slice(1, -1);
        return value;
    }
    /**
     * Stringify YAML (basic)
     */
    stringify(data) {
        return this.stringifyBasic(data);
    }
    /**
     * Stringify basic
     */
    stringifyBasic(data, indent) {
        const spaces = '  '.repeat(indent ?? 0);
        const lines = [];
        for (const [key, value] of Object.entries(data)) {
            if (typeof value === 'object' && value !== null) {
                lines.push(`${spaces}${key}:`);
                lines.push(this.stringifyBasic(value, (indent ?? 0) + 1));
            }
            else {
                lines.push(`${spaces}${key}: ${this.stringifyValue(value)}`);
            }
        }
        return lines.join('\n');
    }
    /**
     * Stringify value
     */
    stringifyValue(value) {
        if (typeof value === 'string')
            return `"${value}"`;
        if (value === null)
            return 'null';
        return String(value);
    }
    /**
     * Is valid YAML (basic check)
     */
    isValid(yaml) {
        try {
            this.parseBasic(yaml);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get parse results
     */
    getParseResults() {
        return [...this.parseResults];
    }
    /**
     * Get stats
     */
    getStats() {
        return {
            parseCount: this.parseResults.length,
            successCount: this.parseResults.filter(r => r.success).length,
            failureCount: this.parseResults.filter(r => !r.success).length,
            successRate: this.parseResults.length > 0
                ? this.parseResults.filter(r => r.success).length / this.parseResults.length
                : 0
        };
    }
    /**
     * Clear history
     */
    clearHistory() {
        this.parseResults = [];
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const yamlUtilsService = new YAMLUtilsService();
export default yamlUtilsService;
//# sourceMappingURL=yaml-utils-service.js.map