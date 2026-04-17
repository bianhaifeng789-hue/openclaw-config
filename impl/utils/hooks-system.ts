/**
 * Hooks System - React Hooks 系统适配
 * 
 * 借鉴 Claude Code 的 hooks 系统：
 * - hooks/useCanUseTool.ts - 工具权限检查
 * - hooks/useStatus.ts - 状态管理
 * - hooks/useInboxPoller.ts - 收件箱轮询
 * - hooks/useAfterFirstRender.ts - 首次渲染后执行
 * 
 * OpenClaw 适配：
 * - 非 React 环境（使用函数式适配）
 * - 飞书场景下的轮询和状态
 */

// ============================================================================
// Core Hooks (Functional Adaptation)
// ============================================================================

/**
 * useCanUseTool - 工具使用权限检查
 * 
 * 借鉴 Claude Code 的 useCanUseTool hook
 * 
 * 功能：
 * - 检查工具是否被允许使用
 * - 根据权限模式和用户偏好决定
 * - 追踪拒绝次数
 */

export interface ToolPermissionContext {
  /** 当前权限模式 */
  permissionMode: 'auto' | 'plan' | 'confirm' | 'restricted'
  /** 工具白名单 */
  allowedTools: Set<string>
  /** 工具黑名单 */
  deniedTools: Set<string>
  /** 最近拒绝次数 */
  recentDenials: number
  /** 是否应该避免权限提示 */
  shouldAvoidPermissionPrompts: boolean
}

// 权限上下文（全局状态）
let permissionContext: ToolPermissionContext = {
  permissionMode: 'confirm',
  allowedTools: new Set(),
  deniedTools: new Set(),
  recentDenials: 0,
  shouldAvoidPermissionPrompts: false
}

/**
 * Get Permission Context
 */
export function getPermissionContext(): ToolPermissionContext {
  return { ...permissionContext }
}

/**
 * Set Permission Context
 */
export function setPermissionContext(context: Partial<ToolPermissionContext>): void {
  permissionContext = {
    ...permissionContext,
    ...context
  }
}

/**
 * Can Use Tool
 * 
 * 检查是否可以使用工具
 * 
 * @param toolName - 工具名称
 * @returns 是否可以使用
 */
export function canUseTool(toolName: string): {
  allowed: boolean
  reason: string
  needsPrompt: boolean
} {
  const context = getPermissionContext()
  
  // 检查黑名单
  if (context.deniedTools.has(toolName)) {
    return {
      allowed: false,
      reason: '工具在黑名单中',
      needsPrompt: false
    }
  }
  
  // 检查白名单
  if (context.allowedTools.has(toolName)) {
    return {
      allowed: true,
      reason: '工具在白名单中',
      needsPrompt: false
    }
  }
  
  // 根据权限模式
  switch (context.permissionMode) {
    case 'auto':
      // 自动模式：所有工具都允许
      return {
        allowed: true,
        reason: '自动模式允许所有工具',
        needsPrompt: false
      }
    
    case 'plan':
      // Plan 模式：只允许读取类工具
      const readOnlyTools = ['read', 'ls', 'grep', 'find', 'cat', 'head', 'tail']
      if (readOnlyTools.includes(toolName)) {
        return {
          allowed: true,
          reason: 'Plan 模式允许只读工具',
          needsPrompt: false
        }
      }
      return {
        allowed: false,
        reason: 'Plan 模式禁止写入工具',
        needsPrompt: true
      }
    
    case 'confirm':
      // Confirm 模式：需要确认
      if (context.shouldAvoidPermissionPrompts) {
        return {
          allowed: true,
          reason: '避免权限提示模式',
          needsPrompt: false
        }
      }
      return {
        allowed: true,
        reason: '需要用户确认',
        needsPrompt: true
      }
    
    case 'restricted':
      // Restricted 模式：只允许白名单工具
      return {
        allowed: context.allowedTools.has(toolName),
        reason: context.allowedTools.has(toolName)
          ? '白名单工具'
          : '非白名单工具，禁止',
        needsPrompt: false
      }
    
    default:
      return {
        allowed: false,
        reason: '未知权限模式',
        needsPrompt: true
      }
  }
}

// ============================================================================
// Status Management
// ============================================================================

/**
 * useStatus - 状态管理
 * 
 * 借鉴 Claude Code 的 useStatus hook
 * 
 * 功能：
 * - 管理会话状态
 * - 追踪当前操作
 * - 提供状态变更通知
 */

