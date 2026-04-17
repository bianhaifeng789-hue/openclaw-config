/**
 * Query Engine Service - 子查询引擎
 * 
 * 借鉴 Claude Code 的 query/ 模块，支持：
 * - 并行子查询处理
 * - Token 预算管理
 * - 查询配置快照
 * - 停止钩子
 */

// Types
export type SessionId = string;

export interface QueryConfig {
  sessionId: SessionId;
  gates: {
    streamingToolExecution: boolean;
    emitToolUseSummaries: boolean;
    isAnt: boolean;
    fastModeEnabled: boolean;
  };
}

export interface BudgetTracker {
  continuationCount: number;
  lastDeltaTokens: number;
  lastGlobalTurnTokens: number;
  startedAt: number;
}

export type ContinueDecision = {
  action: 'continue';
  nudgeMessage: string;
  continuationCount: number;
  pct: number;
  turnTokens: number;
  budget: number;
};

export type StopDecision = {
  action: 'stop';
  completionEvent: {
    continuationCount: number;
    pct: number;
    turnTokens: number;
    budget: number;
    diminishingReturns: boolean;
    durationMs: number;
  } | null;
};

export type TokenBudgetDecision = ContinueDecision | StopDecision;

export interface SubQuery {
  id: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: string;
  tokensUsed?: number;
  startedAt?: number;
  completedAt?: number;
}

export interface QueryResult {
  sessionId: SessionId;
  queries: SubQuery[];
  totalTokens: number;
  durationMs: number;
  completionReason: 'budget_exhausted' | 'all_complete' | 'diminishing_returns';
}

// ============================================================================
// Constants
// ============================================================================

const COMPLETION_THRESHOLD = 0.9;
const DIMINISHING_THRESHOLD = 500;
const MAX_PARALLEL_QUERIES = 3;

// ============================================================================
// Budget Tracker
// ============================================================================

export function createBudgetTracker(): BudgetTracker {
  return {
    continuationCount: 0,
    lastDeltaTokens: 0,
    lastGlobalTurnTokens: 0,
    startedAt: Date.now(),
  };
}

export function checkTokenBudget(
  tracker: BudgetTracker,
  agentId: string | undefined,
  budget: number | null,
  globalTurnTokens: number,
): TokenBudgetDecision {
  if (agentId || budget === null || budget <= 0) {
    return { action: 'stop', completionEvent: null };
  }

  const turnTokens = globalTurnTokens;
  const pct = Math.round((turnTokens / budget) * 100);
  const deltaSinceLastCheck = globalTurnTokens - tracker.lastGlobalTurnTokens;

  const isDiminishing =
    tracker.continuationCount >= 3 &&
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

function getBudgetContinuationMessage(
  pct: number,
  turnTokens: number,
  budget: number,
): string {
  return `Token budget: ${pct}% used (${turnTokens}/${budget}). Consider summarizing progress and preparing to conclude.`;
}

// ============================================================================
// Query Config Builder
// ============================================================================

export function buildQueryConfig(sessionId: SessionId): QueryConfig {
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
  private config: QueryConfig;
  private budgetTracker: BudgetTracker;
  private queries: Map<string, SubQuery> = new Map();
  private totalTokens = 0;
  private startedAt: number;

  constructor(sessionId: SessionId, budget?: number) {
    this.config = buildQueryConfig(sessionId);
    this.budgetTracker = createBudgetTracker();
    this.startedAt = Date.now();
  }

  /**
   * 创建子查询
   */
  createSubQuery(prompt: string): SubQuery {
    const id = `query-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const query: SubQuery = {
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
  async executeSubQuery(queryId: string): Promise<SubQuery> {
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
  async executeParallel(queryIds: string[]): Promise<SubQuery[]> {
    const promises = queryIds.map(id => this.executeSubQuery(id));
    return Promise.all(promises);
  }

  /**
   * 检查预算状态
   */
  checkBudget(budget: number): TokenBudgetDecision {
    return checkTokenBudget(this.budgetTracker, undefined, budget, this.totalTokens);
  }

  /**
   * 获取所有查询状态
   */
  getQueries(): SubQuery[] {
    return Array.from(this.queries.values());
  }

  /**
   * 获取结果摘要
   */
  getResult(): QueryResult {
    return {
      sessionId: this.config.sessionId,
      queries: this.getQueries(),
      totalTokens: this.totalTokens,
      durationMs: Date.now() - this.startedAt,
      completionReason: this.determineCompletionReason(),
    };
  }

  private determineCompletionReason(): 'budget_exhausted' | 'all_complete' | 'diminishing_returns' {
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

// ============================================================================
// Stop Hooks
// ============================================================================

export type StopHook = (result: QueryResult) => Promise<void> | void;

export const defaultStopHooks: StopHook[] = [
  // 记录统计
  async (result) => {
    console.log(`Query session completed: ${result.sessionId}`);
    console.log(`Total queries: ${result.queries.length}`);
    console.log(`Total tokens: ${result.totalTokens}`);
    console.log(`Duration: ${result.durationMs}ms`);
  },
];

// ============================================================================
// Service Interface
// ============================================================================

export interface QueryEngineService {
  createEngine(sessionId: SessionId, budget?: number): QueryEngine;
  registerStopHook(hook: StopHook): void;
  getStats(): { enginesCreated: number; totalQueries: number; totalTokens: number };
  reset(): void;
}

class QueryEngineServiceImpl implements QueryEngineService {
  private enginesCreated = 0;
  private totalQueries = 0;
  private totalTokens = 0;
  private stopHooks: StopHook[] = [...defaultStopHooks];

  createEngine(sessionId: SessionId, budget?: number): QueryEngine {
    this.enginesCreated++;
    return new QueryEngine(sessionId, budget);
  }

  registerStopHook(hook: StopHook): void {
    this.stopHooks.push(hook);
  }

  async executeStopHooks(result: QueryResult): Promise<void> {
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

  reset(): void {
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