// @ts-nocheck

/**
 * Swarm Constants Pattern - Swarm常量
 * 
 * Source: Claude Code utils/swarm/constants.ts
 * Pattern: constants + configuration + limits + thresholds
 */

interface SwarmConstants {
  MAX_AGENTS: number
  MAX_TASKS: number
  MAX_RETRIES: number
  HEARTBEAT_INTERVAL_MS: number
  HEARTBEAT_TIMEOUT_MS: number
  TASK_TIMEOUT_MS: number
  BACKOFF_INITIAL_MS: number
  BACKOFF_MAX_MS: number
  QUEUE_MAX_SIZE: number
  MESSAGE_MAX_SIZE: number
}

class SwarmConstantsService {
  private constants: SwarmConstants = {
    MAX_AGENTS: 50,
    MAX_TASKS: 100,
    MAX_RETRIES: 5,
    HEARTBEAT_INTERVAL_MS: 30000,
    HEARTBEAT_TIMEOUT_MS: 120000,
    TASK_TIMEOUT_MS: 60000,
    BACKOFF_INITIAL_MS: 1000,
    BACKOFF_MAX_MS: 30000,
    QUEUE_MAX_SIZE: 1000,
    MESSAGE_MAX_SIZE: 1024 * 1024 // 1MB
  }

  /**
   * Get constants
   */
  get(): SwarmConstants {
    return { ...this.constants }
  }

  /**
   * Get single constant
   */
  getValue(key: keyof SwarmConstants): number {
    return this.constants[key]
  }

  /**
   * Set constant
   */
  set(key: keyof SwarmConstants, value: number): void {
    this.constants[key] = value
  }

  /**
   * Get max agents
   */
  getMaxAgents(): number {
    return this.constants.MAX_AGENTS
  }

  /**
   * Get max tasks
   */
  getMaxTasks(): number {
    return this.constants.MAX_TASKS
  }

  /**
   * Get heartbeat interval
   */
  getHeartbeatInterval(): number {
    return this.constants.HEARTBEAT_INTERVAL_MS
  }

  /**
   * Get heartbeat timeout
   */
  getHeartbeatTimeout(): number {
    return this.constants.HEARTBEAT_TIMEOUT_MS
  }

  /**
   * Get task timeout
   */
  getTaskTimeout(): number {
    return this.constants.TASK_TIMEOUT_MS
  }

  /**
   * Get backoff
   */
  getBackoff(attempt: number): number {
    const backoff = this.constants.BACKOFF_INITIAL_MS * Math.pow(2, attempt)

    return Math.min(backoff, this.constants.BACKOFF_MAX_MS)
  }

  /**
   * Validate within limits
   */
  validateLimits(agents: number, tasks: number): boolean {
    return agents <= this.constants.MAX_AGENTS && tasks <= this.constants.MAX_TASKS
  }

  /**
   * Get stats
   */
  getStats(): {
    constantsCount: number
    allConstants: SwarmConstants
  } {
    return {
      constantsCount: Object.keys(this.constants).length,
      allConstants: this.get()
    }
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.constants = {
      MAX_AGENTS: 50,
      MAX_TASKS: 100,
      MAX_RETRIES: 5,
      HEARTBEAT_INTERVAL_MS: 30000,
      HEARTBEAT_TIMEOUT_MS: 120000,
      TASK_TIMEOUT_MS: 60000,
      BACKOFF_INITIAL_MS: 1000,
      BACKOFF_MAX_MS: 30000,
      QUEUE_MAX_SIZE: 1000,
      MESSAGE_MAX_SIZE: 1024 * 1024
    }
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.reset()
  }
}

// Global singleton
export const swarmConstantsService = new SwarmConstantsService()

export default swarmConstantsService