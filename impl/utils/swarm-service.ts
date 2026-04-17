/**
 * Swarm Service - 多代理协作系统增强
 * 
 * 借鉴 Claude Code 的 Swarm 系统：
 * - swarm/backends/detection.ts - 后端检测
 * - swarm/backends/registry.ts - 后端注册表
 * - swarm/teammateInit.ts - 队友初始化
 * - swarm/teammateLayoutManager.ts - 队友布局管理
 * - swarm/reconnection.ts - 重连机制
 * 
 * OpenClaw 适配：
 * - sessions_spawn 实现
 * - 多角色协作
 * - 飞书场景适配
 */

import { sessionTracing } from './session-tracing'

// ============================================================================
// Backend Types
// ============================================================================

/**
 * Swarm Backend Type - 后端类型
 * 
 * 借鉴 Claude Code 的 BackendType
 */
export type SwarmBackendType =
  | 'in_process'       // 进程内（同 session）
  | 'remote_process'   // 远程进程（不同机器）
  | 'cloud_api'        // 云 API（Claude.ai）
  | 'acp_harness'      // ACP harness（Codex/Cursor）

/**
 * Swarm Backend - 后端定义
 * 
 * 借鉴 Claude Code 的 Backend 定义
 */
export interface SwarmBackend {
  /** 后端 ID */
  backendId: string
  /** 后端类型 */
  backendType: SwarmBackendType
  /** 后端名称 */
  name: string
  /** 后端描述 */
  description?: string
  /** 是否可用 */
  available: boolean
  /** 模型列表 */
  models?: string[]
  /** 配置 */
  config?: Record<string, unknown>
  /** 上次检测时间 */
  lastDetected?: number
  /** 健康状态 */
  health?: 'healthy' | 'degraded' | 'unavailable'
}

/**
 * Swarm Backend Registry - 后端注册表
 */
export interface SwarmBackendRegistry {
  /** 注册的后端 */
  backends: Map<string, SwarmBackend>
  /** 默认后端 */
  defaultBackend?: string
  /** 上次更新时间 */
  lastUpdated: number
}

// ============================================================================
// Teammate Types
// ============================================================================

/**
 * Teammate Role - 队友角色
 * 
 * 借鉴 Claude Code 的 TeammateRole
 */
export type TeammateRole =
  | 'researcher'     // 研究员 - 搜索和调研
  | 'planner'        // 规划者 - 制定计划
  | 'implementer'    // 实现者 - 编写代码
  | 'reviewer'       // 审查者 - 检查质量
  | 'tester'         // 测试者 - 运行测试
  | 'documenter'     // 文档编写者 - 写文档
  | 'coordinator'    // 协调者 - 统筹任务
  | 'specialist'     // 专家 - 特定领域

/**
 * Teammate - 队友定义
 */
export interface Teammate {
  /** 队友 ID */
  teammateId: string
  /** 会话 ID */
  sessionId: string
  /** 角色 */
  role: TeammateRole
  /** 任务描述 */
  task: string
  /** 状态 */
  status: 'idle' | 'running' | 'completed' | 'failed'
  /** 创建时间 */
  createdAt: number
  /** 开始时间 */
  startedAt?: number
  /** 完成时间 */
  completedAt?: number
  /** 结果 */
  result?: string
  /** 后端类型 */
  backendType: SwarmBackendType
  /** 模型 */
  model?: string
  /** 输出消息 */
  messages?: unknown[]
  /** 子队友 */
  subTeammates?: Teammate[]
  /** 追踪链 ID */
  chainId?: string
}

/**
 * Teammate Layout - 队友布局
 * 
 * 借鉴 Claude Code 的 TeammateLayoutManager
 */
export interface TeammateLayout {
  /** 队友列表 */
  teammates: Teammate[]
  /** 布局类型 */
  layoutType: 'parallel' | 'sequential' | 'hierarchical'
  /** 最大并发数 */
  maxConcurrency: number
  /** 当前运行数 */
  runningCount: number
  /** 完成数 */
  completedCount: number
  /** 失败数 */
  failedCount: number
  /** 预计完成时间 */
  estimatedCompletionTime?: number
}

// ============================================================================
// Backend Detection
// ============================================================================

// 后端注册表（全局状态）
let backendRegistry: SwarmBackendRegistry = {
  backends: new Map(),
  lastUpdated: 0
}

/**
 * Detect Available Backends
 * 
 * 检测可用的后端
 * 
 * 借鉴 Claude Code 的 detectBackends()
 */
