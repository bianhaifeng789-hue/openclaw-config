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
  get(name: string, defaultValue?: string): string | undefined {
    return process.env[name] ?? defaultValue
  }

  /**
   * Get required environment variable
   */
  getRequired(name: string): string {
    const value = process.env[name]
    if (!value) {
      throw new Error(`Required environment variable ${name} not set`)
    }
    return value
  }

  /**
   * Check if env is truthy
   */
  isTruthy(name: string): boolean {
    const value = process.env[name]
    if (!value) return false

    const truthyValues = ['1', 'true', 'yes', 'on', 'enabled', 'y']
    return truthyValues.includes(value.toLowerCase())
  }

  /**
   * Check if env is falsy
   */
  isFalsy(name: string): boolean {
    const value = process.env[name]
    if (!value) return true // Undefined is falsy

    const falsyValues = ['0', 'false', 'no', 'off', 'disabled', 'n', '']
    return falsyValues.includes(value.toLowerCase())
  }

  /**
   * Get env as number
   */
  getNumber(name: string, defaultValue: number): number {
    const value = process.env[name]
    if (!value) return defaultValue

    const parsed = parseFloat(value)
    return isNaN(parsed) ? defaultValue : parsed
  }

  /**
   * Get env as integer
   */
  getInt(name: string, defaultValue: number): number {
    const value = process.env[name]
    if (!value) return defaultValue

    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  /**
   * Get env as boolean
   */
  getBoolean(name: string, defaultValue: boolean): boolean {
    const value = process.env[name]
    if (!value) return defaultValue

    return this.isTruthy(name)
  }

  /**
   * Get env as array (comma-separated)
   */
  getArray(name: string, defaultValue: string[] = []): string[] {
    const value = process.env[name]
    if (!value) return defaultValue

    return value.split(',').map(v => v.trim()).filter(v => v.length > 0)
  }

  /**
   * Get env as JSON object
   */
  getJSON<T>(name: string, defaultValue: T): T {
    const value = process.env[name]
    if (!value) return defaultValue

    try {
      return JSON.parse(value) as T
    } catch {
      return defaultValue
    }
  }

  /**
   * Set environment variable
   */
  set(name: string, value: string): void {
    process.env[name] = value
  }

  /**
   * Delete environment variable
   */
  delete(name: string): void {
    delete process.env[name]
  }

  /**
   * Check if env exists
   */
  has(name: string): boolean {
    return process.env[name] !== undefined
  }

  /**
   * Get all env variables matching prefix
   */
  getByPrefix(prefix: string): Record<string, string> {
    const result: Record<string, string> = {}

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix)) {
        result[key] = value ?? ''
      }
    }

    return result
  }

  /**
   * Expand env variables in string
   */
  expand(str: string): string {
    return str.replace(/\$\{(\w+)\}/g, (_, name) => process.env[name] ?? '')
  }

  /**
   * Load env from object
   */
  load(env: Record<string, string>): void {
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value
    }
  }

  /**
   * Snapshot current env
   */
  snapshot(): Record<string, string | undefined> {
    return { ...process.env }
  }

  /**
   * Restore env from snapshot
   */
  restore(snapshot: Record<string, string | undefined>): void {
    // Clear current env
    for (const key of Object.keys(process.env)) {
      delete process.env[key]
    }

    // Restore snapshot
    for (const [key, value] of Object.entries(snapshot)) {
      if (value !== undefined) {
        process.env[key] = value
      }
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    // No persistent state
  }
}

// Global singleton
export const environmentUtils = new EnvironmentUtils()

export default environmentUtils