export type StatusState =
  | 'idle'          // 空闲
  | 'thinking'      // 思考中
  | 'executing'     // 执行工具
  | 'waiting_input' // 等待用户输入
  | 'compacting'    // 压缩上下文
  | 'error'         // 错误

export interface StatusContext {
  /** 当前状态 */
  status: StatusState
  /** 状态描述 */
  description?: string
  /** 当前工具（如果 executing） */
  currentTool?: string
  /** 开始时间 */
  startTime: number
  /** 状态变更历史 */
  history: Array<{ status: StatusState; timestamp: number; durationMs?: number }>
}

// 状态上下文（全局状态）
let statusContext: StatusContext = {
  status: 'idle',
  startTime: Date.now(),
  history: []
}

// 状态变更监听器
const statusListeners: Array<(status: StatusContext) => void> = []

/**
 * Get Status
 */
export function getStatus(): StatusContext {
  return { ...statusContext }
}

/**
 * Set Status
 * 
 * 设置状态并通知监听器
 */
export function setStatus(
  status: StatusState,
  description?: string,
  currentTool?: string
): void {
  const previousStatus = statusContext.status
  const previousStartTime = statusContext.startTime
  
  // 记录历史
  const historyEntry = {
    status: previousStatus,
    timestamp: previousStartTime,
    durationMs: Date.now() - previousStartTime
  }
  
  statusContext = {
    status,
    description,
    currentTool,
    startTime: Date.now(),
    history: [...statusContext.history, historyEntry]
  }
  
  // 通知监听器
  for (const listener of statusListeners) {
    listener(statusContext)
  }
}

/**
 * Subscribe Status Changes
 * 
 * 订阅状态变更
 */
export function subscribeStatus(listener: (status: StatusContext) => void): () => void {
  statusListeners.push(listener)
  
  // 返回取消订阅函数
  return () => {
    const index = statusListeners.indexOf(listener)
    if (index > -1) {
      statusListeners.splice(index, 1)
    }
  }
}

// ============================================================================
// Inbox Poller
// ============================================================================

/**
 * useInboxPoller - 收件箱轮询
 * 
 * 借鉴 Claude Code 的 useInboxPoller hook
 * 
 * 功能：
 * - 定期检查飞书收件箱
 * - 检测新消息
 * - 触发消息处理
 */

export interface InboxPollerContext {
  /** 是否正在轮询 */
  isPolling: boolean
  /** 轮询间隔（ms） */
  pollInterval: number
  /** 上次检查时间 */
  lastPollTime: number
  /** 发现的新消息数 */
  newMessagesCount: number
  /** 是否有错误 */
  hasError: boolean
  /** 错误信息 */
  error?: string
}

// 轮询上下文（全局状态）
let pollerContext: InboxPollerContext = {
  isPolling: false,
  pollInterval: 30_000,  // 30 秒
  lastPollTime: 0,
  newMessagesCount: 0,
  hasError: false
}

// 轮询任务
let pollerTask: ReturnType<typeof setInterval> | null = null

// 消息处理器
const messageHandlers: Array<(messages: unknown[]) => Promise<void>> = []

/**
 * Start Inbox Poller
 * 
 * 启动收件箱轮询
 */
export function startInboxPoller(
  pollInterval: number = 30_000
): void {
  if (pollerContext.isPolling) {
    return  // 已经在轮询
  }
  
  pollerContext.isPolling = true
  pollerContext.pollInterval = pollInterval
  
  // 开始轮询任务
  pollerTask = setInterval(async () => {
    try {
      await pollInbox()
    } catch (error) {
      pollerContext.hasError = true
      pollerContext.error = String(error)
    }
  }, pollInterval)
}

/**
 * Stop Inbox Poller
 * 
 * 停止收件箱轮询
 */
export function stopInboxPoller(): void {
  if (pollerTask) {
    clearInterval(pollerTask)
    pollerTask = null
  }
  
  pollerContext.isPolling = false
}

/**
 * Poll Inbox
 * 
 * 执行收件箱检查
 */
async function pollInbox(): Promise<void> {
  pollerContext.lastPollTime = Date.now()
  
  // 实际实现需要调用飞书 API
  // 这里是占位
  const messages: unknown[] = []  // await fetchNewMessages()
  
  if (messages.length > 0) {
    pollerContext.newMessagesCount += messages.length
    
    // 触发消息处理器
    for (const handler of messageHandlers) {
      await handler(messages)
    }
  }
  
  pollerContext.hasError = false
  pollerContext.error = undefined
}

