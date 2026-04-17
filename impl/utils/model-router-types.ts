export type ModelFailureKind = 'rateLimit' | 'timeout' | 'serverError' | 'auth' | 'config' | 'modelNotFound' | 'prompt' | 'unknown'

export interface ModelFailureCounters {
  timeout: number
  rateLimit: number
  serverError: number
  lastFailureAt: string | null
}

export interface ModelFailureMap {
  [model: string]: ModelFailureCounters
}

export interface ModelRouterState {
  primaryModel: string
  fallbackModel: string
  activeModel: string
  failures: ModelFailureMap
  lastSwitchAt: string | null
  lastSwitchReason: string | null
  degraded: boolean
  cooldownUntil: string | null
}

export interface FailoverDecision {
  shouldSwitch: boolean
  targetModel: string | null
  reason: string | null
}
