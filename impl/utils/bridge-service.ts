/**
 * Bridge Service - 远程协作桥接系统
 * 
 * 借鉴 Claude Code 的 Bridge 系统：
 * - bridge/bridgeApi.ts - API 接口
 * - bridge/bridgeMessaging.ts - 消息系统
 * - bridge/bridgePermissionCallbacks.ts - 权限回调
 * - bridge/capacityWake.ts - 容量唤醒
 * - bridge/reconnection.ts - 重连机制
 * 
 * OpenClaw 适配：
 * - 飞书远程协作
 * - 多设备同步
 * - 云端会话恢复
 */

import { sessionTracing } from './session-tracing'

// ============================================================================
// Bridge Types
// ============================================================================

/**
 * Bridge Connection State - 连接状态
 * 
 * 借鉴 Claude Code 的 BridgeState
 */
export type BridgeConnectionState =
  | 'disconnected'   // 未连接
  | 'connecting'     // 正在连接
  | 'connected'      // 已连接
  | 'reconnecting'   // 正在重连
  | 'error'          // 错误

/**
 * Bridge Mode - 桥接模式
 */
export type BridgeMode =
  | 'local'          // 本地模式（无远程）
  | 'remote'         // 远程模式（SSH）
  | 'cloud'          // 云端模式（Claude.ai）
  | 'hybrid'         // 混合模式

/**
 * Bridge Configuration - 桥接配置
 */
export interface BridgeConfig {
  /** 桥接模式 */
  mode: BridgeMode
  /** 远程地址 */
  remoteAddress?: string
  /** 远程端口 */
  remotePort?: number
  /** 认证方式 */
  authMethod?: 'ssh_key' | 'password' | 'jwt'
  /** 认证凭证 */
  authCredentials?: string
  /** 容量（并发数） */
  capacity?: number
  /** 超时时间（ms） */
  timeoutMs?: number
  /** 是否启用重连 */
  enableReconnection?: boolean
  /** 最大重连次数 */
  maxReconnectAttempts?: number
}

/**
 * Bridge Session - 桥接会话
 */
export interface BridgeSession {
  /** 会话 ID */
  sessionId: string
  /** 会话来源 */
  source: 'local' | 'remote' | 'cloud'
  /** 创建时间 */
  createdAt: number
  /** 最后活跃时间 */
  lastActiveAt: number
  /** 会话状态 */
  status: 'active' | 'paused' | 'ended'
  /** 用户 ID */
  userId?: string
  /** 设备 ID */
  deviceId?: string
  /** 通道 */
  channel?: string
  /** 会话数据 */
  sessionData?: Record<string, unknown>
  /** 权限上下文 */
  permissionContext?: Record<string, unknown>
}

/**
 * Bridge Message - 桥接消息
 * 
 * 借鉴 Claude Code 的 BridgeMessaging
 */
export interface BridgeMessage {
  /** 消息 ID */
  messageId: string
  /** 消息类型 */
  messageType: 'request' | 'response' | 'notification' | 'error'
  /** 消息方向 */
  direction: 'inbound' | 'outbound'
  /** 来源 */
  source: 'local' | 'remote' | 'cloud'
  /** 目标 */
  target: 'local' | 'remote' | 'cloud'
  /** 时间戳 */
  timestamp: number
  /** 会话 ID */
  sessionId?: string
  /** 消息内容 */
  content: unknown
  /** 是否需要响应 */
  requiresResponse?: boolean
  /** 响应超时（ms） */
  responseTimeout?: number
  /** 相关消息 ID */
  relatedMessageId?: string
}

// ============================================================================
// Bridge State Management
// ============================================================================

// 桥接状态（全局状态）
let bridgeState: {
  connectionState: BridgeConnectionState
  mode: BridgeMode
  config: BridgeConfig
  sessions: Map<string, BridgeSession>
  messages: BridgeMessage[]
  lastConnected?: number
  lastError?: string
} = {
  connectionState: 'disconnected',
  mode: 'local',
  config: { mode: 'local' },
  sessions: new Map(),
  messages: [],
  lastConnected: undefined,
  lastError: undefined
}

