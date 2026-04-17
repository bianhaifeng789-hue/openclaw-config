// @ts-nocheck
class ShadowedRuleDetection {
    /**
     * Detect shadowed rules
     * Rules with lower priority that never match due to higher priority rules
     */
    detectShadowedRules(rules) {
        // Sort by priority (higher first)
        const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);
        const result = [];
        const effectivePatterns = new Set();
        for (const rule of sortedRules) {
            // Check if pattern is already covered
            const isShadowed = this.isPatternShadowed(rule.pattern, effectivePatterns);
            // If not shadowed, add to effective patterns
            if (!isShadowed) {
                effectivePatterns.add(rule.pattern);
            }
            // Find shadowing rules
            const shadowedBy = isShadowed
                ? this.findShadowingRules(rule, sortedRules)
                : [];
            result.push({
                rule,
                shadowedBy,
                effective: !isShadowed
            });
        }
        // Warn about shadowed rules
        const shadowed = result.filter(r => !r.effective);
        if (shadowed.length > 0) {
            console.warn(`[PermissionRules] ${shadowed.length} rules are shadowed by higher priority rules`);
        }
        return result;
    }
    /**
     * Check if pattern is shadowed by effective patterns
     */
    isPatternShadowed(pattern, effectivePatterns) {
        // Exact match
        if (effectivePatterns.has(pattern))
            return true;
        // Pattern covered by wildcard
        for (const effective of effectivePatterns) {
            if (this.patternCovers(effective, pattern)) {
                return true;
            }
        }
        return false;
    }
    /**
     * Check if pattern A covers pattern B
     */
    patternCovers(patternA, patternB) {
        // Wildcard patterns
        if (patternA === '*')
            return true; // Global wildcard covers everything
        // Prefix wildcard (e.g., /foo/* covers /foo/bar)
        if (patternA.endsWith('/*')) {
            const prefix = patternA.slice(0, -2);
            return patternB.startsWith(prefix + '/') || patternB === prefix;
        }
        // Suffix wildcard (e.g., *.txt covers file.txt)
        if (patternA.startsWith('*.')) {
            const suffix = patternA.slice(1);
            return patternB.endsWith(suffix);
        }
        return false;
    }
    /**
     * Find rules that shadow this rule
     */
    findShadowingRules(rule, allRules) {
        return allRules.filter(other => {
            // Higher priority
            if (other.priority <= rule.priority)
                return false;
            // Covers pattern
            return this.patternCovers(other.pattern, rule.pattern);
        });
    }
    /**
     * Get effective rules (non-shadowed)
     */
    getEffectiveRules(rules) {
        const analysis = this.detectShadowedRules(rules);
        return analysis.filter(r => r.effective).map(r => r.rule);
    }
    /**
     * Generate conflict warnings
     */
    generateWarnings(rules) {
        const analysis = this.detectShadowedRules(rules);
        const warnings = [];
        for (const info of analysis) {
            if (!info.effective && info.shadowedBy.length > 0) {
                const shadowers = info.shadowedBy.map(s => s.pattern).join(', ');
                warnings.push(`Rule '${info.rule.pattern}' is shadowed by: ${shadowers}`);
            }
        }
        return warnings;
    }
    /**
     * Check for conflicting actions (allow vs deny)
     */
    checkConflictingActions(rules) {
        const patternActions = new Map();
        for (const rule of rules) {
            const actions = patternActions.get(rule.pattern) ?? new Set();
            actions.add(rule.action);
            patternActions.set(rule.pattern, actions);
        }
        const conflicts = [];
        for (const [pattern, actions] of patternActions) {
            if (actions.size > 1) {
                conflicts.push({
                    pattern,
                    conflict: `Pattern has both allow and deny rules`
                });
            }
        }
        return conflicts;
    }
    /**
     * Reset for testing
     */
    _reset() {
        // No state to reset
    }
}
// Global singleton
export const shadowedRuleDetection = new ShadowedRuleDetection();
export default shadowedRuleDetection;
//# sourceMappingURL=shadowed-rule-detection.js.map