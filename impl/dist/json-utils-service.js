// @ts-nocheck
class JSONUtilsService {
    parseResults = [];
    parseCounter = 0;
    /**
     * Safe parse
     */
    safeParse(json) {
        const result = {
            success: false,
            timestamp: Date.now()
        };
        try {
            result.data = JSON.parse(json);
            result.success = true;
            result.size = json.length;
        }
        catch (e) {
            result.error = e.message;
        }
        this.parseResults.push(result);
        return result;
    }
    /**
     * Parse with reviver
     */
    parseWithReviver(json, reviver) {
        const result = {
            success: false,
            timestamp: Date.now()
        };
        try {
            result.data = JSON.parse(json, reviver);
            result.success = true;
            result.size = json.length;
        }
        catch (e) {
            result.error = e.message;
        }
        this.parseResults.push(result);
        return result;
    }
    /**
     * Safe stringify
     */
    safeStringify(data, replacer, space) {
        try {
            return JSON.stringify(data, replacer, space);
        }
        catch {
            return '{}';
        }
    }
    /**
     * Is valid JSON
     */
    isValid(json) {
        try {
            JSON.parse(json);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Get path
     */
    getPath(data, path) {
        const keys = path.split('.');
        let current = data;
        for (const key of keys) {
            if (current === undefined || current === null)
                return undefined;
            current = current[key];
        }
        return current;
    }
    /**
     * Set path
     */
    setPath(data, path, value) {
        const keys = path.split('.');
        let current = data;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (current[key] === undefined)
                current[key] = {};
            current = current[key];
        }
        current[keys[keys.length - 1]] = value;
        return data;
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
        const avgSize = this.parseResults.length > 0
            ? this.parseResults.reduce((sum, r) => sum + (r.size ?? 0), 0) / this.parseResults.length
            : 0;
        return {
            parseCount: this.parseResults.length,
            successCount: this.parseResults.filter(r => r.success).length,
            failureCount: this.parseResults.filter(r => !r.success).length,
            averageSize: avgSize,
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
        this.parseCounter = 0;
    }
    /**
     * Reset for testing
     */
    _reset() {
        this.clearHistory();
    }
}
// Global singleton
export const jsonUtilsService = new JSONUtilsService();
export default jsonUtilsService;
//# sourceMappingURL=json-utils-service.js.map