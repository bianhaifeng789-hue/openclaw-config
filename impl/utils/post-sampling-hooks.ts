/**
 * Post-Sampling Hooks - 采样后钩子系统
 * 
 * 借鉴 Claude Code 的 postSamplingHooks.ts:
 * - utils/hooks/postSamplingHooks.ts 的 hook 注册和执行机制
 * - 在模型采样完成后自动执行注册的 hooks
 * - 用于触发 session memory extraction、auto dream 等
 * 
 * OpenClaw 适配：
 * - 整合到 OpenClaw 的消息处理流程
 * - 飞书场景下的自动触发
 * - 与 heartbeat 模式协同
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Query Source - 查询来源类型
 * 
 * 借鉴 Claude Code 的 QuerySource
 */
export type QuerySource =
  | 'repl_main_thread'    // 主 REPL 线程
  | 'repl_subagent'       // 子代理
  | 'repl_compact'        // Compact
  | 'repl_dream'          // Auto Dream
  | 'repl_session_memory' // Session Memory
  | 'api_request'         // API 直接请求
  | 'feishu_message'      // 飞书消息
  | 'heartbeat'           // Heartbeat 触发

/**
 * REPL Hook Context - Hook 执行上下文
 * 
 * 借鉴 Claude Code 的 REPLHookContext
 */
export interface REPLHookContext {
  /** 完整消息历史（包括 assistant responses） */
  messages: Array<{
    role: 'user' | 'assistant'
    content: string | Array<{ type: string; text?: string; tool_use_id?: string }>
    uuid?: string
  }>
  /** System prompt */
  systemPrompt: string
  /** User context (key-value pairs) */
  userContext: Record<string, string>
  /** System context (key-value pairs) */
  systemContext: Record<string, string>
  /** Tool use context */
  toolUseContext?: {
    readFileState?: Map<string, unknown>
    abortController?: AbortController
    getAppState?: () => unknown
    setAppState?: (updater: (prev: unknown) => unknown) => void
    options?: unknown
  }
  /** Query source */
  querySource?: QuerySource
  /** Timestamp */
  timestamp?: number
  /** Session ID */
  sessionId?: string
}

/**
 * Post-Sampling Hook - 采样后钩子函数类型
 */
export type PostSamplingHook = (
  context: REPLHookContext
) => Promise<void> | void

/**
 * Hook Metadata - 钩子元数据
 */
export interface HookMetadata {
  /** Hook 名称 */
  name: string
  /** Hook 描述 */
  description?: string
  /** 优先级（数字越小越先执行） */
  priority: number
  /** 是否启用 */
  enabled: boolean
  /** 执行次数 */
  executionCount: number
  /** 上次执行时间 */
  lastExecutedAt?: number
  /** 上次执行耗时 */
  lastExecutionDurationMs?: number
  /** 错误次数 */
  errorCount: number
  /** 上次错误 */
  lastError?: string
}

// ============================================================================
// Hook Registry
// ============================================================================

// Hook 注册表
const postSamplingHooks: Array<{
  hook: PostSamplingHook
  metadata: HookMetadata
}> = []

// 执行统计
let totalExecutions = 0
let totalErrors = 0

/**
 * Register Post-Sampling Hook
 * 
 * 注册采样后钩子
 * 
 * @param hook - 钩子函数
 * @param metadata - 钩子元数据（可选）
 */
export function registerPostSamplingHook(
  hook: PostSamplingHook,
  metadata?: Partial<HookMetadata>
): void {
  const hookMetadata: HookMetadata = {
    name: metadata?.name ?? `hook_${postSamplingHooks.length + 1}`,
    description: metadata?.description,
    priority: metadata?.priority ?? 100,
    enabled: metadata?.enabled ?? true,
    executionCount: 0,
    errorCount: 0
  }
  
  postSamplingHooks.push({
    hook,
    metadata: hookMetadata
  })
  
  // 按优先级排序
  postSamplingHooks.sort((a, b) => a.metadata.priority - b.metadata.priority)
}

/**
 * Clear All Post-Sampling Hooks
 * 
 * 清除所有注册的钩子（用于测试）
 */
export function clearPostSamplingHooks(): void {
  postSamplingHooks.length = 0
  totalExecutions = 0
  totalErrors = 0
}

/**
 * Get Registered Hooks
 * 
 * 获取所有注册的钩子信息
 */
