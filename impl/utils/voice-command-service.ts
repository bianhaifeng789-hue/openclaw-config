// @ts-nocheck

/**
 * Voice Command Pattern - 语音命令
 * 
 * Source: Claude Code commands/voice/index.ts + utils/voiceInput.ts
 * Pattern: voice commands + command recognition + voice triggers + aliases
 */

interface VoiceCommand {
  id: string
  trigger: string[]
  aliases: string[]
  action: string
  description: string
  enabled: boolean
}

interface VoiceCommandResult {
  command: VoiceCommand | null
  transcript: string
  matchedTrigger: string | null
  confidence: number
}

class VoiceCommandService {
  private commands = new Map<string, VoiceCommand>()
  private commandHistory: Array<{ command: VoiceCommand; timestamp: number }> = []
  private commandCounter = 0

  /**
   * Register command
   */
  register(command: Omit<VoiceCommand, 'id'>): VoiceCommand {
    const id = `cmd-${++this.commandCounter}-${Date.now()}`

    const fullCommand: VoiceCommand = {
      id,
      ...command
    }

    this.commands.set(id, fullCommand)

    return fullCommand
  }

  /**
   * Unregister command
   */
  unregister(id: string): boolean {
    return this.commands.delete(id)
  }

  /**
   * Recognize command from transcript
   */
  recognize(transcript: string): VoiceCommandResult {
    const transcriptLower = transcript.toLowerCase().trim()

    // Find matching command
    for (const command of this.commands.values()) {
      if (!command.enabled) continue

      // Check triggers
      for (const trigger of command.trigger) {
        if (transcriptLower.includes(trigger.toLowerCase())) {
          // Record history
          this.commandHistory.push({
            command,
            timestamp: Date.now()
          })

          return {
            command,
            transcript,
            matchedTrigger: trigger,
            confidence: 0.9
          }
        }
      }

      // Check aliases
      for (const alias of command.aliases) {
        if (transcriptLower.includes(alias.toLowerCase())) {
          this.commandHistory.push({
            command,
            timestamp: Date.now()
          })

          return {
            command,
            transcript,
            matchedTrigger: alias,
            confidence: 0.7
          }
        }
      }
    }

    // No match
    return {
      command: null,
      transcript,
      matchedTrigger: null,
      confidence: 0
    }
  }

  /**
   * Execute command
   */
  execute(commandId: string): boolean {
    const command = this.commands.get(commandId)
    if (!command || !command.enabled) return false

    // Would execute actual action
    // For demo, return success
    console.log(`[VoiceCommand] Executing: ${command.action}`)

    return true
  }

  /**
   * Get all commands
   */
  getAll(): VoiceCommand[] {
    return Array.from(this.commands.values())
  }

  /**
   * Get enabled commands
   */
  getEnabled(): VoiceCommand[] {
    return Array.from(this.commands.values()).filter(c => c.enabled)
  }

  /**
   * Toggle command
   */
  toggle(id: string, enabled: boolean): boolean {
    const command = this.commands.get(id)
    if (!command) return false

    command.enabled = enabled

    return true
  }

  /**
   * Get command history
   */
  getHistory(): Array<{ command: VoiceCommand; timestamp: number }> {
    return [...this.commandHistory]
  }

  /**
   * Get stats
   */
  getStats(): {
    totalCommands: number
    enabledCommands: number
    executionCount: number
    mostUsedCommand: string | null
  } {
    const commands = Array.from(this.commands.values())
    const enabled = commands.filter(c => c.enabled)

    // Find most used
    const commandCounts: Record<string, number> = {}
    for (const entry of this.commandHistory) {
      commandCounts[entry.command.action] = (commandCounts[entry.command.action] ?? 0) + 1
    }

    let mostUsed: string | null = null
    let maxCount = 0
    for (const [action, count] of Object.entries(commandCounts)) {
      if (count > maxCount) {
        maxCount = count
        mostUsed = action
      }
    }

    return {
      totalCommands: commands.length,
      enabledCommands: enabled.length,
      executionCount: this.commandHistory.length,
      mostUsedCommand: mostUsed
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.commandHistory = []
  }

  /**
   * Clear all
   */
  clear(): void {
    this.commands.clear()
    this.commandHistory = []
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
    this.commandCounter = 0
  }
}

// Global singleton
export const voiceCommandService = new VoiceCommandService()

// Register default commands
voiceCommandService.register({
  trigger: ['继续', 'continue'],
  aliases: ['go', 'next'],
  action: 'continue',
  description: 'Continue current task',
  enabled: true
})

voiceCommandService.register({
  trigger: ['停止', 'stop'],
  aliases: ['halt', 'pause'],
  action: 'stop',
  description: 'Stop current task',
  enabled: true
})

voiceCommandService.register({
  trigger: ['总结', 'summary'],
  aliases: ['summarize', 'review'],
  action: 'summary',
  description: 'Generate summary',
  enabled: true
})

export default voiceCommandService