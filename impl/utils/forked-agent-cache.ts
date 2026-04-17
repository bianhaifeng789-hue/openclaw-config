/**
 * Forked Agent Cache - Forked Agent Cache Sharing for OpenClaw
 * 
 * 借鉴 Claude Code 的 runForkedAgent + CacheSafeParams 机制：
 * - src/utils/forkedAgent.ts 的 cache 共享
 * - createCacheSafeParams() 函数
 * - createSubagentContext() 的状态隔离
 * 
 * OpenClaw 适配：
 * - 包装 sessions_spawn 提供 cache 共享能力
 * - 保存 cache 关键参数供后续 fork 使用
 * - 减少后台任务的 token 消耗
 */

// Cache Safe Params 类型定义（借鉴 Claude Code）
export interface CacheSafeParams {
  /** System prompt - must match parent for cache hits */
  systemPrompt: string
  /** User context - prepended to messages, affects cache */
  userContext: Record<string, string>
  /** System context - appended to system prompt, affects cache */
  systemContext: Record<string, string>
  /** Model identifier - affects cache key */
  model: string
  /** Parent context messages for prompt cache sharing */
  forkContextMessages: Array<{
    role: 'user' | 'assistant'
    content: string | Array<unknown>
  }>
  /** Thinking config - affects cache key */
  thinkingConfig?: {
    enabled: boolean
    budgetTokens?: number
  }
}

// Forked Agent 运行参数
export interface ForkedAgentParams {
  /** 任务内容 */
  task: string
  /** Cache safe params (from parent session) */
  cacheSafeParams?: CacheSafeParams
  /** 运行时类型 */
  runtime?: 'subagent' | 'acp'
  /** 模式 */
  mode?: 'run' | 'session'
  /** 标签 */
  label?: string
  /** 最大输出 tokens（注意：会改变 cache key） */
  maxOutputTokens?: number
  /** 最大轮次 */
  maxTurns?: number
  /** 是否跳过 cache 写入（fire-and-forget） */
  skipCacheWrite?: boolean
  /** 回调函数 */
  onMessage?: (message: unknown) => void
}

// Forked Agent 运行结果
export interface ForkedAgentResult {
  /** 输出消息 */
  messages: Array<unknown>
  /** 累计 usage */
  totalUsage: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
    cacheCreateTokens: number
  }
  /** 执行时长 */
  durationMs: number
  /** 会话 ID */
  sessionKey?: string
}

// 全局 cache safe params 存储
let lastCacheSafeParams: CacheSafeParams | null = null

/**
 * Save CacheSafeParams for later fork usage
 * 
 * 借鉴 Claude Code 的 saveCacheSafeParams()
 * 在采样后保存参数供 post-turn hooks 使用
 */
export function saveCacheSafeParams(params: CacheSafeParams | null): void {
  lastCacheSafeParams = params
  
  // 同时保存到文件（持久化）
  if (params) {
    try {
      const statePath = getCacheStatePath()
      const state = {
        lastCacheSafeParams: params,
        savedAt: Date.now()
      }
      // 使用 Bun 或 Node 的 fs 模块写入
      // 实际实现时需要根据环境选择合适的写入方式
      saveCacheState(statePath, state)
    } catch (e) {
      // 静默失败（不影响主流程）
      console.debug('Failed to save cache state:', e)
    }
  }
}

/**
 * Get last saved CacheSafeParams
 * 
 * 借鉴 Claude Code 的 getLastCacheSafeParams()
 */
export function getLastCacheSafeParams(): CacheSafeParams | null {
  // 先检查内存缓存
  if (lastCacheSafeParams) {
    return lastCacheSafeParams
  }
  
  // 尝试从文件恢复
  try {
    const statePath = getCacheStatePath()
    const state = loadCacheState(statePath)
    if (state?.lastCacheSafeParams) {
      lastCacheSafeParams = state.lastCacheSafeParams
      return lastCacheSafeParams
    }
  } catch (e) {
    // 静默失败
    console.debug('Failed to load cache state:', e)
  }
  
  return null
}

/**
 * Create CacheSafeParams from current session context
 * 
 * 借鉴 Claude Code 的 createCacheSafeParams(context)
 * 
 * 注意：OpenClaw 的 message 工具和 sessions_spawn 机制不同
 * 需要在实际使用时从当前会话提取这些参数
 */
export function createCacheSafeParams(
  context: {
    systemPrompt?: string
    userContext?: Record<string, string>
    systemContext?: Record<string, string>
    model?: string
    messages?: Array<{ role: 'user' | 'assistant'; content: string | Array<unknown> }>
    thinkingConfig?: { enabled: boolean; budgetTokens?: number }
  }
): CacheSafeParams {
  return {
    systemPrompt: context.systemPrompt ?? '',
    userContext: context.userContext ?? {},
    systemContext: context.systemContext ?? {},
    model: context.model ?? 'default',
    forkContextMessages: context.messages ?? [],
    thinkingConfig: context.thinkingConfig
  }
}

