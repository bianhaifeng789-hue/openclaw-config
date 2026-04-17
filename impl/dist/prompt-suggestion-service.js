/**
 * Phase 17: PromptSuggestion 提示建议
 *
 * 借鉴 Claude Code 的 promptSuggestion.ts
 *
 * 功能：
 * - 预测用户下一步操作
 * - Speculation 推测用户意图
 * - 生成 2-3 个建议提示
 * - 帮助用户快速执行下一步
 *
 * OpenClaw 飞书适配：
 * - 飞书卡片显示建议按钮
 * - 用户点击即可执行
 * - 提升交互效率
 */
// ============================================================================
// Default Config
// ============================================================================
const DEFAULT_CONFIG = {
    enabled: true,
    maxSuggestions: 3,
    minAssistantTurns: 2,
    cooldownMinutes: 30,
    maxPerDay: 5,
};
// ============================================================================
// State Management
// ============================================================================
let state = {
    currentSuggestion: null,
    suggestionHistory: [],
    totalGenerated: 0,
    totalAccepted: 0,
    todayCount: 0,
    lastGeneratedAt: 0,
};
// ============================================================================
// Suppress Checks
// ============================================================================
/**
 * 获取抑制原因
 *
 * 如果建议不应生成，返回抑制原因
 */
export function getSuggestionSuppressReason(appState) {
    if (!appState.promptSuggestionEnabled) {
        return { reason: 'disabled' };
    }
    if (appState.pendingWorkerRequest || appState.pendingSandboxRequest) {
        return { reason: 'pending_permission' };
    }
    if (appState.elicitationQueueLength > 0) {
        return { reason: 'elicitation_active' };
    }
    if (appState.permissionMode === 'plan') {
        return { reason: 'plan_mode' };
    }
    if (appState.limitsStatus !== 'allowed') {
        return { reason: 'rate_limit' };
    }
    return null;
}
/**
 * 检查冷却期
 */
export function checkCooldown() {
    const config = DEFAULT_CONFIG;
    const sinceLastMs = Date.now() - state.lastGeneratedAt;
    return sinceLastMs >= config.cooldownMinutes * 60 * 1000;
}
/**
 * 检查每日上限
 */
export function checkDailyLimit() {
    return state.todayCount < DEFAULT_CONFIG.maxPerDay;
}
/**
 * 检查最小 assistant turns
 */
export function checkMinAssistantTurns(messages) {
    const assistantTurnCount = messages.filter(m => m.role === 'assistant').length;
    return assistantTurnCount >= DEFAULT_CONFIG.minAssistantTurns;
}
// ============================================================================
// Suggestion Generation
// ============================================================================
/**
 * 分析用户意图
 *
 * 基于最近对话推测用户下一步
 */
export function analyzeUserIntent(messages) {
    const suggestions = [];
    // 提取最近 5 条消息
    const recentMessages = messages.slice(-5);
    // 分析用户意图
    for (const msg of recentMessages) {
        if (msg.role === 'assistant') {
            // 检查是否提到下一步
            const nextStepMatch = msg.content.match(/下一步[：:]\s*(.+)/);
            if (nextStepMatch) {
                suggestions.push(nextStepMatch[1]);
            }
            // 检查是否提到待办
            const todoMatch = msg.content.match(/待[办办做][：:]\s*(.+)/);
            if (todoMatch) {
                suggestions.push(todoMatch[1]);
            }
            // 检查是否建议继续
            const continueMatch = msg.content.match(/建议继续[：:]\s*(.+)/);
            if (continueMatch) {
                suggestions.push(continueMatch[1]);
            }
        }
    }
    // 如果没有找到明确意图，基于任务状态生成通用建议
    if (suggestions.length === 0) {
        suggestions.push('继续下一步任务', '查看当前进度', '保存当前工作');
    }
    return suggestions.slice(0, DEFAULT_CONFIG.maxSuggestions);
}
/**
 * 生成建议
 *
 * OpenClaw 适配：
 * - 基于启发式方法（不需要 forked agent）
 * - 避免重复建议
 */
