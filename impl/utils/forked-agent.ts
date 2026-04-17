/**
 * Forked Agent helper for running subagent query loops with cache sharing.
 *
 * Adapted from Claude Code's utils/forkedAgent.ts for OpenClaw integration.
 * Key concepts:
 * 1. Share identical cache-critical params with parent for prompt cache hits
 * 2. Track full usage metrics across query loop
 * 3. Isolate mutable state to prevent interference with main agent
 */

import type { UUID } from 'crypto'
import { randomUUID } from 'crypto'

/**
 * Parameters that must be identical between fork and parent API requests
 * to share the parent's prompt cache.
 *
 * Anthropic API cache key: system prompt, tools, model, messages (prefix), thinking config.
 */
export type CacheSafeParams = {
  /** System prompt - must match parent for cache hits */
  systemPrompt: string
  /** User context - prepended to messages, affects cache */
  userContext: Record<string, string>
  /** System context - appended to system prompt, affects cache */
  systemContext: Record<string, string>
  /** Model ID */
  model: string
  /** Parent context messages for prompt cache sharing */
  forkContextMessages: unknown[]
}

// Slot for last cache-safe params (for post-turn forks)
let lastCacheSafeParams: CacheSafeParams | null = null

export function saveCacheSafeParams(params: CacheSafeParams | null): void {
  lastCacheSafeParams = params
}

export function getLastCacheSafeParams(): CacheSafeParams | null {
  return lastCacheSafeParams
}

/**
 * Forked agent configuration
 */
export type ForkedAgentConfig = {
  /** Messages to start the forked query loop with */
  promptMessages: unknown[]
  /** Cache-safe parameters that must match the parent query */
  cacheSafeParams: CacheSafeParams
  /** Permission check function for the forked agent */
  canUseTool?: () => Promise<{ behavior: 'allow' | 'deny'; message?: string }>
  /** Source identifier for tracking */
  querySource: string
  /** Label for analytics */
  forkLabel: string
  /** Optional cap on number of turns */
  maxTurns?: number
  /** Optional callback for each message */
  onMessage?: (message: unknown) => void
  /** Skip transcript recording */
  skipTranscript?: boolean
  /** Skip cache write (fire-and-forget) */
  skipCacheWrite?: boolean
}

/**
 * Forked agent result
 */
export type ForkedAgentResult = {
  /** All messages yielded during the query loop */
  messages: unknown[]
  /** Accumulated usage */
  totalUsage: {
    input_tokens: number
    output_tokens: number
    cache_read_input_tokens: number
    cache_creation_input_tokens: number
  }
}

/**
 * Creates CacheSafeParams from a context object.
 */
export function createCacheSafeParams(context: {
  systemPrompt: string
  userContext: Record<string, string>
  systemContext: Record<string, string>
  model: string
  messages: unknown[]
}): CacheSafeParams {
  return {
    systemPrompt: context.systemPrompt,
    userContext: context.userContext,
    systemContext: context.systemContext,
    model: context.model,
    forkContextMessages: context.messages,
  }
}

/**
 * Creates an isolated context for subagents.
 * By default, ALL mutable state is isolated to prevent interference.
 */
export function createSubagentContext(
  parentContext: Record<string, unknown>,
  overrides?: Record<string, unknown>,
): Record<string, unknown> {
  // In OpenClaw, we create a fresh context with overrides
  return {
    ...parentContext,
    ...overrides,
    // Isolate mutable state
    readFileState: new Map(),
    nestedMemoryAttachmentTriggers: new Set<string>(),
    loadedNestedMemoryPaths: new Set<string>(),
    toolDecisions: undefined,
    // New abort controller linked to parent
    abortController: new AbortController(),
    // Generate new query tracking
    queryTracking: {
      chainId: randomUUID(),
      depth: 0,
    },
  }
}

/**
 * Runs a forked agent query loop with cache sharing.
 *
 * In OpenClaw, this would integrate with sessions_spawn (subagent API).
 * This is a simplified version for background tasks like AutoDream.
 */
export async function runForkedAgent(config: ForkedAgentConfig): Promise<ForkedAgentResult> {
  const startTime = Date.now()
  const outputMessages: unknown[] = []
  const totalUsage = {
    input_tokens: 0,
    output_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation_input_tokens: 0,
  }

  // For OpenClaw integration, we would use sessions_spawn here
  // For now, return placeholder structure
  console.log(`[ForkedAgent] Starting: ${config.forkLabel}`)

  // Placeholder: would call OpenClaw subagent API
  // const result = await sessions_spawn({ ... })

  const durationMs = Date.now() - startTime

  // Log fork query metrics
  logForkAgentQueryEvent({
    forkLabel: config.forkLabel,
    querySource: config.querySource,
    durationMs,
    messageCount: outputMessages.length,
    totalUsage,
  })

  return {
    messages: outputMessages,
    totalUsage,
  }
}

/**
 * Logs fork agent query event.
 */
function logForkAgentQueryEvent(data: {
  forkLabel: string
  querySource: string
  durationMs: number
  messageCount: number
  totalUsage: ForkedAgentResult['totalUsage']
}): void {
  const totalInputTokens =
    data.totalUsage.input_tokens +
    data.totalUsage.cache_creation_input_tokens +
    data.totalUsage.cache_read_input_tokens

  const cacheHitRate =
    totalInputTokens > 0
      ? data.totalUsage.cache_read_input_tokens / totalInputTokens
      : 0

  console.log(
    `[ForkedAgent] ${data.forkLabel}: duration=${data.durationMs}ms, messages=${data.messageCount}, cacheHitRate=${cacheHitRate.toFixed(2)}`
  )
}

/**
 * Extract result text from agent messages.
 */
export function extractResultText(
  messages: unknown[],
  defaultText = 'Execution completed',
): string {
  // Placeholder: would extract from last assistant message
  return defaultText
}