/**
 * Run Forked Agent with Cache Sharing
 * 
 * 借鉴 Claude Code 的 runForkedAgent()
 * 
 * 关键机制：
 * 1. 使用父会话的 CacheSafeParams 共享 prompt cache
 * 2. 创建隔离的子代理上下文
 * 3. 追踪 usage metrics
 * 
 * OpenClaw 适配：
 * - 如果有 cacheSafeParams，传递给 sessions_spawn
 * - 否则，使用普通的 sessions_spawn
 */
export async function runForkedAgent(
  params: ForkedAgentParams
): Promise<ForkedAgentResult> {
  const startTime = Date.now()
  const outputMessages: Array<unknown> = []
  let totalUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreateTokens: 0
  }
  
  // 检查是否有 cache safe params
  const cacheParams = params.cacheSafeParams ?? getLastCacheSafeParams()
  const hasCacheParams = cacheParams !== null
  
  // 构建 spawn 参数
  const spawnParams = {
    task: params.task,
    runtime: params.runtime ?? 'subagent',
    mode: params.mode ?? 'run',
    label: params.label,
    // 如果有 cache params，传递关键信息
    // 注意：这需要 sessions_spawn 支持这些参数
    // 当前 OpenClaw 可能不支持，需要后续扩展
    ...(hasCacheParams && cacheParams ? {
      // 传递 cache 相关参数
      // 实际实现需要根据 sessions_spawn 的 API 设计
      systemPrompt: cacheParams.systemPrompt,
      model: cacheParams.model,
      // forkContextMessages 可以用于共享 prefix cache
      forkContextMessages: cacheParams.forkContextMessages.slice(-10)  // 只取最近10条
    } : {})
  }
  
  // 实际运行需要使用 sessions_spawn 工具
  // 这里只是类型定义和参数准备
  // 实际调用需要通过 message tool 或 sessions_spawn
  
  const durationMs = Date.now() - startTime
  
  // 返回结果（占位）
  return {
    messages: outputMessages,
    totalUsage,
    durationMs,
    sessionKey: undefined  // sessions_spawn 会返回这个
  }
}

/**
 * Create isolated subagent context
 * 
 * 借鉴 Claude Code 的 createSubagentContext(parentContext, overrides)
 * 
 * 关键点：
 * - 所有可变状态都被隔离，防止污染父会话
 * - readFileState: 克隆
 * - abortController: 新建子控制器
 * - mutation callbacks: no-op
 */
export function createSubagentContext(
  parentContext: {
    readFileState?: unknown
    abortController?: AbortController
    getAppState?: () => unknown
    setAppState?: (updater: (prev: unknown) => unknown) => void
    options?: unknown
    messages?: Array<unknown>
  },
  overrides?: {
    options?: unknown
    agentId?: string
    messages?: Array<unknown>
    readFileState?: unknown
    abortController?: AbortController
    getAppState?: () => unknown
    shareSetAppState?: boolean
    shareAbortController?: boolean
  }
): unknown {
  // 创建隔离的上下文
  return {
    // 可变状态 - 克隆以保持隔离
    readFileState: overrides?.readFileState ?? cloneReadFileState(parentContext.readFileState),
    
    // AbortController: override > share parent > new child
    abortController: overrides?.abortController ?? 
      (overrides?.shareAbortController 
        ? parentContext.abortController 
        : createChildAbortController(parentContext.abortController)),
    
    // AppState access
    getAppState: overrides?.getAppState ?? parentContext.getAppState ?? (() => {}),
    setAppState: overrides?.shareSetAppState 
      ? parentContext.setAppState 
      : () => {},
    
    // 其他字段从 parent 复制或 override
    options: overrides?.options ?? parentContext.options,
    messages: overrides?.messages ?? parentContext.messages ?? [],
    
    // 新的 agentId（每个子代理都应该有自己的 ID）
    agentId: overrides?.agentId ?? generateAgentId(),
    
    // 新的 query tracking chain
    queryTracking: {
      chainId: generateUUID(),
      depth: 0  // 子代理从 0 开始
    }
  }
}

// Helper functions

function getCacheStatePath(): string {
  return 'memory/forked-agent-cache-state.json'
}

function saveCacheState(path: string, state: unknown): void {
  // 实际实现需要使用 fs.writeFileSync 或类似方法
  // 这里只是占位
}

function loadCacheState(path: string): { lastCacheSafeParams: CacheSafeParams; savedAt: number } | null {
  // 实际实现需要使用 fs.readFileSync 或类似方法
  // 这里只是占位
  return null
}

function cloneReadFileState(state: unknown): unknown {
  // 克隆文件状态缓存
  // 实际实现需要根据 readFileState 的类型深度克隆
  return state
}

function createChildAbortController(parent?: AbortController): AbortController {
  const child = new AbortController()
  
  // 如果父控制器 abort，子控制器也 abort
  if (parent) {
    parent.signal.addEventListener('abort', () => {
      child.abort(parent.signal.reason)
    })
  }
  
  return child
}

function generateAgentId(): string {
  return `fork-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function generateUUID(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// 导出
export const forkedAgentCache = {
  saveCacheSafeParams,
  getLastCacheSafeParams,
  createCacheSafeParams,
  runForkedAgent,
  createSubagentContext
}

export default forkedAgentCache