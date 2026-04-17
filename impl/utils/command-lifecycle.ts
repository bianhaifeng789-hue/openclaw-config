// @ts-nocheck

/**
 * Command Lifecycle Pattern - 命令生命周期
 * 
 * Source: Claude Code utils/commandLifecycle.ts
 * Pattern: command lifecycle + registration + execution + cleanup
 */

interface Command {
  id: string
  name: string
  description: string
  handler: (...args: any[]) => Promise<any>
  aliases: string[]
  category: string
  enabled: boolean
}

interface CommandExecution {
  id: string
  commandId: string
  args: any[]
  startTime: number
  endTime: number | null
  success: boolean | null
  error?: string
}

class CommandLifecycle {
  private commands = new Map<string, Command>()
  private executions = new Map<string, CommandExecution>()
  private executionCounter = 0

  /**
   * Register command
   */
  register(id: string, name: string, description: string, handler: (...args: any[]) => Promise<any>, aliases?: string[], category?: string): Command {
    const cmd: Command = {
      id,
      name,
      description,
      handler,
      aliases: aliases ?? [],
      category: category ?? 'general',
      enabled: true
    }

    this.commands.set(id, cmd)

    // Register aliases
    for (const alias of cmd.aliases) {
      this.commands.set(alias, cmd)
    }

    return cmd
  }

  /**
   * Unregister command
   */
  unregister(id: string): boolean {
    const cmd = this.commands.get(id)
    if (!cmd) return false

    this.commands.delete(id)

    // Remove aliases
    for (const alias of cmd.aliases) {
      this.commands.delete(alias)
    }

    return true
  }

  /**
   * Get command
   */
  get(idOrName: string): Command | undefined {
    return this.commands.get(idOrName)
  }

  /**
   * Execute command
   */
  async execute(idOrName: string, ...args: any[]): CommandExecution {
    const cmd = this.commands.get(idOrName)

    const executionId = `exec-${++this.executionCounter}-${Date.now()}`

    const execution: CommandExecution = {
      id: executionId,
      commandId: idOrName,
      args,
      startTime: Date.now(),
      endTime: null,
      success: null
    }

    this.executions.set(executionId, execution)

    if (!cmd || !cmd.enabled) {
      execution.endTime = Date.now()
      execution.success = false
      execution.error = 'Command not found or disabled'

      return execution
    }

    try {
      await cmd.handler(...args)

      execution.endTime = Date.now()
      execution.success = true
    } catch (e) {
      execution.endTime = Date.now()
      execution.success = false
      execution.error = String(e)
    }

    return execution
  }

  /**
   * Enable command
   */
  enable(id: string): boolean {
    const cmd = this.commands.get(id)
    if (!cmd) return false

    cmd.enabled = true

    return true
  }

  /**
   * Disable command
   */
  disable(id: string): boolean {
    const cmd = this.commands.get(id)
    if (!cmd) return false

    cmd.enabled = false

    return true
  }

  /**
   * Get commands by category
   */
  getByCategory(category: string): Command[] {
    return Array.from(this.commands.values())
      .filter(c => c.category === category)
  }

  /**
   * Get all commands
   */
  getAll(): Command[] {
    return Array.from(this.commands.values())
      .filter(c => c.id === c.name) // Only primary, not aliases
  }

  /**
   * Get execution
   */
  getExecution(id: string): CommandExecution | undefined {
    return this.executions.get(id)
  }

  /**
   * Get recent executions
   */
  getRecentExecutions(count: number = 10): CommandExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, count)
  }

  /**
   * Get stats
   */
  getStats(): {
    commandsCount: number
    enabledCount: number
    executionsCount: number
    successRate: number
    averageDurationMs: number
  } {
    const commands = Array.from(this.commands.values())
      .filter(c => c.id === c.name)
    const executions = Array.from(this.executions.values())

    const completed = executions.filter(e => e.endTime !== null)
    const successful = completed.filter(e => e.success === true)
    const avgDuration = completed.length > 0
      ? completed.reduce((sum, e) => sum + (e.endTime! - e.startTime), 0) / completed.length
      : 0

    return {
      commandsCount: commands.length,
      enabledCount: commands.filter(c => c.enabled).length,
      executionsCount: executions.length,
      successRate: completed.length > 0 ? successful.length / completed.length : 0,
      averageDurationMs: avgDuration
    }
  }

  /**
   * Clear executions
   */
  clearExecutions(): void {
    this.executions.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.commands.clear()
    this.executions.clear()
    this.executionCounter = 0
  }
}

// Global singleton
export const commandLifecycle = new CommandLifecycle()

export default commandLifecycle