export function generateSuggestion(messages) {
    // 检查抑制条件
    const suppressReason = getSuggestionSuppressReason({
        promptSuggestionEnabled: DEFAULT_CONFIG.enabled,
        pendingWorkerRequest: false,
        pendingSandboxRequest: false,
        elicitationQueueLength: 0,
        permissionMode: 'normal',
        limitsStatus: 'allowed',
    });
    if (suppressReason) {
        return null;
    }
    // 检查冷却期
    if (!checkCooldown()) {
        return null;
    }
    // 检查每日上限
    if (!checkDailyLimit()) {
        return null;
    }
    // 检查最小 assistant turns
    if (!checkMinAssistantTurns(messages)) {
        return null;
    }
    // 分析用户意图
    const suggestions = analyzeUserIntent(messages);
    if (suggestions.length === 0) {
        return null;
    }
    // 生成建议
    const suggestion = {
        prompt: suggestions[0],
        variant: 'user_intent',
        confidence: 0.7,
        generatedAt: Date.now(),
        promptId: `suggest_${Date.now()}`,
    };
    // 更新状态
    state.currentSuggestion = suggestion;
    state.suggestionHistory.push(suggestion);
    state.totalGenerated++;
    state.todayCount++;
    state.lastGeneratedAt = Date.now();
    return suggestion;
}
// ============================================================================
// Suggestion Acceptance
// ============================================================================
/**
 * 用户接受建议
 */
export function acceptSuggestion(suggestionId) {
    const suggestion = state.suggestionHistory.find(s => s.promptId === suggestionId);
    if (suggestion) {
        state.totalAccepted++;
    }
}
/**
 * 用户忽略建议
 */
export function ignoreSuggestion() {
    state.currentSuggestion = null;
}
// ============================================================================
// State Accessors
// ============================================================================
export function getState() {
    return {
        currentSuggestion: state.currentSuggestion,
        suggestionHistory: [...state.suggestionHistory],
        totalGenerated: state.totalGenerated,
        totalAccepted: state.totalAccepted,
        todayCount: state.todayCount,
        lastGeneratedAt: state.lastGeneratedAt,
    };
}
export function resetState() {
    state = {
        currentSuggestion: null,
        suggestionHistory: [],
        totalGenerated: 0,
        totalAccepted: 0,
        todayCount: 0,
        lastGeneratedAt: 0,
    };
}
export function getConfig() {
    return DEFAULT_CONFIG;
}
export function getCurrentSuggestion() {
    return state.currentSuggestion;
}
export function getPromptVariant() {
    return 'user_intent';
}
// ============================================================================
// Feishu Card
// ============================================================================
/**
 * 构建飞书建议卡片
 */
export function createSuggestionCard(suggestion) {
    if (!suggestion) {
        return {
            title: '💡 提示建议',
            content: '暂无建议',
        };
    }
    // 获取历史建议（最多 3 个）
    const recentSuggestions = state.suggestionHistory.slice(-3);
    const buttons = recentSuggestions.map(s => s.prompt);
    return {
        title: '💡 建议下一步',
        content: `**推荐**: ${suggestion.prompt}
置信度: ${Math.round(suggestion.confidence * 100)}%

今日建议: ${state.todayCount}/${DEFAULT_CONFIG.maxPerDay}`,
        buttons,
    };
}
// ============================================================================
// HEARTBEAT Integration
// ============================================================================
/**
 * Heartbeat 检查点
 */
export async function checkPromptSuggestionForHeartbeat(messages) {
    const suppressReason = getSuggestionSuppressReason({
        promptSuggestionEnabled: DEFAULT_CONFIG.enabled,
        pendingWorkerRequest: false,
        pendingSandboxRequest: false,
        elicitationQueueLength: 0,
        permissionMode: 'normal',
        limitsStatus: 'allowed',
    });
    let suggestion = null;
    if (!suppressReason && checkCooldown() && checkDailyLimit()) {
        suggestion = generateSuggestion(messages);
    }
    return {
        suggestion,
        state: getState(),
        suppressReason,
    };
}
// ============================================================================
// Prompt Suggestion Service Object
// ============================================================================
export const promptSuggestionService = {
    getConfig,
    getPromptVariant,
    getSuppressReason: getSuggestionSuppressReason,
    checkCooldown,
    checkDailyLimit,
    checkMinAssistantTurns,
    analyzeUserIntent,
    generateSuggestion,
    acceptSuggestion,
    ignoreSuggestion,
    getState,
    resetState,
    getCurrentSuggestion,
    createCard: createSuggestionCard,
    checkForHeartbeat: checkPromptSuggestionForHeartbeat,
};
export default promptSuggestionService;
//# sourceMappingURL=prompt-suggestion-service.js.map