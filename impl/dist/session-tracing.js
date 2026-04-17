/**
 * Session Tracing - 会话追踪系统
 *
 * 借鉴 Claude Code 的 telemetry 系统：
 * - telemetry/sessionTracing.ts 的会话追踪机制
 * - telemetry/perfettoTracing.ts 的 Perfetto 格式支持
 * - 完整的追踪链和深度管理
 *
 * OpenClaw 适配：
 * - 飞书会话追踪
 * - 多通道场景
 * - 与 heartbeat 整合
 */
// ============================================================================
// Tracing Manager
// ============================================================================
// 会话追踪存储
const sessionTraces = new Map();
// 当前追踪链
let currentChain = null;
// 追踪深度
let currentDepth = 0;
// ============================================================================
// Chain Management
// ============================================================================
/**
 * Start Trace Chain
 *
 * 开始追踪链
 *
 * @param sessionId - 会话 ID
 * @returns 链 ID
 */
export function startTraceChain(sessionId) {
    const chainId = `chain_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const chain = {
        chainId,
        sessionId,
        startTime: Date.now(),
        events: [],
        depth: currentDepth,
        metadata: {}
    };
    currentChain = chain;
    // 如果会话追踪不存在，创建
    if (!sessionTraces.has(sessionId)) {
        sessionTraces.set(sessionId, {
            sessionId,
            startTime: Date.now(),
            source: 'unknown',
            chains: [],
            totalEvents: 0
        });
    }
    // 添加链到会话
    const sessionTrace = sessionTraces.get(sessionId);
    sessionTrace.chains.push(chain);
    return chainId;
}
/**
 * End Trace Chain
 *
 * 结束追踪链
 */
export function endTraceChain() {
    if (currentChain) {
        currentChain.endTime = Date.now();
        currentChain = null;
    }
}
/**
 * Get Current Chain
 *
 * 获取当前追踪链
 */
export function getCurrentChain() {
    return currentChain;
}
/**
 * Create Child Chain
 *
 * 创建子追踪链（用于 forked agent）
 *
 * @param sessionId - 会话 ID
 * @returns 子链 ID
 */
export function createChildChain(sessionId) {
    const parentChain = currentChain;
    // 增加深度
    currentDepth++;
    const childChainId = startTraceChain(sessionId);
    const childChain = getCurrentChain();
    if (childChain && parentChain) {
        childChain.parentChainId = parentChain.chainId;
        childChain.depth = currentDepth;
    }
    return childChainId;
}
// ============================================================================
// Event Recording
// ============================================================================
/**
 * Record Trace Event
 *
 * 记录追踪事件
 *
 * @param type - 事件类型
 * @param name - 事件名称
 * @param data - 事件数据
 * @returns 事件 ID
 */
export function recordTraceEvent(type, name, data) {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const event = {
        id: eventId,
        type,
        timestamp: Date.now(),
        sessionId: currentChain?.sessionId ?? 'unknown',
        chainId: currentChain?.chainId ?? 'unknown',
        depth: currentDepth,
        name,
        data
    };
    if (currentChain) {
        currentChain.events.push(event);
        // 更新会话统计
        const sessionTrace = sessionTraces.get(currentChain.sessionId);
        if (sessionTrace) {
            sessionTrace.totalEvents++;
        }
    }
    return eventId;
}
/**
 * Record Timed Event
 *
 * 记录带持续时间的事件
 */
export function recordTimedEvent(type, name, startTimestamp, data, error) {
    const durationMs = Date.now() - startTimestamp;
    const eventId = recordTraceEvent(type, name, {
        ...data,
        durationMs
    });
    // 更新事件（添加 duration 和 error）
    if (currentChain) {
        const event = currentChain.events[currentChain.events.length - 1];
        if (event) {
            event.durationMs = durationMs;
            event.error = error;
        }
    }
    return eventId;
}
// ============================================================================
// Specialized Event Recording
// ============================================================================
/**
 * Record API Request
 *
 * 记录 API 请求
 */
export function recordApiRequest(model, inputTokens, outputTokens, cacheReadTokens = 0, cacheCreateTokens = 0, latencyMs) {
    const startTime = Date.now() - latencyMs;
    recordTimedEvent('api_response', `API response (${model})`, startTime, {
        model,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        cacheCreateTokens,
        totalTokens: inputTokens + outputTokens + cacheReadTokens + cacheCreateTokens
    });
    // 更新 API 统计
    if (currentChain) {
        const sessionTrace = sessionTraces.get(currentChain.sessionId);
        if (sessionTrace) {
            sessionTrace.apiStats = sessionTrace.apiStats ?? {
                requestCount: 0,
                totalTokens: 0,
                inputTokens: 0,
                outputTokens: 0,
                cacheReadTokens: 0,
                cacheCreateTokens: 0,
                avgLatencyMs: 0
            };
            const stats = sessionTrace.apiStats;
            stats.requestCount++;
            stats.totalTokens += inputTokens + outputTokens;
            stats.inputTokens += inputTokens;
            stats.outputTokens += outputTokens;
            stats.cacheReadTokens += cacheReadTokens;
            stats.cacheCreateTokens += cacheCreateTokens;
            stats.avgLatencyMs =
                (stats.avgLatencyMs * (stats.requestCount - 1) + latencyMs) /
                    stats.requestCount;
        }
    }
}
/**
 * Record Tool Call
 *
 * 记录工具调用
 */
export function recordToolCall(toolName, success, durationMs, error) {
    const startTime = Date.now() - durationMs;
    recordTimedEvent(success ? 'tool_result' : 'tool_call', `Tool: ${toolName}`, startTime, { toolName, success }, error);
    // 更新工具统计
    if (currentChain) {
        const sessionTrace = sessionTraces.get(currentChain.sessionId);
        if (sessionTrace) {
            sessionTrace.toolStats = sessionTrace.toolStats ?? {
                callCount: 0,
                successCount: 0,
                failureCount: 0,
                avgDurationMs: 0
            };
            const stats = sessionTrace.toolStats;
            stats.callCount++;
            if (success) {
                stats.successCount++;
            }
            else {
                stats.failureCount++;
            }
            stats.avgDurationMs =
                (stats.avgDurationMs * (stats.callCount - 1) + durationMs) /
                    stats.callCount;
        }
    }
}
/**
 * Record Cache Hit/Miss
 *
 * 记录 Cache 命中或未命中
 */
export function recordCacheEvent(isHit, tokensSaved) {
    recordTraceEvent(isHit ? 'cache_hit' : 'cache_miss', isHit ? 'Cache hit' : 'Cache miss', { tokensSaved });
}
// ============================================================================
// Session Trace Management
// ============================================================================
/**
 * Start Session Trace
 *
 * 开始会话追踪
 */
export function startSessionTrace(sessionId, source, channel, userId) {
    sessionTraces.set(sessionId, {
        sessionId,
        startTime: Date.now(),
        source,
        channel,
        userId,
        chains: [],
        totalEvents: 0
    });
    // 开始第一个链
    startTraceChain(sessionId);
    // 记录开始事件
    recordTraceEvent('session_start', 'Session started', { source, channel });
}
/**
 * End Session Trace
 *
 * 结束会话追踪
 */
export function endSessionTrace(sessionId) {
    const sessionTrace = sessionTraces.get(sessionId);
    if (!sessionTrace) {
        throw new Error(`Session trace not found: ${sessionId}`);
    }
    sessionTrace.endTime = Date.now();
    sessionTrace.totalDurationMs = sessionTrace.endTime - sessionTrace.startTime;
    // 结束当前链
    endTraceChain();
    // 记录结束事件
    recordTraceEvent('session_end', 'Session ended', {
        totalEvents: sessionTrace.totalEvents,
        totalDurationMs: sessionTrace.totalDurationMs
    });
    return sessionTrace;
}
/**
 * Get Session Trace
 *
 * 获取会话追踪
 */
export function getSessionTrace(sessionId) {
    return sessionTraces.get(sessionId);
}
/**
 * Export to Perfetto Format
 *
 * 导出到 Perfetto 格式（用于性能分析）
 */
export function exportToPerfetto(sessionTrace) {
    const perfettoEvents = [];
    const pid = 1; // 固定进程 ID
    for (const chain of sessionTrace.chains) {
        const tid = chain.depth + 1; // 深度作为线程 ID
        for (const event of chain.events) {
            const perfettoEvent = {
                name: event.name,
                ts: event.timestamp * 1000, // 微秒
                pid,
                tid,
                ph: event.durationMs ? 'X' : 'i', // X=complete, i=instant
                cat: event.type,
                args: event.data
            };
            if (event.durationMs) {
                perfettoEvent.dur = event.durationMs * 1000; // 微秒
            }
            perfettoEvents.push(perfettoEvent);
        }
    }
    return perfettoEvents;
}
/**
 * Get Tracing Summary
 *
 * 获取追踪摘要统计
 */
export function getTracingSummary() {
    const sessions = Array.from(sessionTraces.values());
    const totalSessions = sessions.length;
    const totalEvents = sessions.reduce((sum, s) => sum + s.totalEvents, 0);
    const apiStats = sessions
        .filter(s => s.apiStats)
        .map(s => s.apiStats);
    const toolStats = sessions
        .filter(s => s.toolStats)
        .map(s => s.toolStats);
    return {
        totalSessions,
        totalEvents,
        totalApiRequests: apiStats.reduce((sum, s) => sum + s.requestCount, 0),
        totalToolCalls: toolStats.reduce((sum, s) => sum + s.callCount, 0),
        avgSessionDurationMs: sessions.reduce((sum, s) => sum + (s.totalDurationMs ?? 0), 0) /
            Math.max(1, totalSessions),
        avgApiLatencyMs: apiStats.reduce((sum, s) => sum + s.avgLatencyMs * s.requestCount, 0) /
            Math.max(1, apiStats.reduce((sum, s) => sum + s.requestCount, 0)),
        avgToolDurationMs: toolStats.reduce((sum, s) => sum + s.avgDurationMs * s.callCount, 0) /
            Math.max(1, toolStats.reduce((sum, s) => sum + s.callCount, 0)),
        cacheHitRate: 0, // 需要从 cache events 计算
        totalTokensUsed: apiStats.reduce((sum, s) => sum + s.totalTokens, 0),
        tokensSavedByCache: apiStats.reduce((sum, s) => sum + s.cacheReadTokens, 0)
    };
}
// ============================================================================
// State Persistence
// ============================================================================
/**
 * Save Traces to File
 *
 * 保存追踪到文件
 */
export function saveTracesToFile(path) {
    const traces = Array.from(sessionTraces.values());
    // 实际实现需要 fs.writeFileSync(path, JSON.stringify(traces))
}
/**
 * Load Traces from File
 *
 * 从文件加载追踪
 */
export function loadTracesFromFile(path) {
    // 实际实现需要 fs.readFileSync(path) + JSON.parse
}
/**
 * Clear All Traces
 *
 * 清除所有追踪（用于测试）
 */
export function clearAllTraces() {
    sessionTraces.clear();
    currentChain = null;
    currentDepth = 0;
}
// ============================================================================
// Export
// ============================================================================
export const sessionTracing = {
    // Chain Management
    startTraceChain,
    endTraceChain,
    getCurrentChain,
    createChildChain,
    // Event Recording
    recordTraceEvent,
    recordTimedEvent,
    recordApiRequest,
    recordToolCall,
    recordCacheEvent,
    // Session Management
    startSessionTrace,
    endSessionTrace,
    getSessionTrace,
    // Export
    exportToPerfetto,
    // Statistics
    getTracingSummary,
    // Persistence
    saveTracesToFile,
    loadTracesFromFile,
    clearAllTraces,
    // Types
};
// Types (moved to separate export)
export default sessionTracing;
//# sourceMappingURL=session-tracing.js.map