/**
 * Get Bridge State
 */
export function getBridgeState(): typeof bridgeState {
  return {
    ...bridgeState,
    sessions: new Map(bridgeState.sessions),
    messages: [...bridgeState.messages]
  }
}

/**
 * Set Bridge Config
 * 
 * 设置桥接配置
 */
export function setBridgeConfig(config: Partial<BridgeConfig>): void {
  bridgeState.config = {
    ...bridgeState.config,
    ...config
  }
  bridgeState.mode = config.mode ?? bridgeState.mode
}

// ============================================================================
// Connection Management
// ============================================================================

/**
 * Connect Bridge
 * 
 * 连接桥接
 * 
 * 借鉴 Claude Code 的 bridgeMain.ts
 */
export async function connectBridge(): Promise<boolean> {
  bridgeState.connectionState = 'connecting'
  
  try {
    const config = bridgeState.config
    
    // 根据模式执行连接
    switch (config.mode) {
      case 'local':
        // 本地模式（无需连接）
        bridgeState.connectionState = 'connected'
        bridgeState.lastConnected = Date.now()
        return true
      
      case 'remote':
        // 远程模式（SSH 连接）
        // 实际实现需要 SSH 连接
        // 这里是占位
        const remoteConnected = true  // await sshConnect(config)
        
        if (remoteConnected) {
          bridgeState.connectionState = 'connected'
          bridgeState.lastConnected = Date.now()
          return true
        } else {
          bridgeState.connectionState = 'error'
          bridgeState.lastError = 'Remote connection failed'
          return false
        }
      
      case 'cloud':
        // 云端模式（API 连接）
        // 实际实现需要 JWT 认证
        // 这里是占位
        const cloudConnected = true  // await cloudConnect(config)
        
        if (cloudConnected) {
          bridgeState.connectionState = 'connected'
          bridgeState.lastConnected = Date.now()
          return true
        } else {
          bridgeState.connectionState = 'error'
          bridgeState.lastError = 'Cloud connection failed'
          return false
        }
      
      case 'hybrid':
        // 混合模式（先本地，后远程）
        bridgeState.connectionState = 'connected'
        bridgeState.lastConnected = Date.now()
        return true
      
      default:
        bridgeState.connectionState = 'error'
        bridgeState.lastError = 'Unknown bridge mode'
        return false
    }
  } catch (error) {
    bridgeState.connectionState = 'error'
    bridgeState.lastError = String(error)
    return false
  }
}

/**
 * Disconnect Bridge
 * 
 * 断开桥接
 */
export function disconnectBridge(): void {
  bridgeState.connectionState = 'disconnected'
  bridgeState.lastConnected = undefined
  
  // 结束所有会话
  for (const session of bridgeState.sessions.values()) {
    session.status = 'ended'
  }
}

/**
 * Check Bridge Health
 * 
 * 检查桥接健康状态
 */