export function getRegisteredHooks(): Array<HookMetadata> {
  return postSamplingHooks.map(h => ({ ...h.metadata }))
}

/**
 * Enable/Disable Hook
 * 
 * 启用或禁用指定钩子
 */
export function setHookEnabled(name: string, enabled: boolean): boolean {
  const hookEntry = postSamplingHooks.find(h => h.metadata.name === name)
  if (hookEntry) {
    hookEntry.metadata.enabled = enabled
    return true
  }
  return false
}

// ============================================================================
// Hook Execution
// ============================================================================

/**
 * Execute Post-Sampling Hooks
 * 
 * 执行所有注册的采样后钩子
 * 
 * 借鉴 Claude Code 的 executePostSamplingHooks()
 * 
 * 流程：
 * 1. 按优先级排序执行
 * 2. 每个 hook 独立执行，错误不影响其他 hooks
 * 3. 记录执行统计
 * 
 * @param context - Hook 执行上下文
 */
export async function executePostSamplingHooks(
  context: REPLHookContext
): Promise<{
  executedCount: number
  errorCount: number
  totalDurationMs: number
  hookResults: Array<{
    name: string
    success: boolean
    durationMs: number
    error?: string
  }>
}> {
  const startTime = Date.now()
  const hookResults: Array<{
    name: string
    success: boolean
    durationMs: number
    error?: string
  }> = []
  
  let executedCount = 0
  let errorCount = 0
  
  for (const { hook, metadata } of postSamplingHooks) {
    // 跳过禁用的钩子
    if (!metadata.enabled) {
      continue
    }
    
    const hookStartTime = Date.now()
    
    try {
      // 执行钩子
      await hook(context)
      
      // 记录成功
      const durationMs = Date.now() - hookStartTime
      metadata.executionCount++
      metadata.lastExecutedAt = Date.now()
      metadata.lastExecutionDurationMs = durationMs
      
      hookResults.push({
        name: metadata.name,
        success: true,
        durationMs
      })
      
      executedCount++
    } catch (error) {
      // 记录错误（但不中断其他 hooks）
      const durationMs = Date.now() - hookStartTime
      const errorMessage = String(error)
      
      metadata.executionCount++
      metadata.errorCount++
      metadata.lastError = errorMessage
      metadata.lastExecutedAt = Date.now()
      metadata.lastExecutionDurationMs = durationMs
      
      hookResults.push({
        name: metadata.name,
        success: false,
        durationMs,
        error: errorMessage
      })
      
      errorCount++
      totalErrors++
      
      // 日志记录（实际实现需要 logger）
      console.debug(`Post-sampling hook [${metadata.name}] failed:`, error)
    }
  }
  
  totalExecutions++
  
  return {
    executedCount,
    errorCount,
    totalDurationMs: Date.now() - startTime,
    hookResults
  }
}

// ============================================================================
// Built-in Hooks
// ============================================================================

/**
 * Session Memory Extraction Hook
 * 
 * Session Memory 提取钩子
 * 
 * 借鉴 Claude Code 的 extractSessionMemory
 * 
 * 触发条件：
 * - querySource === 'repl_main_thread' 或 'feishu_message'
 * - 达到 token 或 tool call 阈值
 */
export function createSessionMemoryHook(
  shouldExtract: (context: REPLHookContext) => boolean,
  extract: (context: REPLHookContext) => Promise<void>
): PostSamplingHook {
  return async (context: REPLHookContext) => {
    // 只在主线程或飞书消息时运行
    const validSources: QuerySource[] = ['repl_main_thread', 'feishu_message', 'heartbeat']
    
    if (!validSources.includes(context.querySource ?? 'repl_main_thread')) {
      return
    }
    
    // 检查是否需要提取
    if (shouldExtract(context)) {
      await extract(context)
    }
  }
}

/**
 * Cache Safe Params Save Hook
 * 
 * Cache 参数保存钩子
 * 
 * 在采样后保存 CacheSafeParams 供后续 forked agent 使用
 */
export function createCacheSaveHook(
  saveParams: (context: REPLHookContext) => void
): PostSamplingHook {
  return (context: REPLHookContext) => {
    // 保存 cache params
    saveParams(context)
  }
}

/**
 * Permission Decision Tracking Hook
 * 
 * 权限决策追踪钩子
 * 
 * 追踪用户的权限决策，用于：
 * - 统计拒绝次数
 * - 学习用户偏好
 * - 避免重复询问
 */
