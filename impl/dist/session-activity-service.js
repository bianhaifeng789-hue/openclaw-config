/**
 * Phase 38: SessionActivity - 会话心跳
 *
 * 借鉴 Claude Code 的 sessionActivity.ts
 *
 * 功能：会话 30s 心跳，保持活跃状态
 * 飞书场景：追踪会话活跃度，优化资源分配
 */
// ============================================================================
// State
// ============================================================================
const DEFAULT_CONFIG = {
    heartbeatIntervalMs: 30000,
    idleThresholdMs: 60000,
    maxSessions: 10,
    enabled: true,
};
let stats = {
    totalSessions: 0,
    activeSessions: 0,
    idleSessions: 0,
    closedSessions: 0,
    averageHeartbeats: 0,
    totalHeartbeats: 0,
};
const sessions = new Map();
// ============================================================================
// Session Management
// ============================================================================
/**
 * 创建会话
 */
export function createSession(sessionKey) {
    const session = {
        sessionKey,
        startedAt: Date.now(),
        lastHeartbeatAt: Date.now(),
        heartbeatCount: 0,
        status: 'active',
        messageCount: 0,
        toolCallCount: 0,
        totalTokens: 0,
    };
    sessions.set(sessionKey, session);
    stats.totalSessions++;
    stats.activeSessions++;
    return session;
}
/**
 * 记录心跳
 */
export function recordHeartbeat(sessionKey) {
    const session = sessions.get(sessionKey);
    if (!session)
        return null;
    session.lastHeartbeatAt = Date.now();
    session.heartbeatCount++;
    stats.totalHeartbeats++;
    // 更新状态
    session.status = 'active';
    return session;
}
/**
 * 记录消息
 */
export function recordMessage(sessionKey, tokens = 0) {
    const session = sessions.get(sessionKey);
    if (!session)
        return null;
    session.messageCount++;
    session.totalTokens += tokens;
    session.lastHeartbeatAt = Date.now();
    return session;
}
/**
 * 记录工具调用
 */
export function recordToolCall(sessionKey) {
    const session = sessions.get(sessionKey);
    if (!session)
        return null;
    session.toolCallCount++;
    session.lastHeartbeatAt = Date.now();
    return session;
}
/**
 * 更新会话状态
 */
export function updateSessionStatus(sessionKey) {
    const session = sessions.get(sessionKey);
    if (!session)
        return null;
    const idleTime = Date.now() - session.lastHeartbeatAt;
    if (idleTime >= DEFAULT_CONFIG.idleThresholdMs) {
        if (session.status === 'active') {
            session.status = 'idle';
            stats.activeSessions--;
            stats.idleSessions++;
        }
    }
    else {
        if (session.status === 'idle') {
            session.status = 'active';
            stats.idleSessions--;
            stats.activeSessions++;
        }
    }
    return session;
}
/**
 * 关闭会话
 */
export function closeSession(sessionKey) {
    const session = sessions.get(sessionKey);
    if (!session)
        return null;
    // 先更新统计（基于当前状态）
    if (session.status === 'active') {
        stats.activeSessions--;
    }
    else if (session.status === 'idle') {
        stats.idleSessions--;
    }
    // 再更新状态
    session.status = 'closed';
    stats.closedSessions++;
    // 计算平均心跳
    stats.averageHeartbeats = stats.totalHeartbeats / stats.totalSessions;
    return session;
}
/**
 * 获取会话
 */
export function getSession(sessionKey) {
    return sessions.get(sessionKey) || null;
}
/**
 * 获取活跃会话
 */
export function getActiveSessions() {
    return Array.from(sessions.values()).filter(s => s.status === 'active');
}
/**
 * 获取所有会话
 */
export function getAllSessions() {
    return Array.from(sessions.values());
}
// ============================================================================
// Cleanup
// ============================================================================
/**
 * 清理过期会话
 */
export function cleanupExpiredSessions(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, session] of sessions.entries()) {
        if (session.status === 'closed' && now - session.lastHeartbeatAt > maxAgeMs) {
            sessions.delete(key);
            cleaned++;
        }
    }
    return cleaned;
}
// ============================================================================
// Stats
// ============================================================================
export function getSessionActivityStats() {
    return {
        ...stats,
        config: DEFAULT_CONFIG,
    };
}
// ============================================================================
// HEARTBEAT Integration
// ============================================================================
/**
 * Heartbeat 检查点
 */
export async function checkSessionActivityForHeartbeat() {
    const activeSessions = getActiveSessions();
    const idleSessions = getAllSessions().filter(s => s.status === 'idle');
    const oldestActive = activeSessions.length > 0
        ? Math.min(...activeSessions.map(s => s.startedAt))
        : 0;
    return {
        activeCount: activeSessions.length,
        idleCount: idleSessions.length,
        oldestActive,
    };
}
// ============================================================================
// Feishu Card
// ============================================================================
export function createSessionActivityCard() {
    const active = getActiveSessions();
    return {
        title: '💓 会话心跳状态',
        content: `活跃会话: ${stats.activeSessions} 个
空闲会话: ${stats.idleSessions} 个
总心跳数: ${stats.totalHeartbeats}

${active.slice(0, 5).map(s => `- ${s.sessionKey.slice(0, 30)} (${s.heartbeatCount} 心跳)`).join('\n')}`,
    };
}
// ============================================================================
// Service Object
// ============================================================================
export const sessionActivityService = {
    create: createSession,
    heartbeat: recordHeartbeat,
    message: recordMessage,
    toolCall: recordToolCall,
    updateStatus: updateSessionStatus,
    close: closeSession,
    get: getSession,
    getActive: getActiveSessions,
    getAll: getAllSessions,
    cleanup: cleanupExpiredSessions,
    getStats: getSessionActivityStats,
    checkForHeartbeat: checkSessionActivityForHeartbeat,
    createCard: createSessionActivityCard,
};
export default sessionActivityService;
//# sourceMappingURL=session-activity-service.js.map