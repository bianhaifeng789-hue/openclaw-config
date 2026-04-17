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
import { sessionTracing } from './session-tracing';
// ============================================================================
// Bridge State Management
// ============================================================================
// 桥接状态（全局状态）
let bridgeState = {
    connectionState: 'disconnected',
    mode: 'local',
    config: { mode: 'local' },
    sessions: new Map(),
    messages: [],
    lastConnected: undefined,
    lastError: undefined
};
/**
 * Get Bridge State
 */
export function getBridgeState() {
    return {
        ...bridgeState,
        sessions: new Map(bridgeState.sessions),
        messages: [...bridgeState.messages]
    };
}
/**
 * Set Bridge Config
 *
 * 设置桥接配置
 */
export function setBridgeConfig(config) {
    bridgeState.config = {
        ...bridgeState.config,
        ...config
    };
    bridgeState.mode = config.mode ?? bridgeState.mode;
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
export async function connectBridge() {
    bridgeState.connectionState = 'connecting';
    try {
        const config = bridgeState.config;
        // 根据模式执行连接
        switch (config.mode) {
            case 'local':
                // 本地模式（无需连接）
                bridgeState.connectionState = 'connected';
                bridgeState.lastConnected = Date.now();
                return true;
            case 'remote':
                // 远程模式（SSH 连接）
                // 实际实现需要 SSH 连接
                // 这里是占位
                const remoteConnected = true; // await sshConnect(config)
                if (remoteConnected) {
                    bridgeState.connectionState = 'connected';
                    bridgeState.lastConnected = Date.now();
                    return true;
                }
                else {
                    bridgeState.connectionState = 'error';
                    bridgeState.lastError = 'Remote connection failed';
                    return false;
                }
            case 'cloud':
                // 云端模式（API 连接）
                // 实际实现需要 JWT 认证
                // 这里是占位
                const cloudConnected = true; // await cloudConnect(config)
                if (cloudConnected) {
                    bridgeState.connectionState = 'connected';
                    bridgeState.lastConnected = Date.now();
                    return true;
                }
                else {
                    bridgeState.connectionState = 'error';
                    bridgeState.lastError = 'Cloud connection failed';
                    return false;
                }
            case 'hybrid':
                // 混合模式（先本地，后远程）
                bridgeState.connectionState = 'connected';
                bridgeState.lastConnected = Date.now();
                return true;
            default:
                bridgeState.connectionState = 'error';
                bridgeState.lastError = 'Unknown bridge mode';
                return false;
        }
    }
    catch (error) {
        bridgeState.connectionState = 'error';
        bridgeState.lastError = String(error);
        return false;
    }
}
/**
 * Disconnect Bridge
 *
 * 断开桥接
 */
export function disconnectBridge() {
    bridgeState.connectionState = 'disconnected';
    bridgeState.lastConnected = undefined;
    // 结束所有会话
    for (const session of bridgeState.sessions.values()) {
        session.status = 'ended';
    }
}
/**
 * Check Bridge Health
 *
 * 检查桥接健康状态
 */
export function checkBridgeHealth() {
    if (bridgeState.connectionState !== 'connected') {
        return {
            healthy: false,
            lastError: bridgeState.lastError
        };
    }
    // 检查延迟（占位）
    const latencyMs = 100; // await pingBridge()
    // 检查容量
    const capacity = bridgeState.config.capacity ?? 10;
    const activeSessions = bridgeState.sessions.size;
    const availableCapacity = capacity - activeSessions;
    return {
        healthy: latencyMs < 1000 && availableCapacity > 0,
        latencyMs,
        capacity: availableCapacity
    };
}
// ============================================================================
// Session Management
// ============================================================================
/**
 * Create Bridge Session
 *
 * 创建桥接会话
 */
export function createBridgeSession(source = 'local', userId, deviceId, channel) {
    const sessionId = `bridge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const session = {
        sessionId,
        source,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        status: 'active',
        userId,
        deviceId,
        channel
    };
    bridgeState.sessions.set(sessionId, session);
    sessionTracing.recordTraceEvent('session_start', 'Bridge session created', {
        sessionId,
        source,
        channel
    });
    return session;
}
/**
 * Get Bridge Session
 */
export function getBridgeSession(sessionId) {
    return bridgeState.sessions.get(sessionId);
}
/**
 * Update Bridge Session
 */
export function updateBridgeSession(sessionId, updates) {
    const session = bridgeState.sessions.get(sessionId);
    if (session) {
        Object.assign(session, updates);
        session.lastActiveAt = Date.now();
    }
}
/**
 * End Bridge Session
 */
export function endBridgeSession(sessionId) {
    const session = bridgeState.sessions.get(sessionId);
    if (session) {
        session.status = 'ended';
        sessionTracing.recordTraceEvent('session_end', 'Bridge session ended', {
            sessionId,
            durationMs: Date.now() - session.createdAt
        });
        bridgeState.sessions.delete(sessionId);
    }
}
/**
 * Get Active Sessions
 */
export function getActiveBridgeSessions() {
    return Array.from(bridgeState.sessions.values())
        .filter(s => s.status === 'active');
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
export async function sendBridgeMessage(content, target = 'local', sessionId, requiresResponse, responseTimeout) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const message = {
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
    };
    bridgeState.messages.push(message);
    // 实际发送逻辑（占位）
    // await sendMessageToTarget(message)
    return message;
}
/**
 * Receive Bridge Message
 *
 * 接收桥接消息
 */
export function receiveBridgeMessage(message) {
    message.direction = 'inbound';
    bridgeState.messages.push(message);
    // 处理消息（占位）
    // await handleMessage(message)
    sessionTracing.recordTraceEvent('message_received', 'Bridge message received', {
        messageId: message.messageId,
        messageType: message.messageType,
        source: message.source
    });
}
/**
 * Get Pending Messages
 *
 * 获取待处理消息（需要响应）
 */
export function getPendingBridgeMessages() {
    return bridgeState.messages
        .filter(m => m.requiresResponse && m.messageType === 'request');
}
/**
 * Clear Message History
 */
export function clearBridgeMessageHistory() {
    bridgeState.messages = [];
}
// 权限回调队列
let permissionCallbacks = [];
/**
 * Register Permission Callback
 *
 * 注册权限回调
 */
export function registerPermissionCallback(operation, context) {
    const callbackId = `perm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const callback = {
        callbackId,
        callbackType: 'approval',
        permissionRequest: { operation, context },
        timestamp: Date.now(),
        processed: false
    };
    permissionCallbacks.push(callback);
    return callback;
}
/**
 * Process Permission Callback
 *
 * 处理权限回调
 */
export function processPermissionCallback(callbackId, result) {
    const callback = permissionCallbacks.find(c => c.callbackId === callbackId);
    if (callback) {
        callback.processed = true;
        callback.result = result;
        callback.processedAt = Date.now();
        // 发送结果到远程
        // await sendPermissionResult(callback)
    }
}
/**
 * Get Pending Permission Callbacks
 */
export function getPendingPermissionCallbacks() {
    return permissionCallbacks.filter(c => !c.processed);
}
/**
 * Clear Permission Callbacks
 */
export function clearPermissionCallbacks() {
    permissionCallbacks = [];
}
// 容量状态（全局状态）
let capacityState = {
    isAwake: true,
    currentCapacity: 0,
    maxCapacity: 10,
    shouldSleep: false,
    lastActiveTime: Date.now()
};
/**
 * Wake Capacity
 *
 * 唤醒容量
 */
export function wakeCapacity() {
    capacityState.isAwake = true;
    capacityState.wakeTime = Date.now();
    capacityState.shouldSleep = false;
    sessionTracing.recordTraceEvent('heartbeat', 'Capacity woke');
}
/**
 * Sleep Capacity
 *
 * 休眠容量（节省资源）
 */
export function sleepCapacity() {
    capacityState.isAwake = false;
    capacityState.idleTime = Date.now();
    sessionTracing.recordTraceEvent('heartbeat', 'Capacity sleeping');
}
/**
 * Check Capacity
 *
 * 检查容量状态
 */
export function checkCapacity() {
    const currentLoad = bridgeState.sessions.size;
    const maxCapacity = capacityState.maxCapacity;
    const utilization = currentLoad / maxCapacity;
    return {
        available: capacityState.isAwake && currentLoad < maxCapacity,
        currentLoad,
        maxCapacity,
        utilization
    };
}
/**
 * Get Capacity State
 */
export function getCapacityState() {
    return { ...capacityState };
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
};
// Types (moved to separate export)
export default bridgeService;
//# sourceMappingURL=bridge-service.js.map