/**
 * Register Message Handler
 * 
 * 注册消息处理器
 */
export function registerMessageHandler(
  handler: (messages: unknown[]) => Promise<void>
): () => void {
  messageHandlers.push(handler)
  
  return () => {
    const index = messageHandlers.indexOf(handler)
    if (index > -1) {
      messageHandlers.splice(index, 1)
    }
  }
}

/**
 * Get Poller Context
 */
export function getPollerContext(): InboxPollerContext {
  return { ...pollerContext }
}

// ============================================================================
// After First Render
// ============================================================================

/**
 * useAfterFirstRender - 首次渲染后执行
 * 
 * 借鉴 Claude Code 的 useAfterFirstRender hook
 * 
 * 功能：
 * - 在首次"渲染"后执行回调
 * - 用于初始化和延迟任务
 */

let hasRendered = false
const afterRenderCallbacks: Array<() => void | Promise<void>> = []

/**
 * Mark First Render
 * 
 * 标记首次渲染完成
 */
export function markFirstRender(): void {
  if (hasRendered) {
    return
  }
  
  hasRendered = true
  
  // 执行所有回调
  for (const callback of afterRenderCallbacks) {
    callback()
  }
  
  // 清空回调列表
  afterRenderCallbacks.length = 0
}

/**
 * After First Render
 * 
 * 注册首次渲染后执行的回调
 */
export function afterFirstRender(callback: () => void | Promise<void>): void {
  if (hasRendered) {
    // 已经渲染过了，立即执行
    callback()
  } else {
    // 添加到队列
    afterRenderCallbacks.push(callback)
  }
}

// ============================================================================
// Virtual Scroll (Adapted for Lists)
// ============================================================================

/**
 * useVirtualScroll - 虚拟滚动适配
 * 
 * 借鉴 Claude Code 的 useVirtualScroll hook
 * 
 * 功能：
 * - 大列表的性能优化
 * - 只渲染可见区域
 */

export interface VirtualScrollConfig {
  /** 总项目数 */
  itemCount: number
  /** 每个项目高度 */
  itemHeight: number
  /** 容器高度 */
  containerHeight: number
  /** overscan（额外渲染的项目数） */
  overscan?: number
}

export interface VirtualScrollResult {
  /** 可见项目索引 */
  visibleIndices: number[]
  /** 开始索引 */
  startIndex: number
  /** 结束索引 */
  endIndex: number
  /** 偏移量 */
  offsetY: number
}

/**
 * Calculate Virtual Scroll
 * 
 * 计算虚拟滚动参数
 */
export function calculateVirtualScroll(
  scrollTop: number,
  config: VirtualScrollConfig
): VirtualScrollResult {
  const overscan = config.overscan ?? 3
  
  const startIndex = Math.max(0, Math.floor(scrollTop / config.itemHeight) - overscan)
  const endIndex = Math.min(
    config.itemCount - 1,
    Math.floor((scrollTop + config.containerHeight) / config.itemHeight) + overscan
  )
  
  const visibleIndices = []
  for (let i = startIndex; i <= endIndex; i++) {
    visibleIndices.push(i)
  }
  
  const offsetY = startIndex * config.itemHeight
  
  return {
    visibleIndices,
    startIndex,
    endIndex,
    offsetY
  }
}

// ============================================================================
// Typeahead
// ============================================================================

/**
 * useTypeahead - 自动补全适配
 * 
 * 借鉴 Claude Code 的 useTypeahead hook
 * 
 * 功能：
 * - 提供补全建议
 * - 处理键盘导航
 */

export interface TypeaheadOption {
  /** 选项 ID */
  id: string
  /** 显示文本 */
  label: string
  /** 选项值 */
  value: string
  /** 描述 */
  description?: string
  /** 匹配分数 */
  score?: number
}

export interface TypeaheadResult {
  /** 匹配的选项 */
  options: TypeaheadOption[]
  /** 高亮索引 */
  highlightedIndex: number
  /** 是否有匹配 */
  hasMatch: boolean
}

/**
 * Match Typeahead
 * 
 * 匹配补全选项
 */
