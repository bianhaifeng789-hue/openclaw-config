/**
 * OpenClaw Integration Entry Point.
 *
 * Unified integration for all Claude Code patterns:
 * - AutoDream (background memory consolidation)
 * - SessionMemoryCompact (memory compression protection)
 * - AgentSummary (progress summaries)
 * - ForkedAgentCache (cache sharing)
 *
 * This module provides hooks that integrate with OpenClaw's:
 * - HEARTBEAT.md periodic checks
 * - Plugin hooks (postSampling, sessionStart)
 * - Feishu card notifications
 */

import { runAutoDream, getAutoDreamState, setAutoDreamEnabled, type AutoDreamConfig } from './auto-dream.js'
import {
  compactSessionMemory,
  shouldUseSessionMemoryCompaction,
  estimateMemoryTokens,
  setSessionMemoryCompactConfig,
  getSessionMemoryCompactConfig,
} from './session-memory-compact.js'
import {
  startAgentSummarization,
  stopAgentSummarization,
  getAgentSummary,
  getAllAgentSummaries,
} from './agent-summary.js'

// Smart dispatcher and service registry
import { smartDispatcher, smartDispatch } from './smart-dispatcher.js'
import { serviceRegistry, autoEnableAll } from './service-registry.js'

import {
  createAutoDreamCard,
  createAgentSummaryCard,
  createTasksSummaryCard,
  createMemoryCompactCard,
  cardToJson,
} from './feishu-cards.js'
import { readLastConsolidatedAt } from './consolidation-lock.js'
import { readFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'

/**
 * Workspace paths
 */
const WORKSPACE_ROOT = '/Users/mar2game/.openclaw/workspace'
const MEMORY_DIR = join(WORKSPACE_ROOT, 'memory')
const MEMORY_FILE = join(WORKSPACE_ROOT, 'MEMORY.md')
const HEARTBEAT_STATE = join(MEMORY_DIR, 'heartbeat-state.json')

/**
 * Integration state
 */
type IntegrationState = {
  autoDreamEnabled: boolean
  sessionMemoryCompactEnabled: boolean
  agentSummaryEnabled: boolean
  lastAutoDreamAt: number
  lastCompactAt: number
  lastSummaryAt: number
}

let integrationState: IntegrationState = {
  autoDreamEnabled: true,
  sessionMemoryCompactEnabled: true,
  agentSummaryEnabled: true,
  lastAutoDreamAt: 0,
  lastCompactAt: 0,
  lastSummaryAt: 0,
}

/**
 * Load heartbeat state from file.
 */
function loadHeartbeatState(): Record<string, unknown> | null {
  try {
    if (existsSync(HEARTBEAT_STATE)) {
      const content = readFileSync(HEARTBEAT_STATE, 'utf8')
      return JSON.parse(content)
    }
  } catch (e) {
    console.error(`[Integration] Failed to load heartbeat state: ${(e as Error).message}`)
  }
  return null
}

/**
 * Save heartbeat state to file.
 */
function saveHeartbeatState(state: Record<string, unknown>): void {
  try {
    writeFileSync(HEARTBEAT_STATE, JSON.stringify(state, null, 2))
  } catch (e) {
    console.error(`[Integration] Failed to save heartbeat state: ${(e as Error).message}`)
  }
}

/**
 * Hook 1: AutoDream Check (from HEARTBEAT.md)
 * Called every ~30 minutes during heartbeat.
 */
export async function hookAutoDreamCheck(): Promise<void> {
  if (!integrationState.autoDreamEnabled) {
    console.log('[Integration] AutoDream disabled')
    return
  }

  const state = loadHeartbeatState()
  const lastCheck = (state?.autoDream as Record<string, unknown>)?.lastCheckAt as number ?? 0
  const hoursSince = (Date.now() - lastCheck) / 3_600_000

  // Skip if checked recently (< 1h)
  if (hoursSince < 1) {
    console.log(`[Integration] AutoDream skip: checked ${hoursSince.toFixed(1)}h ago`)
    return
  }

  // Run AutoDream
  console.log('[Integration] Running AutoDream...')
  await runAutoDream(MEMORY_DIR)

  // Update state
  const newState = {
    ...state,
    autoDream: {
      lastCheckAt: Date.now(),
      enabled: true,
    },
  }
  saveHeartbeatState(newState)

  integrationState.lastAutoDreamAt = Date.now()
}

/**
 * Hook 2: Session Memory Compact Check (from compaction)
 * Called when context approaches reserveTokensFloor.
 */
export async function hookSessionMemoryCompact(
  messages: Array<{ type: 'user' | 'assistant'; content: string | Array<{ type: string; text?: string }> }>,
): Promise<{
  messagesToKeep: typeof messages
  summaryContent: string
}> {
  if (!integrationState.sessionMemoryCompactEnabled) {
    console.log('[Integration] SessionMemoryCompact disabled')
    return { messagesToKeep: messages, summaryContent: '' }
  }

  // Load current MEMORY.md as session memory
  let sessionMemory = ''
  try {
    if (existsSync(MEMORY_FILE)) {
      sessionMemory = readFileSync(MEMORY_FILE, 'utf8')
    }
  } catch (e) {
    console.error(`[Integration] Failed to load MEMORY.md: ${(e as Error).message}`)
  }

  if (!sessionMemory) {
    console.log('[Integration] No session memory, skip compact')
    return { messagesToKeep: messages, summaryContent: '' }
  }

  // Perform compaction
  const result = compactSessionMemory(messages, sessionMemory)

  console.log(
    `[Integration] SessionMemoryCompact: ${result.preCompactTokenCount} -> ${result.postCompactTokenCount} tokens`
  )

  // Generate Feishu card
  const card = createMemoryCompactCard({
    preCompactTokens: result.preCompactTokenCount,
    postCompactTokens: result.postCompactTokenCount,
    savedTokens: result.preCompactTokenCount - result.postCompactTokenCount,
    messagesKept: result.messagesToKeep.length,
  })

  // Would send card via message tool
  console.log(`[Integration] Card: ${cardToJson(card)}`)

  integrationState.lastCompactAt = Date.now()

  return {
    messagesToKeep: result.messagesToKeep,
    summaryContent: result.summaryContent,
  }
}

/**
 * Hook 3: Agent Summary Start (from background task)
 * Called when a background task starts.
 */
export function hookAgentSummaryStart(taskId: string, agentId: string): void {
  if (!integrationState.agentSummaryEnabled) {
    return
  }

  console.log(`[Integration] Starting AgentSummary for ${taskId}`)
  startAgentSummarization(taskId, agentId)
}

/**
 * Hook 4: Agent Summary Stop (from background task)
 * Called when a background task completes.
 */
export function hookAgentSummaryStop(taskId: string): void {
  console.log(`[Integration] Stopping AgentSummary for ${taskId}`)
  stopAgentSummarization(taskId)
}

/**
 * Hook 5: Heartbeat Task Visualization (from HEARTBEAT.md)
 * Called to visualize running tasks.
 */
export async function hookTaskVisualization(): Promise<string | null> {
  const summaries = getAllAgentSummaries()

  if (summaries.length === 0) {
    return null
  }

  const tasks = summaries.map(s => ({
    taskId: s.taskId,
    summary: s.lastSummary,
    status: (s.running ? 'running' : 'completed') as 'running' | 'completed' | 'failed',
  }))

  const card = createTasksSummaryCard(tasks)
  return cardToJson(card)
}

/**
 * Initialize all integrations.
 */
export function initIntegrations(config?: {
  autoDream?: Partial<AutoDreamConfig>
  sessionMemoryCompact?: Partial<{
    minTokens: number
    maxTokens: number
  }>
}): void {
  console.log('[Integration] Initializing...')

  // Configure AutoDream
  if (config?.autoDream) {
    // Would pass to initAutoDream
    console.log('[Integration] AutoDream config:', config.autoDream)
  }

  // Configure SessionMemoryCompact
  if (config?.sessionMemoryCompact) {
    setSessionMemoryCompactConfig(config.sessionMemoryCompact)
  }

  // Load state
  const state = loadHeartbeatState()
  if (state) {
    integrationState.autoDreamEnabled = (state.autoDream as Record<string, unknown>)?.enabled !== false
    integrationState.sessionMemoryCompactEnabled = true
    integrationState.agentSummaryEnabled = true
  }

  console.log('[Integration] Initialized:', integrationState)
}

/**
 * Get integration status.
 */
export function getIntegrationStatus(): IntegrationState {
  return { ...integrationState }
}

/**
 * Export all modules for external use.
 */
export {
  // AutoDream
  runAutoDream,
  getAutoDreamState,
  setAutoDreamEnabled,

  // SessionMemoryCompact
  compactSessionMemory,
  shouldUseSessionMemoryCompaction,
  estimateMemoryTokens,
  setSessionMemoryCompactConfig,
  getSessionMemoryCompactConfig,

  // AgentSummary
  startAgentSummarization,
  stopAgentSummarization,
  getAgentSummary,
  getAllAgentSummaries,

  // Feishu Cards
  createAutoDreamCard,
  createAgentSummaryCard,
  createTasksSummaryCard,
  createMemoryCompactCard,
  cardToJson,
}

/**
 * One-click auto enable all services
 */
export function autoEnableAllServices(options?: {
  core?: boolean
  services?: boolean
  tools?: boolean
  disabled?: boolean
}): { enabled: string[]; skipped: string[]; summary: string } {
  return autoEnableAll({
    autoEnableCore: options?.core ?? true,
    autoEnableServices: options?.services ?? true,
    autoEnableTools: options?.tools ?? false,
    enableDisabled: options?.disabled ?? false,
  })
}

/**
 * Smart dispatch - auto detect scene and call services
 */
export async function runSmartDispatch(context?: string[]): Promise<string> {
  const result = await smartDispatch(context)
  return result.summary
}