export async function detectBackends(): Promise<SwarmBackend[]> {
  const backends: SwarmBackend[] = []
  
  // 1. 检测 in_process（总是可用）
  backends.push({
    backendId: 'in_process',
    backendType: 'in_process',
    name: 'In-Process',
    description: 'Same process (shared memory)',
    available: true,
    models: ['default'],
    health: 'healthy',
    lastDetected: Date.now()
  })
  
  // 2. 检测 remote_process（需要配置）
  // 实际实现需要检查环境变量或配置文件
  // 这里是占位
  const remoteAvailable = false  // await checkRemoteProcessAvailable()
  backends.push({
    backendId: 'remote_process',
    backendType: 'remote_process',
    name: 'Remote Process',
    description: 'Remote machine (SSH)',
    available: remoteAvailable,
    health: remoteAvailable ? 'healthy' : 'unavailable',
    lastDetected: Date.now()
  })
  
  // 3. 检测 cloud_api（Claude.ai）
  // 实际实现需要检查 API key
  // 这里是占位
  const cloudAvailable = true  // await checkCloudApiAvailable()
  backends.push({
    backendId: 'cloud_api',
    backendType: 'cloud_api',
    name: 'Cloud API',
    description: 'Claude.ai cloud',
    available: cloudAvailable,
    models: ['claude-sonnet-4', 'claude-opus-4'],
    health: cloudAvailable ? 'healthy' : 'unavailable',
    lastDetected: Date.now()
  })
  
  // 4. 检测 acp_harness（Codex/Cursor）
  // 实际实现需要检查 ACP 配置
  // 这里是占位
  const acpAvailable = false  // await checkAcpHarnessAvailable()
  backends.push({
    backendId: 'acp_harness',
    backendType: 'acp_harness',
    name: 'ACP Harness',
    description: 'Codex/Cursor integration',
    available: acpAvailable,
    health: acpAvailable ? 'healthy' : 'unavailable',
    lastDetected: Date.now()
  })
  
  return backends
}

/**
 * Register Backend
 * 
 * 注册后端到注册表
 */
export function registerBackend(backend: SwarmBackend): void {
  backendRegistry.backends.set(backend.backendId, backend)
  backendRegistry.lastUpdated = Date.now()
  
  // 设置默认后端（第一个可用的）
  if (!backendRegistry.defaultBackend && backend.available) {
    backendRegistry.defaultBackend = backend.backendId
  }
}

/**
 * Get Backend Registry
 */
export function getBackendRegistry(): SwarmBackendRegistry {
  return {
    ...backendRegistry,
    backends: new Map(backendRegistry.backends)
  }
}

/**
 * Get Available Backends
 */
export function getAvailableBackends(): SwarmBackend[] {
  return Array.from(backendRegistry.backends.values())
    .filter(b => b.available)
}

/**
 * Select Backend
 * 
 * 选择合适的后端
 * 
 * @param preferredBackend - 首选后端类型
 * @returns 选中的后端
 */
export function selectBackend(
  preferredBackend?: SwarmBackendType
): SwarmBackend | null {
  const available = getAvailableBackends()
  
  if (preferredBackend) {
    const matched = available.find(b => b.backendType === preferredBackend)
    if (matched) {
      return matched
    }
  }
  
  // 返回默认后端
  if (backendRegistry.defaultBackend) {
    return backendRegistry.backends.get(backendRegistry.defaultBackend)
  }
  
  // 返回第一个可用的
  return available[0] ?? null
}

// ============================================================================
// Teammate Management
// ============================================================================

// 队友列表（全局状态）
let teammates: Teammate[] = []

// 队友布局（全局状态）
let teammateLayout: TeammateLayout = {
  teammates: [],
  layoutType: 'parallel',
  maxConcurrency: 3,
  runningCount: 0,
  completedCount: 0,
  failedCount: 0
}

/**
 * Create Teammate
 * 
 * 创建队友
 * 
 * 借鉴 Claude Code 的 teammateInit()
 */
