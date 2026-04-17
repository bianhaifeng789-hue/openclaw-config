/**
 * Phase 32: SideQuery - 后台子查询
 *
 * 借鉴 Claude Code 的 sideQuery.ts
 *
 * 功能：后台运行子查询，不打断主会话
 * 飞书场景：类似 Memdir Sonnet subquery，后台查询相关内容
 */
// ============================================================================
// State
// ============================================================================
const DEFAULT_CONFIG = {
    maxConcurrent: 3,
    timeoutMs: 60000,
    enabled: true,
};
let stats = {
    totalQueries: 0,
    completedQueries: 0,
    failedQueries: 0,
    averageDurationMs: 0,
    cacheHits: 0,
    cacheMisses: 0,
};
let pendingQueries = [];
let runningQueries = [];
// ============================================================================
// Query Management
// ============================================================================
/**
 * 创建后台查询
 */
export function createSideQuery(prompt, parentSessionKey) {
    const query = {
        id: `side_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        prompt,
        status: 'pending',
        startedAt: Date.now(),
        parentSessionKey,
    };
    pendingQueries.push(query);
    stats.totalQueries++;
    return query;
}
/**
 * 启动查询
 */
export function startSideQuery(queryId) {
    const query = pendingQueries.find(q => q.id === queryId);
    if (!query)
        return null;
    if (runningQueries.length >= DEFAULT_CONFIG.maxConcurrent) {
        return null; // 达到并发限制
    }
    query.status = 'running';
    pendingQueries = pendingQueries.filter(q => q.id !== queryId);
    runningQueries.push(query);
    return query;
}
/**
 * 完成查询
 */
export function completeSideQuery(queryId, result) {
    const query = runningQueries.find(q => q.id === queryId);
    if (!query)
        return null;
    query.status = 'completed';
    query.completedAt = Date.now();
    query.result = result;
    runningQueries = runningQueries.filter(q => q.id !== queryId);
    stats.completedQueries++;
    const duration = query.completedAt - query.startedAt;
    stats.averageDurationMs =
        (stats.averageDurationMs * (stats.completedQueries - 1) + duration) / stats.completedQueries;
    return query;
}
/**
 * 失败查询
 */
export function failSideQuery(queryId, error) {
    const query = runningQueries.find(q => q.id === queryId);
    if (!query)
        return null;
    query.status = 'failed';
    query.completedAt = Date.now();
    query.error = error;
    runningQueries = runningQueries.filter(q => q.id !== queryId);
    stats.failedQueries++;
    return query;
}
/**
 * 获取查询状态
 */
export function getSideQuery(queryId) {
    return pendingQueries.find(q => q.id === queryId)
        || runningQueries.find(q => q.id === queryId)
        || null;
}
/**
 * 获取所有运行中的查询
 */
export function getRunningQueries() {
    return [...runningQueries];
}
// ============================================================================
// Cache
// ============================================================================
const queryCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 分钟
/**
 * 检查缓存
 */
export function checkCache(prompt) {
    const cached = queryCache.get(prompt);
    if (!cached) {
        stats.cacheMisses++;
        return null;
    }
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        queryCache.delete(prompt);
        stats.cacheMisses++;
        return null;
    }
    stats.cacheHits++;
    return cached.result;
}
/**
 * 写入缓存
 */
export function writeCache(prompt, result) {
    queryCache.set(prompt, { result, timestamp: Date.now() });
}
// ============================================================================
// Spawn Helper
// ============================================================================
/**
 * 运行后台查询（使用 sessions_spawn）
 *
 * 注意：实际调用需要在 OpenClaw 运行时环境中
 */
export async function runSideQuery(prompt, parentSessionKey) {
    // 检查缓存
    const cachedResult = checkCache(prompt);
    if (cachedResult) {
        const query = createSideQuery(prompt, parentSessionKey);
        completeSideQuery(query.id, cachedResult);
        return query;
    }
    // 创建查询
    const query = createSideQuery(prompt, parentSessionKey);
    // TODO: 实际调用 sessions_spawn
    // 这里只是模拟
    return query;
}
// ============================================================================
// Stats
// ============================================================================
export function getSideQueryStats() {
    return {
        ...stats,
        config: DEFAULT_CONFIG,
        pendingCount: pendingQueries.length,
        runningCount: runningQueries.length,
    };
}
// ============================================================================
// Feishu Card
// ============================================================================
export function createSideQueryCard(queries) {
    const running = queries.filter(q => q.status === 'running');
    const completed = queries.filter(q => q.status === 'completed');
    return {
        title: '🔍 后台查询状态',
        content: `运行中: ${running.length} 个
已完成: ${completed.length} 个

${running.map(q => `- ${q.prompt.slice(0, 50)}...`).join('\n')}`,
    };
}
// ============================================================================
// Service Object
// ============================================================================
export const sideQueryService = {
    create: createSideQuery,
    start: startSideQuery,
    complete: completeSideQuery,
    fail: failSideQuery,
    get: getSideQuery,
    getRunning: getRunningQueries,
    run: runSideQuery,
    checkCache,
    writeCache,
    getStats: getSideQueryStats,
    createCard: createSideQueryCard,
};
export default sideQueryService;
//# sourceMappingURL=side-query-service.js.map