export function createPermissionTrackingHook(
  trackDecisions: (context: REPLHookContext) => void
): PostSamplingHook {
  return (context: REPLHookContext) => {
    // 只在主线程追踪
    if (context.querySource !== 'repl_main_thread') {
      return
    }
    
    trackDecisions(context)
  }
}

/**
 * Auto Dream Trigger Hook
 * 
 * Auto Dream 触发钩子
 * 
 * 在达到条件时触发记忆整合
 */
export function createAutoDreamHook(
  shouldDream: (context: REPLHookContext) => boolean,
  triggerDream: () => Promise<void>
): PostSamplingHook {
  return async (context: REPLHookContext) => {
    // 只在主线程检查
    if (context.querySource !== 'repl_main_thread') {
      return
    }
    
    if (shouldDream(context)) {
      await triggerDream()
    }
  }
}

// ============================================================================
// Hook State Management
// ============================================================================

/**
 * Hook State - 钩子系统状态
 */
export interface HookState {
  registeredHooks: Array<HookMetadata>
  totalExecutions: number
  totalErrors: number
  lastExecutionAt?: number
}

// 状态文件路径
const STATE_PATH = 'memory/post-sampling-hooks-state.json'

// 状态（内存缓存）
let hookState: HookState | null = null

/**
 * Get Hook State
 */
export function getHookState(): HookState {
  if (hookState) {
    return hookState
  }
  
  hookState = {
    registeredHooks: getRegisteredHooks(),
    totalExecutions,
    totalErrors,
    lastExecutionAt: undefined
  }
  
  return hookState
}

/**
 * Save Hook State
 */
export function saveHookState(): void {
  hookState = {
    registeredHooks: getRegisteredHooks(),
    totalExecutions,
    totalErrors,
    lastExecutionAt: Date.now()
  }
  
  // 实际实现需要 fs.writeFileSync(STATE_PATH, JSON.stringify(hookState))
}

// ============================================================================
// Integration Helpers
// ============================================================================

/**
 * Create Default Hooks for OpenClaw
 * 
 * 创建 OpenClaw 默认的 post-sampling hooks
 * 
 * 包括：
 * - Cache 参数保存
 * - Session Memory 提取
 * - Permission 追踪
 */
export function createDefaultHooks(): void {
  // 1. Cache 参数保存（最高优先级）
  registerPostSamplingHook(
    createCacheSaveHook((context) => {
      // 保存 cache params
      // 实际实现需要调用 forked-agent-cache 的 saveCacheSafeParams
      console.debug('Cache params saved')
    }),
    {
      name: 'cache_save',
      description: 'Save cache params for forked agent',
      priority: 1
    }
  )
  
  // 2. Permission 追踪（高优先级）
  registerPostSamplingHook(
    createPermissionTrackingHook((context) => {
      // 追踪权限决策
      console.debug('Permission decisions tracked')
    }),
    {
      name: 'permission_tracking',
      description: 'Track permission decisions',
      priority: 10
    }
  )
  
  // 3. Session Memory 提取（中优先级）
  registerPostSamplingHook(
    createSessionMemoryHook(
      (context) => {
        // 检查是否需要提取
        // 实际实现需要调用 session-memory-service 的 shouldExtractMemory
        return false  // 暂时禁用
      },
      async (context) => {
        // 执行提取
        console.debug('Session memory extraction triggered')
      }
    ),
    {
      name: 'session_memory',
      description: 'Extract session memory',
      priority: 50
    }
  )
  
  // 4. Auto Dream 触发（低优先级）
  registerPostSamplingHook(
    createAutoDreamHook(
      (context) => {
        // 检查是否需要 dream
        return false  // 暂时禁用
      },
      async () => {
        console.debug('Auto dream triggered')
      }
    ),
    {
      name: 'auto_dream',
      description: 'Trigger auto dream',
      priority: 100
    }
  )
}

// ============================================================================
// Export
// ============================================================================

export const postSamplingHooksSystem = {
// Registry
  registerPostSamplingHook,
  clearPostSamplingHooks,
  getRegisteredHooks,
  setHookEnabled,
  
  // Execution
  executePostSamplingHooks,
  
  // Built-in Hooks
  createSessionMemoryHook,
  createCacheSaveHook,
  createPermissionTrackingHook,
  createAutoDreamHook,
  createDefaultHooks,
  
  // State
  getHookState,
  saveHookState,
  
  // Types
}

// Types (moved to separate export)


export default postSamplingHooksSystem