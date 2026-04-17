// @ts-nocheck

/**
 * Teammate Inherited CLI Flags Pattern - Teammate继承CLI标志
 * 
 * Source: Claude Code utils/swarm/teammateInit.ts
 * Pattern: inheritedFlags + teammate-specific overrides + process.argv filter + environment context
 */

type CLIFlag = string

interface InheritedFlagsConfig {
  passThrough: CLIFlag[] // Flags to pass to teammate
  override: Map<CLIFlag, string> // Flags to override for teammate
  filter: CLIFlag[] // Flags to filter out
}

class TeammateInheritedFlags {
  private config: InheritedFlagsConfig = {
    passThrough: [
      '--model',
      '--temperature',
      '--max-tokens',
      '--debug',
      '--verbose',
      '--reasoning',
      '--auto'
    ],
    override: new Map([
      // Teammate-specific overrides
      ['--auto', 'true'], // Teammates inherit auto mode
      ['--reasoning', 'true'] // Teammates always use reasoning
    ]),
    filter: [
      // Flags not passed to teammate
      '--help',
      '--version',
      '--status',
      '--init'
    ]
  }

  /**
   * Get inherited flags for teammate process
   */
  getInheritedFlags(): string[] {
    const flags: string[] = []

    // Get current process argv
    const currentFlags = this.parseProcessArgv()

    // Apply pass-through
    for (const flag of this.config.passThrough) {
      const value = currentFlags.get(flag)
      if (value !== undefined) {
        // Check override
        const overrideValue = this.config.override.get(flag)
        if (overrideValue !== undefined) {
          flags.push(flag, overrideValue)
        } else {
          flags.push(flag, value)
        }
      }
    }

    // Add mandatory teammate flags
    flags.push('--teammate')
    flags.push('--no-prompt') // Teammates don't prompt user

    return flags
  }

  /**
   * Parse process.argv into flag map
   */
  private parseProcessArgv(): Map<string, string> {
    const flags = new Map<string, string>()
    const argv = process.argv.slice(2) // Skip node and script

    for (let i = 0; i < argv.length; i++) {
      const arg = argv[i]

      if (arg.startsWith('--')) {
        // Flag with value
        if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          flags.set(arg, argv[i + 1])
          i++ // Skip value
        } else {
          // Boolean flag
          flags.set(arg, 'true')
        }
      }
    }

    return flags
  }

  /**
   * Add pass-through flag
   */
  addPassThrough(flag: CLIFlag): void {
    this.config.passThrough.push(flag)
  }

  /**
   * Add override for flag
   */
  addOverride(flag: CLIFlag, value: string): void {
    this.config.override.set(flag, value)
  }

  /**
   * Add filter flag
   */
  addFilter(flag: CLIFlag): void {
    this.config.filter.push(flag)
  }

  /**
   * Check if flag should be passed
   */
  shouldPass(flag: CLIFlag): boolean {
    return this.config.passThrough.includes(flag) && !this.config.filter.includes(flag)
  }

  /**
   * Get override value
   */
  getOverride(flag: CLIFlag): string | undefined {
    return this.config.override.get(flag)
  }

  /**
   * Get all config
   */
  getConfig(): InheritedFlagsConfig {
    return {
      passThrough: [...this.config.passThrough],
      override: new Map(this.config.override),
      filter: [...this.config.filter]
    }
  }

  /**
   * Set config
   */
  setConfig(config: Partial<InheritedFlagsConfig>): void {
    if (config.passThrough) this.config.passThrough = config.passThrough
    if (config.override) this.config.override = config.override
    if (config.filter) this.config.filter = config.filter
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.config = {
      passThrough: [
        '--model',
        '--temperature',
        '--max-tokens',
        '--debug',
        '--verbose',
        '--reasoning',
        '--auto'
      ],
      override: new Map([
        ['--auto', 'true'],
        ['--reasoning', 'true']
      ]),
      filter: [
        '--help',
        '--version',
        '--status',
        '--init'
      ]
    }
  }
}

// Global singleton
export const teammateInheritedFlags = new TeammateInheritedFlags()

export default teammateInheritedFlags