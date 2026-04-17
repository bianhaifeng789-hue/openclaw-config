/**
 * Phase 19: TipRegistry 提示注册表
 *
 * 借鉴 Claude Code 的 tipRegistry.ts (23KB)
 *
 * 功能：
 * - 提示注册和管理
 * - cooldownSessions（冷却期）
 * - 条件检查
 * - 提示调度器
 *
 * OpenClaw 飞书适配：
 * - 飞书卡片显示提示
 * - 新用户引导
 * - 功能推荐
 */
// ============================================================================
// Built-in Tips
// ============================================================================
const BUILTIN_TIPS = [
    {
        id: 'new-user-warmup',
        content: '从小功能或bug修复开始，让 Claude 提出计划，验证建议的修改',
        category: 'new-user',
        cooldownSessions: 3,
        priority: 5,
    },
    {
        id: 'use-plan-mode',
        content: '复杂任务先使用 plan mode，让 Claude 详细规划后再执行',
        category: 'advanced',
        cooldownSessions: 5,
        priority: 4,
    },
    {
        id: 'check-memory',
        content: '定期检查 MEMORY.md，了解 Claude 记住了什么',
        category: 'feature',
        cooldownSessions: 10,
        priority: 3,
    },
    {
        id: 'heartbeat-tasks',
        content: 'HEARTBEAT.md 定义了定期任务，可自定义检查频率',
        category: 'feature',
        cooldownSessions: 15,
        priority: 2,
    },
    {
        id: 'buddy-companion',
        content: 'Buddy Companion 会基于你的使用积累成长，稀有度会提升',
        category: 'feature',
        cooldownSessions: 20,
        priority: 1,
    },
    {
        id: 'magic-docs',
        content: 'Magic Docs 可以自动维护标记的文档，减少手动更新',
        category: 'feature',
        cooldownSessions: 25,
        priority: 2,
    },
    {
        id: 'auto-dream',
        content: 'AutoDream 会每24小时自动合并记忆，无需手动维护',
        category: 'feature',
        cooldownSessions: 30,
        priority: 1,
    },
    {
        id: 'prompt-suggestion',
        content: '系统会预测你的下一步操作，飞书卡片会显示建议按钮',
        category: 'feature',
        cooldownSessions: 35,
        priority: 2,
    },
];
// ============================================================================
// State Management
// ============================================================================
let state = {
    tips: BUILTIN_TIPS,
    history: [],
    currentTip: null,
    totalShown: 0,
    lastShownAt: 0,
};
// ============================================================================
// Tip Selection
// ============================================================================
/**
 * 获取自显示后的会话数
 */
export function getSessionsSinceLastShown(tipId) {
    const history = state.history.find(h => h.tipId === tipId);
    return history?.sessionsSinceShow || 999;
}
/**
 * 检查提示是否可以显示
 */
export function canShowTip(tip) {
    const sessionsSince = getSessionsSinceLastShown(tip.id);
    // 检查冷却期
    if (sessionsSince < tip.cooldownSessions) {
        return false;
    }
    // 检查条件
    if (tip.condition && !tip.condition()) {
        return false;
    }
    return true;
}
/**
 * 选择下一个提示
 *
 * 基于优先级和冷却期
 */
export function selectNextTip() {
    // 过滤可显示的提示
    const availableTips = state.tips.filter(canShowTip);
    if (availableTips.length === 0) {
        return null;
    }
    // 按优先级排序
    const sortedTips = [...availableTips].sort((a, b) => b.priority - a.priority);
    return sortedTips[0];
}
/**
 * 显示提示
 */
export function showTip() {
    const tip = selectNextTip();
    if (!tip) {
        return null;
    }
    // 更新历史
    const existingHistory = state.history.find(h => h.tipId === tip.id);
    if (existingHistory) {
        existingHistory.shownAt = Date.now();
        existingHistory.sessionsSinceShow = 0;
    }
    else {
        state.history.push({
            tipId: tip.id,
            shownAt: Date.now(),
            sessionsSinceShow: 0,
        });
    }
    // 更新状态
    state.currentTip = tip;
    state.totalShown++;
    state.lastShownAt = Date.now();
    return tip;
}
// ============================================================================
// Session Tracking
// ============================================================================
/**
 * 增加会话计数
 *
 * 所有历史记录的 sessionsSinceShow 增加
 */
export function incrementSessionCount() {
    for (const history of state.history) {
        history.sessionsSinceShow++;
    }
}
// ============================================================================
// Tip Registration
// ============================================================================
/**
 * 注册新提示
 */
export function registerTip(tip) {
    state.tips.push(tip);
}
/**
 * 移除提示
 */
export function removeTip(tipId) {
    state.tips = state.tips.filter(t => t.id !== tipId);
}
// ============================================================================
// State Accessors
// ============================================================================
export function getState() {
    return {
        tips: [...state.tips],
        history: [...state.history],
        currentTip: state.currentTip,
        totalShown: state.totalShown,
        lastShownAt: state.lastShownAt,
    };
}
export function resetState() {
    state = {
        tips: BUILTIN_TIPS,
        history: [],
        currentTip: null,
        totalShown: 0,
        lastShownAt: 0,
    };
}
export function getTips() {
    return [...state.tips];
}
export function getHistory() {
    return [...state.history];
}
// ============================================================================
// Feishu Card
// ============================================================================
/**
 * 构建飞书提示卡片
 */
export function createTipCard(tip) {
    if (!tip) {
        return {
            title: '💡 提示',
            content: '暂无新提示',
        };
    }
    const categoryEmoji = {
        'new-user': '👋',
        'advanced': '🚀',
        'feature': '✨',
    };
    const emoji = categoryEmoji[tip.category] || '💡';
    return {
        title: `${emoji} 提示`,
        content: `${tip.content}

分类: ${tip.category}
已显示: ${state.totalShown} 次`,
    };
}
// ============================================================================
// Tip Registry Service Object
// ============================================================================
export const tipRegistryService = {
    getSessionsSinceLastShown,
    canShowTip,
    selectNextTip,
    showTip,
    incrementSessionCount,
    registerTip,
    removeTip,
    getState,
    resetState,
    getTips,
    getHistory,
    createCard: createTipCard,
};
export default tipRegistryService;
//# sourceMappingURL=tip-registry-service.js.map