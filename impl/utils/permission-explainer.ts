// @ts-nocheck

/**
 * Permission Explainer SideQuery Pattern - 权限解释旁路查询
 * 
 * Source: Claude Code utils/permissions/permissionExplainer.ts
 * Pattern: explainPermission + classifyIntent + sidequery + brief summary + expandable details
 */

type PermissionIntent = 'allow' | 'deny' | 'ask' | 'unknown'

interface PermissionExplanation {
  intent: PermissionIntent
  summary: string
  details: string
  rule?: string
  source?: string
}

class PermissionExplainer {
  /**
   * Explain permission decision
   * Generates human-readable explanation for permission result
   */
  explainPermission(path: string, toolName: string, result: PermissionIntent): PermissionExplanation {
    const summary = this.generateSummary(path, toolName, result)
    const details = this.generateDetails(path, toolName, result)
    const rule = this.findMatchingRule(path, toolName)

    return {
      intent: result,
      summary,
      details,
      rule,
      source: rule ? 'permission_rules' : 'default_policy'
    }
  }

  /**
   * Generate brief summary
   */
  private generateSummary(path: string, toolName: string, result: PermissionIntent): string {
    const pathShort = this.shortenPath(path)

    switch (result) {
      case 'allow':
        return `${toolName} allowed for ${pathShort}`
      case 'deny':
        return `${toolName} denied for ${pathShort}`
      case 'ask':
        return `${toolName} requires approval for ${pathShort}`
      default:
        return `${toolName} permission unknown`
    }
  }

  /**
   * Generate expandable details
   */
  private generateDetails(path: string, toolName: string, result: PermissionIntent): string {
    const reasons: string[] = []

    // Add context
    reasons.push(`Tool: ${toolName}`)
    reasons.push(`Path: ${path}`)

    // Add reason based on result
    switch (result) {
      case 'allow':
        reasons.push('Allowed by permission rules')
        break
      case 'deny':
        reasons.push('Denied: path matches deny pattern')
        break
      case 'ask':
        reasons.push('Requires approval: no matching allow rule')
        break
      default:
        reasons.push('Unable to determine permission')
    }

    // Add security notes
    if (this.isSensitivePath(path)) {
      reasons.push('Note: Path contains sensitive data')
    }

    return reasons.join('\n')
  }

  /**
   * Find matching rule
   */
  private findMatchingRule(path: string, toolName: string): string | undefined {
    // Would check actual permission rules
    // For now, return placeholder
    return undefined
  }

  /**
   * Shorten path for display
   */
  private shortenPath(path: string): string {
    // Show last 2-3 components
    const parts = path.split('/')
    if (parts.length <= 3) return path
    return '.../' + parts.slice(-2).join('/')
  }

  /**
   * Check if path is sensitive
   */
  private isSensitivePath(path: string): boolean {
    const sensitivePatterns = [
      'secret',
      'password',
      'token',
      'key',
      '.env',
      'credentials'
    ]

    return sensitivePatterns.some(p => path.toLowerCase().includes(p))
  }

  /**
   * Classify intent from user question
   * Used in sidequery to understand what user wants
   */
  classifyIntent(question: string): 'explain' | 'why' | 'how' | 'fix' | 'unknown' {
    const lowerQuestion = question.toLowerCase()

    if (lowerQuestion.includes('why')) return 'why'
    if (lowerQuestion.includes('explain')) return 'explain'
    if (lowerQuestion.includes('how')) return 'how'
    if (lowerQuestion.includes('fix') || lowerQuestion.includes('change')) return 'fix'

    return 'unknown'
  }

  /**
   * Sidequery: answer permission question
   */
  sideQuery(question: string, path: string, toolName: string): string {
    const intent = this.classifyIntent(question)

    switch (intent) {
      case 'why':
        return `Permission for ${path} was determined by your permission rules. The current policy requires ${toolName} to have explicit approval.`
      case 'explain':
        const explanation = this.explainPermission(path, toolName, 'ask')
        return explanation.details
      case 'how':
        return `To allow ${toolName} for ${path}, add a permission rule: 'Allow(${toolName}): ${path}'`
      case 'fix':
        return `You can fix this by editing your permission rules file and adding an allow entry for ${path}.`
      default:
        return 'I can help explain permission decisions. Ask me why a permission was denied or how to fix it.'
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    // No state to reset
  }
}

// Global singleton
export const permissionExplainer = new PermissionExplainer()

export default permissionExplainer