/**
 * Query Engine Service - 子查询引擎
 *
 * 借鉴 Claude Code 的 query/ 模块，支持：
 * - 并行子查询处理
 * - Token 预算管理
 * - 查询配置快照
 * - 停止钩子
 */
// ============================================================================
// Constants
// ============================================================================
const COMPLETION_THRESHOLD = 0.9;
const DIMINISHING_THRESHOLD = 500;
const MAX_PARALLEL_QUERIES = 3;
// ============================================================================
// Budget Tracker
// ============================================================================
export function createBudgetTracker() {
    return {
        continuationCount: 0,
        lastDeltaTokens: 0,
        lastGlobalTurnTokens: 0,
        startedAt: Date.now(),
    };
}
export function checkTokenBudget(tracker, agentId, budget, globalTurnTokens) {
    if (agentId || budget === null || budget <= 0) {
        return { action: 'stop', completionEvent: null };
    }
    const turnTokens = globalTurnTokens;
    const pct = Math.round((turnTokens / budget) * 100);
    const deltaSinceLastCheck = globalTurnTokens - tracker.lastGlobalTurnTokens;
    const isDiminishing = tracker.continuationCount >= 3 &&
        deltaSinceLastCheck < DIMINISHING_THRESHOLD &&
        tracker.lastDeltaTokens < DIMINISHING_THRESHOLD;
    if (!isDiminishing && turnTokens < budget * COMPLETION_THRESHOLD) {
        tracker.continuationCount++;
        tracker.lastDeltaTokens = deltaSinceLastCheck;
        tracker.lastGlobalTurnTokens = globalTurnTokens;
        return {
            action: 'continue',
            nudgeMessage: getBudgetContinuationMessage(pct, turnTokens, budget),
            continuationCount: tracker.continuationCount,
            pct,
            turnTokens,
            budget,
        };
    }
    if (isDiminishing || tracker.continuationCount > 0) {
        return {
            action: 'stop',
            completionEvent: {
                continuationCount: tracker.continuationCount,
                pct,
                turnTokens,
                budget,
                diminishingReturns: isDiminishing,
                durationMs: Date.now() - tracker.startedAt,
            },
        };
    }
    return { action: 'stop', completionEvent: null };
}
function getBudgetContinuationMessage(pct, turnTokens, budget) {
    return `Token budget: ${pct}% used (${turnTokens}/${budget}). Consider summarizing progress and preparing to conclude.`;
}
// ============================================================================
// Query Config Builder
// ============================================================================
export function buildQueryConfig(sessionId) {
    return {
        sessionId,
        gates: {
            streamingToolExecution: process.env.CLAUDE_CODE_STREAMING_TOOLS === 'true',
            emitToolUseSummaries: process.env.CLAUDE_CODE_EMIT_TOOL_USE_SUMMARIES === 'true',
            isAnt: process.env.USER_TYPE === 'ant',
            fastModeEnabled: process.env.CLAUDE_CODE_DISABLE_FAST_MODE !== 'true',
        },
    };
}
// ============================================================================
// Query Engine
// ============================================================================
export class QueryEngine {
    config;
    budgetTracker;
    queries = new Map();
    totalTokens = 0;
    startedAt;
    constructor(sessionId, budget) {
        this.config = buildQueryConfig(sessionId);
        this.budgetTracker = createBudgetTracker();
        this.startedAt = Date.now();
    }
    /**
     * 创建子查询
     */
    createSubQuery(prompt) {
        const id = `query-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const query = {
            id,
            prompt,
            status: 'pending',
        };
        this.queries.set(id, query);
        return query;
    }
    /**
     * 执行子查询（模拟）
     */
    async executeSubQuery(queryId) {
        const query = this.queries.get(queryId);
        if (!query) {
            throw new Error(`Query ${queryId} not found`);
        }
        query.status = 'running';
        query.startedAt = Date.now();
        // 模拟执行（实际实现需要调用模型）
        await new Promise(resolve => setTimeout(resolve, 100));
        query.status = 'completed';
        query.completedAt = Date.now();
        query.tokensUsed = Math.floor(Math.random() * 500) + 100;
        query.result = `Sub-query result for: ${query.prompt.slice(0, 50)}...`;
        this.totalTokens += query.tokensUsed;
        return query;
    }
    /**
     * 并行执行多个子查询
     */
    async executeParallel(queryIds) {
        const promises = queryIds.map(id => this.executeSubQuery(id));
        return Promise.all(promises);
    }
    /**
     * 检查预算状态
     */
    checkBudget(budget) {
        return checkTokenBudget(this.budgetTracker, undefined, budget, this.totalTokens);
    }
    /**
     * 获取所有查询状态
     */
    getQueries() {
        return Array.from(this.queries.values());
    }
    /**
     * 获取结果摘要
     */
    getResult() {
        return {
            sessionId: this.config.sessionId,
            queries: this.getQueries(),
            totalTokens: this.totalTokens,
            durationMs: Date.now() - this.startedAt,
            completionReason: this.determineCompletionReason(),
        };
    }
    determineCompletionReason() {
        const allQueries = this.getQueries();
        const pendingQueries = allQueries.filter(q => q.status === 'pending');
        if (pendingQueries.length > 0) {
            return 'budget_exhausted';
        }
        const allComplete = allQueries.every(q => q.status === 'completed');
        if (allComplete) {
            return 'all_complete';
        }
        return 'diminishing_returns';
    }
}
export const defaultStopHooks = [
    // 记录统计
    async (result) => {
        console.log(`Query session completed: ${result.sessionId}`);
        console.log(`Total queries: ${result.queries.length}`);
        console.log(`Total tokens: ${result.totalTokens}`);
        console.log(`Duration: ${result.durationMs}ms`);
    },
];
class QueryEngineServiceImpl {
    enginesCreated = 0;
    totalQueries = 0;
    totalTokens = 0;
    stopHooks = [...defaultStopHooks];
    createEngine(sessionId, budget) {
        this.enginesCreated++;
        return new QueryEngine(sessionId, budget);
    }
    registerStopHook(hook) {
        this.stopHooks.push(hook);
    }
    async executeStopHooks(result) {
        for (const hook of this.stopHooks) {
            await hook(result);
        }
    }
    getStats() {
        return {
            enginesCreated: this.enginesCreated,
            totalQueries: this.totalQueries,
            totalTokens: this.totalTokens,
        };
    }
    reset() {
        this.enginesCreated = 0;
        this.totalQueries = 0;
        this.totalTokens = 0;
    }
}
export const queryEngineService = new QueryEngineServiceImpl();
// ============================================================================
// Export Stats for Heartbeat
// ============================================================================
export function getStats() {
    return queryEngineService.getStats();
}
export function reset() {
    queryEngineService.reset();
}
//# sourceMappingURL=query-engine-service.js.map