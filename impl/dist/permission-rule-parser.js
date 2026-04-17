// @ts-nocheck
class PermissionRuleParser {
    /**
     * Parse single permission rule
     * Format: Allow(Deny): toolPattern: pathPattern
     */
    parseRule(line, lineNumber) {
        // Skip comments and empty lines
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || trimmed === '')
            return null;
        // Match pattern: Allow/Deny(tool): path
        const match = trimmed.match(/^(Allow|Deny)\(([^)]+)\):\s*(.+)$/);
        if (!match) {
            console.warn(`[PermissionParser] Invalid rule at line ${lineNumber}: ${trimmed}`);
            return null;
        }
        const action = match[1];
        const toolPattern = match[2];
        const pathPattern = match[3];
        // Validate patterns
        if (!this.validatePattern(toolPattern)) {
            console.warn(`[PermissionParser] Invalid tool pattern: ${toolPattern}`);
            return null;
        }
        if (!this.validatePattern(pathPattern)) {
            console.warn(`[PermissionParser] Invalid path pattern: ${pathPattern}`);
            return null;
        }
        return {
            action,
            toolPattern,
            pathPattern,
            raw: trimmed,
            lineNumber
        };
    }
    /**
     * Parse multiple permission rules
     */
    parsePermissionRules(content) {
        const lines = content.split('\n');
        const rules = [];
        for (let i = 0; i < lines.length; i++) {
            const rule = this.parseRule(lines[i], i + 1);
            if (rule) {
                rules.push(rule);
            }
        }
        return rules;
    }
    /**
     * Validate pattern (escape-aware)
     */
    validatePattern(pattern) {
        // Check for invalid characters
        const invalidChars = ['|', '&', ';', '<', '>', '$', '`'];
        for (const char of invalidChars) {
            if (pattern.includes(char)) {
                return false;
            }
        }
        // Check for valid wildcards
        // * is allowed, but not in middle of word
        const wildcardCount = pattern.split('*').length - 1;
        if (wildcardCount > 2) {
            // Too many wildcards
            return false;
        }
        return true;
    }
    /**
     * Expand shell wildcard pattern
     */
    expandWildcard(pattern) {
        // For simple wildcards, return single pattern
        // Complex expansion would require filesystem access
        if (!pattern.includes('*')) {
            return [pattern];
        }
        // Prefix wildcard (e.g., /foo/*)
        if (pattern.endsWith('/*')) {
            return [pattern];
        }
        // Suffix wildcard (e.g., *.txt)
        if (pattern.startsWith('*')) {
            return [pattern];
        }
        return [pattern];
    }
    /**
     * Match tool name against pattern
     */
    matchTool(toolName, toolPattern) {
        // Exact match
        if (toolPattern === '*' || toolPattern === toolName)
            return true;
        // Wildcard prefix (e.g., file*)
        if (toolPattern.endsWith('*')) {
            const prefix = toolPattern.slice(0, -1);
            return toolName.startsWith(prefix);
        }
        // Wildcard suffix (e.g., *Tool)
        if (toolPattern.startsWith('*')) {
            const suffix = toolPattern.slice(1);
            return toolName.endsWith(suffix);
        }
        return false;
    }
    /**
     * Match path against pattern
     */
    matchPath(path, pathPattern) {
        // Exact match
        if (pathPattern === path)
            return true;
        // Prefix wildcard
        if (pathPattern.endsWith('/*')) {
            const prefix = pathPattern.slice(0, -2);
            return path.startsWith(prefix + '/') || path === prefix;
        }
        // Suffix wildcard
        if (pathPattern.startsWith('*')) {
            const suffix = pathPattern.slice(1);
            return path.endsWith(suffix);
        }
        // Middle wildcard (e.g., /foo/*/bar)
        if (pathPattern.includes('*')) {
            const parts = pathPattern.split('*');
            return path.startsWith(parts[0] ?? '') && path.endsWith(parts[parts.length - 1] ?? '');
        }
        return false;
    }
    /**
     * Convert rules to permission config
     */
    toPermissionConfig(rules) {
        const allow = [];
        const deny = [];
        for (const rule of rules) {
            if (rule.action === 'Allow') {
                allow.push({ tool: rule.toolPattern, path: rule.pathPattern });
            }
            else {
                deny.push({ tool: rule.toolPattern, path: rule.pathPattern });
            }
        }
        return { allow, deny };
    }
    /**
     * Reset for testing
     */
    _reset() {
        // No state to reset
    }
}
// Global singleton
export const permissionRuleParser = new PermissionRuleParser();
export default permissionRuleParser;
//# sourceMappingURL=permission-rule-parser.js.map