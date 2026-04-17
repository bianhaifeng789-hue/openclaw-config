/**
 * AutoDream - Background memory consolidation.
 *
 * Fires a forked subagent when time-gate passes AND enough sessions have accumulated.
 *
 * Gate order (cheapest first):
 *   1. Time: hours since lastConsolidatedAt >= minHours
 *   2. Sessions: transcript count with mtime > lastConsolidatedAt >= minSessions
 *   3. Lock: no other process mid-consolidation
 *
 * Adapted from Claude Code's services/autoDream/autoDream.ts
 */

import {
  readLastConsolidatedAt,
  tryAcquireConsolidationLock,
  rollbackConsolidationLock,
} from './consolidation-lock.js'
import { buildConsolidationPromptWithSessions } from './consolidation-prompt.js'
import { runForkedAgent, createCacheSafeParams, type CacheSafeParams } from './forked-agent.js'
import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Scan throttle: prevents repeated checks when time-gate passes but session-gate doesn't
const SESSION_SCAN_INTERVAL_MS = 10 * 60 * 1000 // 10 minutes

/**
 * AutoDream configuration
 */
export type AutoDreamConfig = {
  minHours: number    // Minimum hours since last consolidation
  minSessions: number // Minimum sessions accumulated
}

const DEFAULT_CONFIG: AutoDreamConfig = {
  minHours: 24,
  minSessions: 5,
}

/**
 * AutoDream state
 */
export type AutoDreamState = {
  lastSessionScanAt: number
  config: AutoDreamConfig
  enabled: boolean
}

let state: AutoDreamState = {
  lastSessionScanAt: 0,
  config: DEFAULT_CONFIG,
  enabled: true,
}

/**
 * Initialize AutoDream with custom config.
 */
export function initAutoDream(config?: Partial<AutoDreamConfig>): void {
  state.config = { ...DEFAULT_CONFIG, ...config }
  state.enabled = true
}

/**
 * Check if AutoDream is enabled.
 */
export function isAutoDreamEnabled(): boolean {
  return state.enabled
}

/**
 * Set AutoDream enabled state.
 */
export function setAutoDreamEnabled(enabled: boolean): void {
  state.enabled = enabled
}

/**
 * Get current AutoDream state.
 */
export function getAutoDreamState(): AutoDreamState {
  return { ...state }
}

/**
 * Main AutoDream runner.
 * Called from heartbeat or post-turn hooks.
 */
export async function runAutoDream(
  memoryRoot: string,
  context?: {
    systemPrompt?: string
    model?: string
    messages?: unknown[]
  },
): Promise<void> {
  if (!state.enabled) {
    return
  }

  const cfg = state.config

  // --- Time gate ---
  let lastAt: number
  try {
    lastAt = await readLastConsolidatedAt(memoryRoot)
  } catch (e) {
    console.error(`[AutoDream] readLastConsolidatedAt failed: ${(e as Error).message}`)
    return
  }

  const hoursSince = (Date.now() - lastAt) / 3_600_000
  if (hoursSince < cfg.minHours) {
    console.log(`[AutoDream] Time gate not passed: ${hoursSince.toFixed(1)}h < ${cfg.minHours}h`)
    return
  }

  // --- Scan throttle ---
  const sinceScanMs = Date.now() - state.lastSessionScanAt
  if (sinceScanMs < SESSION_SCAN_INTERVAL_MS) {
    console.log(
      `[AutoDream] Scan throttle: last scan was ${Math.round(sinceScanMs / 1000)}s ago`
    )
    return
  }
  state.lastSessionScanAt = Date.now()

  // --- Session gate ---
  const sessionIds = await listSessionsTouchedSince(memoryRoot, lastAt)
  if (sessionIds.length < cfg.minSessions) {
    console.log(
      `[AutoDream] Session gate not passed: ${sessionIds.length} < ${cfg.minSessions}`
    )
    return
  }

  // --- Lock ---
  let priorMtime: number | null
  try {
    priorMtime = await tryAcquireConsolidationLock(memoryRoot)
  } catch (e) {
    console.error(`[AutoDream] Lock acquire failed: ${(e as Error).message}`)
    return
  }

  if (priorMtime === null) {
    console.log('[AutoDream] Lock held by another process')
    return
  }

  console.log(
    `[AutoDream] Firing — ${hoursSince.toFixed(1)}h since last, ${sessionIds.length} sessions to review`
  )

  try {
    const prompt = buildConsolidationPromptWithSessions(memoryRoot, sessionIds)

    // Build cache-safe params if context available
    let cacheSafeParams: CacheSafeParams | undefined
    if (context?.systemPrompt && context?.model) {
      cacheSafeParams = createCacheSafeParams({
        systemPrompt: context.systemPrompt,
        userContext: {},
        systemContext: {},
        model: context.model,
        messages: context.messages || [],
      })
    }

    // Run forked agent for consolidation
    const result = await runForkedAgent({
      promptMessages: [{ type: 'user', content: prompt }],
      cacheSafeParams: cacheSafeParams || {
        systemPrompt: '',
        userContext: {},
        systemContext: {},
        model: 'bailian/glm-5',
        forkContextMessages: [],
      },
      canUseTool: async () => ({
        behavior: 'deny',
        message: 'Read-only for consolidation',
      }),
      querySource: 'auto_dream',
      forkLabel: 'auto_dream',
      skipTranscript: true,
    })

    console.log(
      `[AutoDream] Completed — cache: read=${result.totalUsage.cache_read_input_tokens} created=${result.totalUsage.cache_creation_input_tokens}`
    )
  } catch (e) {
    console.error(`[AutoDream] Fork failed: ${(e as Error).message}`)
    // Rewind mtime so time-gate passes again
    await rollbackConsolidationLock(memoryRoot, priorMtime)
  }
}

/**
 * List sessions touched since a timestamp.
 * Placeholder - would integrate with OpenClaw session storage.
 */
async function listSessionsTouchedSince(
  memoryRoot: string,
  sinceMs: number,
): Promise<string[]> {
  // Placeholder: check memory directory for session files
  // In OpenClaw, would use actual session transcript storage
  const sessionsDir = join(memoryRoot, 'sessions')

  if (!existsSync(sessionsDir)) {
    return []
  }

  const files = readdirSync(sessionsDir)
  const recentSessions: string[] = []

  for (const file of files) {
    if (!file.endsWith('.md') && !file.endsWith('.json')) continue
    const filePath = join(sessionsDir, file)
    try {
      const s = statSync(filePath)
      if (s.mtimeMs > sinceMs) {
        recentSessions.push(file.replace(/\.(md|json)$/, ''))
      }
    } catch {
      // Ignore stat errors
    }
  }

  return recentSessions
}

/**
 * Manual trigger for consolidation (e.g., /dream command).
 */
export async function triggerManualDream(memoryRoot: string): Promise<void> {
  const prompt = buildConsolidationPromptWithSessions(memoryRoot, [])

  console.log('[AutoDream] Manual dream triggered')

  // Run without gates
  await runForkedAgent({
    promptMessages: [{ type: 'user', content: prompt }],
    cacheSafeParams: {
      systemPrompt: '',
      userContext: {},
      systemContext: {},
      model: 'bailian/glm-5',
      forkContextMessages: [],
    },
    canUseTool: async () => ({
      behavior: 'deny',
      message: 'Read-only for consolidation',
    }),
    querySource: 'manual_dream',
    forkLabel: 'manual_dream',
    skipTranscript: true,
  })
}