// @ts-nocheck
/**
 * Environment Utils Pattern - 环境工具
 *
 * Source: Claude Code utils/envUtils.ts + utils/env.ts + utils/envDynamic.ts
 * Pattern: env truthy/falsy + env timeout + env boolean + safe env access
 */
class EnvironmentUtils {
    /**
     * Get environment variable
     */
    get(name, defaultValue) {
        return process.env[name] ?? defaultValue;
    }
    /**
     * Get required environment variable
     */
    getRequired(name) {
        const value = process.env[name];
        if (!value) {
            throw new Error(`Required environment variable ${name} not set`);
        }
        return value;
    }
    /**
     * Check if env is truthy
     */
    isTruthy(name) {
        const value = process.env[name];
        if (!value)
            return false;
        const truthyValues = ['1', 'true', 'yes', 'on', 'enabled', 'y'];
        return truthyValues.includes(value.toLowerCase());
    }
    /**
     * Check if env is falsy
     */
    isFalsy(name) {
        const value = process.env[name];
        if (!value)
            return true; // Undefined is falsy
        const falsyValues = ['0', 'false', 'no', 'off', 'disabled', 'n', ''];
        return falsyValues.includes(value.toLowerCase());
    }
    /**
     * Get env as number
     */
    getNumber(name, defaultValue) {
        const value = process.env[name];
        if (!value)
            return defaultValue;
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    /**
     * Get env as integer
     */
    getInt(name, defaultValue) {
        const value = process.env[name];
        if (!value)
            return defaultValue;
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }
    /**
     * Get env as boolean
     */
    getBoolean(name, defaultValue) {
        const value = process.env[name];
        if (!value)
            return defaultValue;
        return this.isTruthy(name);
    }
    /**
     * Get env as array (comma-separated)
     */
    getArray(name, defaultValue = []) {
        const value = process.env[name];
        if (!value)
            return defaultValue;
        return value.split(',').map(v => v.trim()).filter(v => v.length > 0);
    }
    /**
     * Get env as JSON object
     */
    getJSON(name, defaultValue) {
        const value = process.env[name];
        if (!value)
            return defaultValue;
        try {
            return JSON.parse(value);
        }
        catch {
            return defaultValue;
        }
    }
    /**
     * Set environment variable
     */
    set(name, value) {
        process.env[name] = value;
    }
    /**
     * Delete environment variable
     */
    delete(name) {
        delete process.env[name];
    }
    /**
     * Check if env exists
     */
    has(name) {
        return process.env[name] !== undefined;
    }
    /**
     * Get all env variables matching prefix
     */
    getByPrefix(prefix) {
        const result = {};
        for (const [key, value] of Object.entries(process.env)) {
            if (key.startsWith(prefix)) {
                result[key] = value ?? '';
            }
        }
        return result;
    }
    /**
     * Expand env variables in string
     */
    expand(str) {
        return str.replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] ?? '');
    }
    /**
     * Load env from object
     */
    load(env) {
        for (const [key, value] of Object.entries(env)) {
            process.env[key] = value;
        }
    }
    /**
     * Snapshot current env
     */
    snapshot() {
        return { ...process.env };
    }
    /**
     * Restore env from snapshot
     */
    restore(snapshot) {
        // Clear current env
        for (const key of Object.keys(process.env)) {
            delete process.env[key];
        }
        // Restore snapshot
        for (const [key, value] of Object.entries(snapshot)) {
            if (value !== undefined) {
                process.env[key] = value;
            }
        }
    }
    /**
     * Reset for testing
     */
    _reset() {
        // No persistent state
    }
}
// Global singleton
export const environmentUtils = new EnvironmentUtils();
export default environmentUtils;
//# sourceMappingURL=environment-utils.js.map