export function checkBridgeHealth(): {
  healthy: boolean
  latencyMs?: number
  capacity?: number
  lastError?: string
} {
  if (bridgeState.connectionState !== 'connected') {
    return {
      healthy: false,
      lastError: bridgeState.lastError
    }
  }
  
  // 检查延迟（占位）
  const latencyMs = 100  // await pingBridge()
  
  // 检查容量
  const capacity = bridgeState.config.capacity ?? 10
  const activeSessions = bridgeState.sessions.size
  const availableCapacity = capacity - activeSessions
  
  return {
    healthy: latencyMs < 1000 && availableCapacity > 0,
    latencyMs,
    capacity: availableCapacity
  }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Create Bridge Session
 * 
 * 创建桥接会话
 */
export function createBridgeSession(
  source: 'local' | 'remote' | 'cloud' = 'local',
  userId?: string,
  deviceId?: string,
  channel?: string
): BridgeSession {
  const sessionId = `bridge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  
  const session: BridgeSession = {
    sessionId,
    source,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    status: 'active',
    userId,
    deviceId,
    channel
  }
  
  bridgeState.sessions.set(sessionId, session)
  
  sessionTracing.recordTraceEvent('session_start', 'Bridge session created', {
    sessionId,
    source,
    channel
  })
  
  return session
}

/**
 * Get Bridge Session
 */
export function getBridgeSession(sessionId: string): BridgeSession | undefined {
  return bridgeState.sessions.get(sessionId)
}

/**
 * Update Bridge Session
 */
export function updateBridgeSession(
  sessionId: string,
  updates: Partial<BridgeSession>
): void {
  const session = bridgeState.sessions.get(sessionId)
  
  if (session) {
    Object.assign(session, updates)
    session.lastActiveAt = Date.now()
  }
}

/**
 * End Bridge Session
 */
export function endBridgeSession(sessionId: string): void {
  const session = bridgeState.sessions.get(sessionId)
  
  if (session) {
    session.status = 'ended'
    
    sessionTracing.recordTraceEvent('session_end', 'Bridge session ended', {
      sessionId,
      durationMs: Date.now() - session.createdAt
    })
    
    bridgeState.sessions.delete(sessionId)
  }
}

/**
 * Get Active Sessions
 */
export function getActiveBridgeSessions(): BridgeSession[] {
  return Array.from(bridgeState.sessions.values())
    .filter(s => s.status === 'active')
}

// ============================================================================
// Messaging System
// ============================================================================

/**
 * Send Bridge Message
 * 
 * 发送桥接消息
 * 
 * 借鉴 Claude Code 的 inboundMessages.ts
 */
export async function sendBridgeMessage(
  content: unknown,
  target: 'local' | 'remote' | 'cloud' = 'local',
  sessionId?: string,
  requiresResponse?: boolean,
  responseTimeout?: number
): Promise<BridgeMessage> {
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  
  const message: BridgeMessage = {
    messageId,
    messageType: 'request',
    direction: 'outbound',
    source: 'local',
    target,
    timestamp: Date.now(),
    sessionId,
    content,
    requiresResponse,
    responseTimeout
  }
  
  bridgeState.messages.push(message)
  
  // 实际发送逻辑（占位）
  // await sendMessageToTarget(message)
  
  return message
}

/**
 * Receive Bridge Message
 * 
 * 接收桥接消息
 */
export function receiveBridgeMessage(message: BridgeMessage): void {
  message.direction = 'inbound'
  bridgeState.messages.push(message)
  
  // 处理消息（占位）
  // await handleMessage(message)
  
  sessionTracing.recordTraceEvent('message_received', 'Bridge message received', {
    messageId: message.messageId,
    messageType: message.messageType,
    source: message.source
  })
}

/**
 * Get Pending Messages
 * 
 * 获取待处理消息（需要响应）
 */
export function getPendingBridgeMessages(): BridgeMessage[] {
  return bridgeState.messages
    .filter(m => m.requiresResponse && m.messageType === 'request')
}

/**
 * Clear Message History
 */
export function clearBridgeMessageHistory(): void {
  bridgeState.messages = []
}

// ============================================================================
// Permission Callbacks
// ============================================================================

/**
 * Permission Callback - 权限回调
 * 
 * 借鉴 Claude Code 的 bridgePermissionCallbacks.ts
 */
export interface PermissionCallback {
  /** 回调 ID */
  callbackId: string
  /** 回调类型 */
  callbackType: 'approval' | 'denial' | 'timeout'
  /** 权限请求 */
  permissionRequest: {
    operation: string
    context: Record<string, unknown>
  }
  /** 时间戳 */
  timestamp: number
  /** 是否已处理 */
  processed: boolean
  /** 处理结果 */
  result?: 'approved' | 'denied'
  /** 处理时间 */
  processedAt?: number
}

// 权限回调队列
let permissionCallbacks: PermissionCallback[] = []

/**
 * Register Permission Callback
 * 
 * 注册权限回调
 */
export function registerPermissionCallback(
  operation: string,
  context: Record<string, unknown>
): PermissionCallback {
  const callbackId = `perm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  
  const callback: PermissionCallback = {
    callbackId,
    callbackType: 'approval',
    permissionRequest: { operation, context },
    timestamp: Date.now(),
    processed: false
  }
  
  permissionCallbacks.push(callback)
  
  return callback
}

/**
 * Process Permission Callback
 * 
 * 处理权限回调
 */
export function processPermissionCallback(
  callbackId: string,
  result: 'approved' | 'denied'
): void {
  const callback = permissionCallbacks.find(c => c.callbackId === callbackId)
  
  if (callback) {
    callback.processed = true
    callback.result = result
    callback.processedAt = Date.now()
    
    // 发送结果到远程
    // await sendPermissionResult(callback)
  }
}

/**
 * Get Pending Permission Callbacks
 */
export function getPendingPermissionCallbacks(): PermissionCallback[] {
  return permissionCallbacks.filter(c => !c.processed)
}

/**
 * Clear Permission Callbacks
 */
export function clearPermissionCallbacks(): void {
  permissionCallbacks = []
}

// ============================================================================
// Capacity Wake
// ============================================================================

/**
 * Capacity Wake State - 容量唤醒状态
 * 
 * 借鉴 Claude Code 的 capacityWake.ts
 */
export interface CapacityWakeState {
  /** 是否唤醒 */
  isAwake: boolean
  /** 当前容量 */
  currentCapacity: number
  /** 最大容量 */
  maxCapacity: number
  /** 唤醒时间 */
  wakeTime?: number
  /** 空闲时间 */
  idleTime?: number
  /** 是否应该休眠 */
  shouldSleep: boolean
  /** 最后活跃时间 */
  lastActiveTime: number
}

// 容量状态（全局状态）
let capacityState: CapacityWakeState = {
  isAwake: true,
  currentCapacity: 0,
  maxCapacity: 10,
  shouldSleep: false,
  lastActiveTime: Date.now()
}

/**
 * Wake Capacity
 * 
 * 唤醒容量
 */
export function wakeCapacity(): void {
  capacityState.isAwake = true
  capacityState.wakeTime = Date.now()
  capacityState.shouldSleep = false
  
  sessionTracing.recordTraceEvent('heartbeat', 'Capacity woke')
}

/**
 * Sleep Capacity
 * 
 * 休眠容量（节省资源）
 */
export function sleepCapacity(): void {
  capacityState.isAwake = false
  capacityState.idleTime = Date.now()
  
  sessionTracing.recordTraceEvent('heartbeat', 'Capacity sleeping')
}

/**
 * Check Capacity
 * 
 * 检查容量状态
 */
export function checkCapacity(): {
  available: boolean
  currentLoad: number
  maxCapacity: number
  utilization: number
} {
  const currentLoad = bridgeState.sessions.size
  const maxCapacity = capacityState.maxCapacity
  const utilization = currentLoad / maxCapacity
  
  return {
    available: capacityState.isAwake && currentLoad < maxCapacity,
    currentLoad,
    maxCapacity,
    utilization
  }
}

/**
 * Get Capacity State
 */
export function getCapacityState(): CapacityWakeState {
  return { ...capacityState }
}

// ============================================================================
// Export
// ============================================================================

export const bridgeService = {
// State
  getBridgeState,
  setBridgeConfig,
  
  // Connection
  connectBridge,
  disconnectBridge,
  checkBridgeHealth,
  
  // Session
  createBridgeSession,
  getBridgeSession,
  updateBridgeSession,
  endBridgeSession,
  getActiveBridgeSessions,
  
  // Messaging
  sendBridgeMessage,
  receiveBridgeMessage,
  getPendingBridgeMessages,
  clearBridgeMessageHistory,
  
  // Permission
  registerPermissionCallback,
  processPermissionCallback,
  getPendingPermissionCallbacks,
  clearPermissionCallbacks,
  
  // Capacity
  wakeCapacity,
  sleepCapacity,
  checkCapacity,
  getCapacityState,
  
  // Types
}

// Types (moved to separate export)


export default bridgeService