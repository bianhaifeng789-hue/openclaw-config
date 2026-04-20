import { ensureModelRouterStateFile, readModelRouterState, writeModelRouterState } from './model-router-state'
import type { FailoverDecision, ModelFailureKind, ModelRouterState } from './model-router-types'

// Model router state is isolated in memory/model-router-state.json.
// It tracks model failover only and must not reuse heartbeat-state.json.

const RATE_LIMIT_THRESHOLD = 1
const TIMEOUT_THRESHOLD = 2
const SERVER_ERROR_THRESHOLD = 2
const COOLDOWN_MS = 15 * 60 * 1000

function nowIso(): string {
  return new Date().toISOString()
}

function getThreshold(kind: ModelFailureKind): number | null {
  if (kind === 'rateLimit') return RATE_LIMIT_THRESHOLD
  if (kind === 'timeout') return TIMEOUT_THRESHOLD
  if (kind === 'serverError') return SERVER_ERROR_THRESHOLD
  return null
}

function isSwitchableFailure(kind: ModelFailureKind): boolean {
  return kind === 'rateLimit' || kind === 'timeout' || kind === 'serverError'
}

export function classifyModelError(error: unknown): ModelFailureKind {
  const message = String((error as any)?.message || error || '').toLowerCase()
  const status = Number((error as any)?.status || (error as any)?.statusCode || 0)

  if (status === 429 || message.includes('rate limit') || message.includes('too many requests')) return 'rateLimit'
  if (status === 401 || status === 403) return 'auth'
  if (status === 404 || message.includes('model not found')) return 'modelNotFound'
  if (status >= 500 && status < 600) return 'serverError'
  if (message.includes('timeout') || message.includes('timed out') || message.includes('abort')) return 'timeout'
  if (message.includes('invalid') || message.includes('config') || message.includes('missing baseurl') || message.includes('api key')) return 'config'
  if (status >= 400 && status < 500) return 'prompt'
  return 'unknown'
}

export class ModelRouter {
  constructor(primaryModel = 'openai/gpt-5.4', fallbackModel = 'bailian/glm-5') {
    ensureModelRouterStateFile(primaryModel, fallbackModel)
  }

  getState(): ModelRouterState {
    return readModelRouterState()
  }

  getActiveModel(): string {
    const state = this.getState()
    if (state.degraded && state.cooldownUntil) {
      const cooldownUntil = new Date(state.cooldownUntil).getTime()
      if (Date.now() >= cooldownUntil) {
        state.activeModel = state.primaryModel
        state.degraded = false
        state.cooldownUntil = null
        state.lastSwitchAt = nowIso()
        state.lastSwitchReason = 'cooldown-expired-recover-primary'
        writeModelRouterState(state)
      }
    }
    return state.activeModel
  }

  recordSuccess(model: string): ModelRouterState {
    const state = this.getState()
    state.failures[model] ||= { timeout: 0, rateLimit: 0, serverError: 0, lastFailureAt: null }
    state.failures[model].timeout = 0
    state.failures[model].rateLimit = 0
    state.failures[model].serverError = 0
    if (model === state.primaryModel) {
      state.activeModel = state.primaryModel
      state.degraded = false
      state.cooldownUntil = null
    }
    writeModelRouterState(state)
    return state
  }

  recordFailure(model: string, kind: ModelFailureKind): FailoverDecision {
    const state = this.getState()
    state.failures[model] ||= { timeout: 0, rateLimit: 0, serverError: 0, lastFailureAt: null }
    state.failures[model].lastFailureAt = nowIso()

    if (kind === 'timeout') state.failures[model].timeout += 1
    if (kind === 'rateLimit') state.failures[model].rateLimit += 1
    if (kind === 'serverError') state.failures[model].serverError += 1

    const threshold = getThreshold(kind)
    if (!isSwitchableFailure(kind) || threshold == null) {
      writeModelRouterState(state)
      return { shouldSwitch: false, targetModel: null, reason: null }
    }

    const currentCount = kind === 'timeout'
      ? state.failures[model].timeout
      : kind === 'rateLimit'
        ? state.failures[model].rateLimit
        : state.failures[model].serverError

    if (model === state.primaryModel && currentCount >= threshold) {
      state.activeModel = state.fallbackModel
      state.degraded = true
      state.cooldownUntil = new Date(Date.now() + COOLDOWN_MS).toISOString()
      state.lastSwitchAt = nowIso()
      state.lastSwitchReason = `${kind}-threshold`
      writeModelRouterState(state)
      return {
        shouldSwitch: true,
        targetModel: state.fallbackModel,
        reason: state.lastSwitchReason,
      }
    }

    writeModelRouterState(state)
    return { shouldSwitch: false, targetModel: null, reason: null }
  }
}

export const modelRouter = new ModelRouter()