export function createTeammate(
  role: TeammateRole,
  task: string,
  backendType?: SwarmBackendType,
  model?: string
): Teammate {
  const teammateId = `teammate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const sessionId = `session_${teammateId}`
  
  const backend = selectBackend(backendType)
  
  const teammate: Teammate = {
    teammateId,
    sessionId,
    role,
    task,
    status: 'idle',
    createdAt: Date.now(),
    backendType: backend?.backendType ?? 'in_process',
    model: model ?? backend?.models?.[0]
  }
  
  teammates.push(teammate)
  teammateLayout.teammates = teammates
  
  return teammate
}

/**
 * Start Teammate
 * 
 * 启动队友执行
 * 
 * 借鉴 Claude Code 的 spawnUtils()
 */
export async function startTeammate(teammate: Teammate): Promise<void> {
  teammate.status = 'running'
  teammate.startedAt = Date.now()
  
  // 创建追踪链
  const chainId = sessionTracing.createChildChain(teammate.sessionId)
  teammate.chainId = chainId
  
  // 更新布局
  teammateLayout.runningCount++
  
  // 实际执行需要使用 sessions_spawn
  // 这里是占位
  
  sessionTracing.recordTraceEvent('fork_agent', `Teammate started: ${teammate.role}`, {
    teammateId: teammate.teammateId,
    role: teammate.role,
    task: teammate.task
  })
}

/**
 * Complete Teammate
 * 
 * 完成队友执行
 */
export function completeTeammate(
  teammateId: string,
  result: string,
  messages?: unknown[]
): void {
  const teammate = teammates.find(t => t.teammateId === teammateId)
  
  if (!teammate) {
    return
  }
  
  teammate.status = 'completed'
  teammate.completedAt = Date.now()
  teammate.result = result
  teammate.messages = messages
  
  // 结束追踪链
  sessionTracing.endTraceChain()
  
  // 更新布局
  teammateLayout.runningCount--
  teammateLayout.completedCount++
  
  sessionTracing.recordTraceEvent('fork_agent_completed', `Teammate completed: ${teammate.role}`, {
    teammateId: teammate.teammateId,
    result,
    durationMs: teammate.completedAt - (teammate.startedAt ?? teammate.createdAt)
  })
}

/**
 * Fail Teammate
 * 
 * 队友执行失败
 */
export function failTeammate(teammateId: string, error: string): void {
  const teammate = teammates.find(t => t.teammateId === teammateId)
  
  if (!teammate) {
    return
  }
  
  teammate.status = 'failed'
  teammate.completedAt = Date.now()
  teammate.result = error
  
  // 结束追踪链
  sessionTracing.endTraceChain()
  
  // 更新布局
  teammateLayout.runningCount--
  teammateLayout.failedCount++
  
  sessionTracing.recordTraceEvent('error_occurred', `Teammate failed: ${teammate.role}`, {
    teammateId: teammate.teammateId,
    error
  })
}

/**
 * Get Teammates
 */
export function getTeammates(): Teammate[] {
  return [...teammates]
}

/**
 * Get Running Teammates
 */
export function getRunningTeammates(): Teammate[] {
  return teammates.filter(t => t.status === 'running')
}

/**
 * Get Teammate Layout
 */
export function getTeammateLayout(): TeammateLayout {
  return { ...teammateLayout }
}

// ============================================================================
// Reconnection Mechanism
// ============================================================================

/**
 * Reconnection State - 重连状态
 * 
 * 借鉴 Claude Code 的 reconnection.ts
 */
export interface ReconnectionState {
  /** 是否正在重连 */
  isReconnecting: boolean
  /** 重连次数 */
  attemptCount: number
  /** 最大重连次数 */
  maxAttempts: number
  /** 上次重连时间 */
  lastAttemptTime?: number
  /** 重连间隔（ms） */
  retryIntervalMs: number
  /** 是否应该重连 */
  shouldReconnect: boolean
  /** 断开原因 */
  disconnectReason?: string
}

// 重连状态（全局状态）
let reconnectionState: ReconnectionState = {
  isReconnecting: false,
  attemptCount: 0,
  maxAttempts: 3,
  retryIntervalMs: 5000,
  shouldReconnect: true
}

/**
 * Handle Disconnect
 * 
 * 处理断连
 */
export function handleDisconnect(reason: string): void {
  reconnectionState.disconnectReason = reason
  
  if (reconnectionState.shouldReconnect && reconnectionState.attemptCount < reconnectionState.maxAttempts) {
    startReconnection()
  }
}

/**
 * Start Reconnection
 * 
 * 开始重连
 */
export async function startReconnection(): Promise<boolean> {
  reconnectionState.isReconnecting = true
  reconnectionState.attemptCount++
  reconnectionState.lastAttemptTime = Date.now()
  
  // 实际重连逻辑（占位）
  // await reconnectToBackend()
  
  // 模拟重连成功
  const success = true
  
  if (success) {
    reconnectionState.isReconnecting = false
    reconnectionState.attemptCount = 0
    reconnectionState.disconnectReason = undefined
    
    sessionTracing.recordTraceEvent('heartbeat', 'Reconnection successful')
    
    return true
  } else {
    // 重连失败，等待下次尝试
    if (reconnectionState.attemptCount >= reconnectionState.maxAttempts) {
      reconnectionState.isReconnecting = false
      reconnectionState.shouldReconnect = false
      
      sessionTracing.recordTraceEvent('error_occurred', 'Reconnection failed after max attempts')
    }
    
    return false
  }
}

/**
 * Get Reconnection State
 */
export function getReconnectionState(): ReconnectionState {
  return { ...reconnectionState }
}

/**
 * Reset Reconnection
 */
export function resetReconnection(): void {
  reconnectionState = {
    isReconnecting: false,
    attemptCount: 0,
    maxAttempts: 3,
    retryIntervalMs: 5000,
    shouldReconnect: true
  }
}

// ============================================================================
// Swarm Orchestration
// ============================================================================

/**
 * Swarm Plan - Swarm 执行计划
 */
export interface SwarmPlan {
  /** 计划 ID */
  planId: string
  /** 主任务 */
  mainTask: string
  /** 子任务列表 */
  subtasks: Array<{
    role: TeammateRole
    task: string
    dependencies?: string[]
    priority?: number
  }>
  /** 布局类型 */
  layoutType: 'parallel' | 'sequential' | 'hierarchical'
  /** 最大并发 */
  maxConcurrency: number
  /** 创建时间 */
  createdAt: number
  /** 状态 */
  status: 'planning' | 'running' | 'completed' | 'failed'
}

/**
 * Create Swarm Plan
 * 
 * 创建 Swarm 执行计划
 */
export function createSwarmPlan(
  mainTask: string,
  subtasks: SwarmPlan['subtasks'],
  layoutType: SwarmPlan['layoutType'] = 'parallel',
  maxConcurrency: number = 3
): SwarmPlan {
  const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  
  return {
    planId,
    mainTask,
    subtasks,
    layoutType,
    maxConcurrency,
    createdAt: Date.now(),
    status: 'planning'
  }
}

/**
 * Execute Swarm Plan
 * 
 * 执行 Swarm 计划
 * 
 * 流程：
 * 1. 为每个子任务创建队友
 * 2. 根据布局类型启动执行
 * 3. 监控执行状态
 * 4. 收集结果
 */
export async function executeSwarmPlan(plan: SwarmPlan): Promise<{
  success: boolean
  results: Array<{ teammateId: string; role: TeammateRole; result: string }>
  durationMs: number
}> {
  const startTime = Date.now()
  plan.status = 'running'
  
  const results: Array<{ teammateId: string; role: TeammateRole; result: string }> = []
  
  // 创建队友
  for (const subtask of plan.subtasks) {
    const teammate = createTeammate(subtask.role, subtask.task)
    results.push({
      teammateId: teammate.teammateId,
      role: teammate.role,
      result: ''
    })
  }
  
  // 根据布局类型执行
  if (plan.layoutType === 'parallel') {
    // 并行执行（同时启动所有）
    const runningTeammates = getTeammates().slice(-plan.subtasks.length)
    
    // 启动（限制并发）
    const chunks: Teammate[][] = []
    for (let i = 0; i < runningTeammates.length; i += plan.maxConcurrency) {
      chunks.push(runningTeammates.slice(i, i + plan.maxConcurrency))
    }
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(async (t) => {
        await startTeammate(t)
        // 模拟执行
        await new Promise(resolve => setTimeout(resolve, 1000))
        completeTeammate(t.teammateId, `Task completed: ${t.task}`)
        
        // 更新结果
        const resultEntry = results.find(r => r.teammateId === t.teammateId)
        if (resultEntry) {
          resultEntry.result = `Task completed: ${t.task}`
        }
      }))
    }
  } else if (plan.layoutType === 'sequential') {
    // 顺序执行（一个接一个）
    const runningTeammates = getTeammates().slice(-plan.subtasks.length)
    
    for (const teammate of runningTeammates) {
      await startTeammate(teammate)
      // 模拟执行
      await new Promise(resolve => setTimeout(resolve, 1000))
      completeTeammate(teammate.teammateId, `Task completed: ${teammate.task}`)
      
      // 更新结果
      const resultEntry = results.find(r => r.teammateId === teammate.teammateId)
      if (resultEntry) {
        resultEntry.result = `Task completed: ${teammate.task}`
      }
    }
  }
  
  plan.status = 'completed'
  
  const durationMs = Date.now() - startTime
  
  return {
    success: true,
    results,
    durationMs
  }
}

// ============================================================================
// Export
// ============================================================================

export const swarmService = {
// Backend
  detectBackends,
  registerBackend,
  getBackendRegistry,
  getAvailableBackends,
  selectBackend,
  
  // Teammate
  createTeammate,
  startTeammate,
  completeTeammate,
  failTeammate,
  getTeammates,
  getRunningTeammates,
  getTeammateLayout,
  
  // Reconnection
  handleDisconnect,
  startReconnection,
  getReconnectionState,
  resetReconnection,
  
  // Orchestration
  createSwarmPlan,
  executeSwarmPlan,
  
  // Types
}

// Types (moved to separate export)


export default swarmService