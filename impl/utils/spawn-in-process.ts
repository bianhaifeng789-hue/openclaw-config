// @ts-nocheck

/**
 * Spawn In Process Pattern - 进程内Spawn
 * 
 * Source: Claude Code utils/swarm/spawnInProcess.ts + utils/swarm/spawnUtils.ts
 * Pattern: in-process spawn + subprocess + worker threads + isolation
 */

interface InProcessConfig {
  agentId: string
  workerPath: string
  args: string[]
  timeoutMs: number
  isolated: boolean
}

interface InProcessWorker {
  agentId: string
  status: 'starting' | 'running' | 'stopped' | 'error'
  startTime: number
  messagesReceived: number
  messagesSent: number
}

class SpawnInProcess {
  private configs = new Map<string, InProcessConfig>()
  private workers = new Map<string, InProcessWorker>()
  private messageQueue = new Map<string, Array<{ type: string; data: any }>>()

  /**
   * Configure worker
   */
  configure(agentId: string, config: InProcessConfig): void {
    this.configs.set(agentId, config)
  }

  /**
   * Spawn in-process worker
   */
  spawn(agentId: string): InProcessWorker {
    const config = this.configs.get(agentId)

    // Would spawn actual worker thread or subprocess
    // For demo, simulate
    const worker: InProcessWorker = {
      agentId,
      status: 'running',
      startTime: Date.now(),
      messagesReceived: 0,
      messagesSent: 0
    }

    this.workers.set(agentId, worker)
    this.messageQueue.set(agentId, [])

    return worker
  }

  /**
   * Send message to worker
   */
  send(agentId: string, type: string, data: any): boolean {
    const worker = this.workers.get(agentId)
    if (!worker) return false

    const queue = this.messageQueue.get(agentId) ?? []
    queue.push({ type, data })
    this.messageQueue.set(agentId, queue)

    worker.messagesReceived++

    return true
  }

  /**
   * Receive message from worker
   */
  receive(agentId: string): Array<{ type: string; data: any }> {
    const queue = this.messageQueue.get(agentId) ?? []
    this.messageQueue.set(agentId, [])

    const worker = this.workers.get(agentId)
    if (worker) {
      worker.messagesSent += queue.length
    }

    return queue
  }

  /**
   * Stop worker
   */
  stop(agentId: string): boolean {
    const worker = this.workers.get(agentId)
    if (!worker) return false

    worker.status = 'stopped'

    return true
  }

  /**
   * Get worker
   */
  getWorker(agentId: string): InProcessWorker | undefined {
    return this.workers.get(agentId)
  }

  /**
   * Get config
   */
  getConfig(agentId: string): InProcessConfig | undefined {
    return this.configs.get(agentId)
  }

  /**
   * Get running workers
   */
  getRunning(): InProcessWorker[] {
    return Array.from(this.workers.values())
      .filter(w => w.status === 'running')
  }

  /**
   * Get stats
   */
  getStats(): {
    workersCount: number
    runningCount: number
    stoppedCount: number
    errorCount: number
    totalMessagesReceived: number
    totalMessagesSent: number
  } {
    const workers = Array.from(this.workers.values())

    return {
      workersCount: workers.length,
      runningCount: workers.filter(w => w.status === 'running').length,
      stoppedCount: workers.filter(w => w.status === 'stopped').length,
      errorCount: workers.filter(w => w.status === 'error').length,
      totalMessagesReceived: workers.reduce((sum, w) => sum + w.messagesReceived, 0),
      totalMessagesSent: workers.reduce((sum, w) => sum + w.messagesSent, 0)
    }
  }

  /**
   * Clear all
   */
  clear(): void {
    this.configs.clear()
    this.workers.clear()
    this.messageQueue.clear()
  }

  /**
   * Reset for testing
   */
  _reset(): void {
    this.clear()
  }
}

// Global singleton
export const spawnInProcess = new SpawnInProcess()

export default spawnInProcess