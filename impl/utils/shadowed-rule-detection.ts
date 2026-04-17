// @ts-nocheck

/**
 * Shadowed Rule Detection Pattern - 规则覆盖检测
 * 
 * Source: Claude Code utils/permissions/shadowedRuleDetection.ts
 * Pattern: detectShadowedRules + lower priority + conflict warning + effectiveRules
 */

interface PermissionRule {
  pattern: string
  action: 'allow' | 'deny'
  priority: number
  source: string
}

interface ShadowedRuleInfo {
  rule: PermissionRule
  shadowedBy: PermissionRule[]
  effective: boolean
}

class ShadowedRuleDetection {
  /**
   * Detect shadowed rules
   * Rules with lower priority that never match due to higher priority rules
   */
  detectShadowedRules(rules: PermissionRule[]): ShadowedRuleInfo[] {
    // Sort by priority (higher first)
    const sortedRules = [...rules].sort((a, b) => b.priority - a.priority)

    const result: ShadowedRuleInfo[] = []
    const effectivePatterns = new Set<string>()

    for (const rule of sortedRules) {
      // Check if pattern is already covered
      const isShadowed = this.isPatternShadowed(rule.pattern, effectivePatterns)

      // If not shadowed, add to effective patterns
      if (!isShadowed) {
        effectivePatterns.add(rule.pattern)
      }

      // Find shadowing rules
      const shadowedBy = isShadowed
        ? this.findShadowingRules(rule, sortedRules)
        : []

      result.push({
        rule,
        shadowedBy,
        effective: !isShadowed
      })
    }

    // Warn about shadowed rules
    const shadowed = result.filter(r => !r.effective)
    if (shadowed.length > 0) {
      console.warn(`[PermissionRules] ${shadowed.length} rules are shadowed by higher priority rules`)
    }

    return result
  }

  /**
   * Check if pattern is shadowed by effective patterns
   */
  private isPatternShadowed(pattern: string, effectivePatterns: Set<string>): boolean {
    // Exact match
    if (effectivePatterns.has(pattern)) return true

    // Pattern covered by wildcard
    for (const effective of effectivePatterns) {
      if (this.patternCovers(effective, pattern)) {
        return true
      }
    }

    return false
  }

  /**
   * Check if pattern A covers pattern B
   */
  private patternCovers(patternA: string, patternB: string): boolean {
    // Wildcard patterns
    if (patternA === '*') return true // Global wildcard covers everything

    // Prefix wildcard (e.g., /foo/* covers /foo/bar)
    if (patternA.endsWith('/*')) {
      const prefix = patternA.slice(0, -2)
      return patternB.startsWith(prefix + '/') || patternB === prefix
    }

    // Suffix wildcard (e.g., *.txt covers file.txt)
    if (patternA.startsWith('*.')) {
      const suffix = patternA.slice(1)
      return patternB.endsWith(suffix)
    }

    return false
  }

  /**
   * Find rules that shadow this rule
   */
  private findShadowingRules(rule: PermissionRule, allRules: PermissionRule[]): PermissionRule[] {
    return allRules.filter(other => {
      // Higher priority
      if (other.priority <= rule.priority) return false

      // Covers pattern
      return this.patternCovers(other.pattern, rule.pattern)
    })
  }

  /**
   * Get effective rules (non-shadowed)
   */
  getEffectiveRules(rules: PermissionRule[]): PermissionRule[] {
    const analysis = this.detectShadowedRules(rules)
    return analysis.filter(r => r.effective).map(r => r.rule)
  }

  /**
   * Generate conflict warnings
   */
  generateWarnings(rules: PermissionRule[]): string[] {
    const analysis = this.detectShadowedRules(rules)
    const warnings: string[] = []

    for (const info of analysis) {
      if (!info.effective && info.shadowedBy.length > 0) {
        const shadowers = info.shadowedBy.map(s => s.pattern).join(', ')
        warnings.push(
          `Rule '${info.rule.pattern}' is shadowed by: ${shadowers}`
        )
      }
    }

    return warnings
  }

  /**
   * Check for conflicting actions (allow vs deny)
   */
  checkConflictingActions(rules: PermissionRule[]): Array<{ pattern: string; conflict: string }> {
    const patternActions = new Map<string, Set<'allow' | 'deny'>>()

    for (const rule of rules) {
      const actions = patternActions.get(rule.pattern) ?? new Set()
      actions.add(rule.action)
      patternActions.set(rule.pattern, actions)
    }

    const conflicts: Array<{ pattern: string; conflict: string }> = []

    for (const [pattern, actions] of patternActions) {
      if (actions.size > 1) {
        conflicts.push({
          pattern,
          conflict: `Pattern has both allow and deny rules`
        })
      }
    }

    return conflicts
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    // No state to reset
  }
}

// Global singleton
export const shadowedRuleDetection = new ShadowedRuleDetection()

export default shadowedRuleDetection