export function matchTypeahead(
  query: string,
  allOptions: TypeaheadOption[]
): TypeaheadResult {
  const queryLower = query.toLowerCase()
  
  // 计算匹配分数
  const scoredOptions = allOptions.map(option => {
    const labelLower = option.label.toLowerCase()
    const valueLower = option.value.toLowerCase()
    
    // 完全匹配最高
    if (labelLower === queryLower || valueLower === queryLower) {
      return { ...option, score: 100 }
    }
    
    // 开头匹配
    if (labelLower.startsWith(queryLower) || valueLower.startsWith(queryLower)) {
      return { ...option, score: 80 }
    }
    
    // 包含匹配
    if (labelLower.includes(queryLower) || valueLower.includes(queryLower)) {
      return { ...option, score: 60 }
    }
    
    // 不匹配
    return { ...option, score: 0 }
  })
  
  // 过滤和排序
  const options = scoredOptions
    .filter(o => o.score > 0)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  
  return {
    options,
    highlightedIndex: 0,
    hasMatch: options.length > 0
  }
}

// ============================================================================
// Cancel Request
// ============================================================================

/**
 * useCancelRequest - 取消请求
 * 
 * 借鉴 Claude Code 的 useCancelRequest hook
 * 
 * 功能：
 * - 提供取消当前请求的能力
 * - 与 AbortController 整合
 */

export interface CancelRequestContext {
  /** 是否可以取消 */
  canCancel: boolean
  /** 是否已取消 */
  isCancelled: boolean
  /** AbortController */
  abortController?: AbortController
}

// 取消上下文（全局状态）
let cancelContext: CancelRequestContext = {
  canCancel: false,
  isCancelled: false
}

/**
 * Get Cancel Context
 */
export function getCancelContext(): CancelRequestContext {
  return { ...cancelContext }
}

/**
 * Set Can Cancel
 * 
 * 设置是否可以取消
 */
export function setCanCancel(canCancel: boolean, abortController?: AbortController): void {
  cancelContext = {
    canCancel,
    isCancelled: false,
    abortController
  }
}

/**
 * Cancel Request
 * 
 * 取消当前请求
 */
export function cancelRequest(): boolean {
  if (!cancelContext.canCancel || cancelContext.isCancelled) {
    return false
  }
  
  if (cancelContext.abortController) {
    cancelContext.abortController.abort()
  }
  
  cancelContext.isCancelled = true
  cancelContext.canCancel = false
  
  return true
}

// ============================================================================
// Blink Effect
// ============================================================================

/**
 * useBlink - 闪烁效果适配
 * 
 * 借鉴 Claude Code 的 useBlink hook
 * 
 * 功能：
 * - 提供视觉提示（闪烁）
 * - 用于错误或重要消息
 */

let blinkState = false
let blinkTask: ReturnType<typeof setInterval> | null = null
const blinkListeners: Array<(isBlinking: boolean) => void> = []

/**
 * Start Blink
 * 
 * 开始闪烁
 */
export function startBlink(intervalMs: number = 500): void {
  if (blinkTask) {
    return  // 已经在闪烁
  }
  
  blinkTask = setInterval(() => {
    blinkState = !blinkState
    
    // 通知监听器
    for (const listener of blinkListeners) {
      listener(blinkState)
    }
  }, intervalMs)
}

/**
 * Stop Blink
 * 
 * 停止闪烁
 */
export function stopBlink(): void {
  if (blinkTask) {
    clearInterval(blinkTask)
    blinkTask = null
  }
  
  blinkState = false
  
  // 通知监听器
  for (const listener of blinkListeners) {
    listener(false)
  }
}

/**
 * Subscribe Blink
 * 
 * 订阅闪烁状态
 */
export function subscribeBlink(listener: (isBlinking: boolean) => void): () => void {
  blinkListeners.push(listener)
  
  return () => {
    const index = blinkListeners.indexOf(listener)
    if (index > -1) {
      blinkListeners.splice(index, 1)
    }
  }
}

// ============================================================================
// Export
// ============================================================================

export const hooksSystem = {
// Permission
  getPermissionContext,
  setPermissionContext,
  canUseTool,
  
  // Status
  getStatus,
  setStatus,
  subscribeStatus,
  
  // Inbox Poller
  startInboxPoller,
  stopInboxPoller,
  registerMessageHandler,
  getPollerContext,
  
  // After First Render
  markFirstRender,
  afterFirstRender,
  
  // Virtual Scroll
  calculateVirtualScroll,
  
  // Typeahead
  matchTypeahead,
  
  // Cancel Request
  getCancelContext,
  setCanCancel,
  cancelRequest,
  
  // Blink
  startBlink,
  stopBlink,
  subscribeBlink,
  
  // Types
}

// Types (moved to separate export)


export default hooksSystem