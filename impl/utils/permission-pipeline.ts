// @ts-nocheck

/**
 * Permission Pipeline Steps Pattern - 权限验证多步管道
 * 
 * Source: Claude Code utils/permissions/pathValidation.ts
 * Pattern: deny→internal→safety→working→sandbox→allow precedence + UNC block
 */

type PermissionStep = 
  | 'deny'       // Explicit deny rules
  | 'internal'   // Internal/system paths
  | 'safety'     // Safety checks (UNC, shell expansion)
  | 'working'    // Working directory validation
  | 'sandbox'    // Sandbox restrictions
  | 'allow'      // Explicit allow rules

type PermissionResult = {
  allowed: boolean
  reason?: string
  step?: PermissionStep
}

interface PermissionContext {
  path: string
  toolName: string
  cwd: string
  sandboxEnabled: boolean
  sandboxAllowlist?: string[]
  denyList?: string[]
  allowList?: string[]
}

/**
 * Permission validation pipeline
 * Each step can return early if definitive result
 */
class PermissionPipeline {
  private steps: PermissionStep[] = ['deny', 'internal', 'safety', 'working', 'sandbox', 'allow']

  /**
   * Validate path permission through pipeline
   */
  validate(context: PermissionContext): PermissionResult {
    for (const step of this.steps) {
      const result = this.runStep(step, context)
      if (result.allowed !== undefined) {
        return { allowed: result.allowed, reason: result.reason, step }
      }
    }

    // Default: denied if no explicit allow
    return { allowed: false, reason: 'No matching allow rule', step: 'allow' }
  }

  /**
   * Run single pipeline step
   * Returns { allowed: boolean } if definitive, { allowed: undefined } to continue
   */
  private runStep(step: PermissionStep, context: PermissionContext): { allowed?: boolean; reason?: string } {
    switch (step) {
      case 'deny':
        // Check explicit deny rules
        if (this.matchList(context.path, context.denyList)) {
          return { allowed: false, reason: 'Path in deny list' }
        }
        return { allowed: undefined }

      case 'internal':
        // Block internal system paths
        if (this.isInternalPath(context.path)) {
          return { allowed: false, reason: 'Internal system path' }
        }
        return { allowed: undefined }

      case 'safety':
        // UNC paths (Windows network paths) blocked
        if (context.path.startsWith('\\\\')) {
          return { allowed: false, reason: 'UNC paths not allowed' }
        }
        // Shell expansion characters blocked
        if (this.hasShellExpansion(context.path)) {
          return { allowed: false, reason: 'Shell expansion characters in path' }
        }
        return { allowed: undefined }

      case 'working':
        // Validate against working directory
        if (!this.isInWorkingDir(context.path, context.cwd)) {
          return { allowed: false, reason: 'Path outside working directory' }
        }
        return { allowed: undefined }

      case 'sandbox':
        // Sandbox restrictions
        if (context.sandboxEnabled && !this.isInSandboxAllowlist(context.path, context.sandboxAllowlist)) {
          return { allowed: false, reason: 'Path not in sandbox allowlist' }
        }
        return { allowed: undefined }

      case 'allow':
        // Check explicit allow rules
        if (this.matchList(context.path, context.allowList)) {
          return { allowed: true, reason: 'Path in allow list' }
        }
        return { allowed: undefined }

      default:
        return { allowed: undefined }
    }
  }

  /**
   * Match path against list (supports wildcards)
   */
  private matchList(path: string, list?: string[]): boolean {
    if (!list) return false
    for (const pattern of list) {
      if (this.matchPattern(path, pattern)) {
        return true
      }
    }
    return false
  }

  /**
   * Match path against pattern (simple wildcard support)
   */
  private matchPattern(path: string, pattern: string): boolean {
    // Exact match
    if (pattern === path) return true

    // Wildcard prefix (pattern: /foo/*)
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -2)
      return path.startsWith(prefix + '/') || path === prefix
    }

    // Wildcard suffix (pattern: *.txt)
    if (pattern.startsWith('*')) {
      const suffix = pattern.slice(1)
      return path.endsWith(suffix)
    }

    return false
  }

  /**
   * Check if path is internal system path
   */
  private isInternalPath(path: string): boolean {
    const internalPrefixes = [
      '/etc/',
      '/sys/',
      '/proc/',
      '/dev/',
      'C:\\Windows\\',
      'C:\\Program Files\\',
    ]
    for (const prefix of internalPrefixes) {
      if (path.startsWith(prefix)) return true
    }
    return false
  }

  /**
   * Check for shell expansion characters
   */
  private hasShellExpansion(path: string): boolean {
    const dangerousChars = ['$', '`', '~', '|', '&', ';', '<', '>', '(', ')']
    for (const char of dangerousChars) {
      if (path.includes(char)) return true
    }
    return false
  }

  /**
   * Check if path is in working directory
   */
  private isInWorkingDir(path: string, cwd: string): boolean {
    // Normalize paths
    const normalizedPath = this.normalizePath(path)
    const normalizedCwd = this.normalizePath(cwd)
    return normalizedPath.startsWith(normalizedCwd)
  }

  /**
   * Check if path is in sandbox allowlist
   */
  private isInSandboxAllowlist(path: string, allowlist?: string[]): boolean {
    if (!allowlist) return true // No allowlist = all allowed in sandbox mode
    return this.matchList(path, allowlist)
  }

  /**
   * Normalize path for comparison
   */
  private normalizePath(path: string): string {
    // Remove trailing slash, convert backslashes
    return path.replace(/\\/g, '/').replace(/\/$/, '').toLowerCase()
  }

  /**
   * Get pipeline steps
   */
  getSteps(): PermissionStep[] {
    return [...this.steps]
  }

  /**
   * Add custom step
   */
  addStep(step: PermissionStep, position?: number): void {
    if (position !== undefined) {
      this.steps.splice(position, 0, step)
    } else {
      this.steps.push(step)
    }
  }
}

// Global singleton
export const permissionPipeline = new PermissionPipeline()

export default permissionPipeline