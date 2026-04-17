/**
 * Feishu Interaction Handler
 * 飞书交互处理（审批回调等）
 */
// 单例状态
let state = {
    callbacks: [],
    approvalResults: [],
    stats: {
        totalCallbacks: 0,
        approvals: 0,
        denials: 0,
        otherInteractions: 0
    }
};
/**
 * 处理审批回调
 */
export function handleApprovalCallback(serverId, action, reason) {
    const result = {
        serverId,
        approved: action === 'approve',
        reason,
        timestamp: Date.now()
    };
    state.approvalResults.push(result);
    state.stats.totalCallbacks++;
    if (result.approved)
        state.stats.approvals++;
    else
        state.stats.denials++;
    return result;
}
/**
 * 处理通用交互回调
 */
export function handleInteractionCallback(type, value, cardId) {
    const callback = {
        type,
        value,
        cardId,
        timestamp: Date.now()
    };
    state.callbacks.push(callback);
    state.stats.totalCallbacks++;
    if (type !== 'approve' && type !== 'deny') {
        state.stats.otherInteractions++;
    }
    return callback;
}
/**
 * 获取审批结果
 */
export function getApprovalResults() {
    return [...state.approvalResults];
}
/**
 * 获取服务器审批状态
 */
export function getServerApprovalStatus(serverId) {
    return state.approvalResults.find(r => r.serverId === serverId);
}
/**
 * 获取所有回调
 */
export function getAllCallbacks() {
    return [...state.callbacks];
}
/**
 * 获取统计
 */
export function getStats() {
    return { ...state.stats };
}
/**
 * 生成飞书交互卡片
 */
export function generateInteractionCard() {
    const approvalRate = state.stats.approvals + state.stats.denials > 0
        ? Math.floor((state.stats.approvals / (state.stats.approvals + state.stats.denials)) * 100)
        : 0;
    return {
        config: { wide_screen_mode: true },
        header: {
            template: 'blue',
            title: { content: '👆 交互处理摘要', tag: 'plain_text' }
        },
        elements: [
            {
                tag: 'div',
                fields: [
                    { is_short: true, text: { content: `${state.stats.totalCallbacks}`, tag: 'lark_md' }, title: { content: '总回调', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.approvals}`, tag: 'lark_md' }, title: { content: '审批', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.denials}`, tag: 'lark_md' }, title: { content: '拒绝', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${approvalRate}%`, tag: 'lark_md' }, title: { content: '通过率', tag: 'lark_md' } }
                ]
            },
            state.approvalResults.length > 0 ? {
                tag: 'div',
                text: {
                    content: '**最近审批:**\n' + state.approvalResults
                        .slice(-5)
                        .map(r => `• ${r.serverId}: ${r.approved ? '✅通过' : '❌拒绝'}${r.reason ? ` (${r.reason})` : ''}`)
                        .join('\n'),
                    tag: 'lark_md'
                }
            } : undefined,
            {
                tag: 'note',
                elements: [{ tag: 'plain_text', content: `审批通过率: ${approvalRate}% | 其他交互: ${state.stats.otherInteractions}` }]
            }
        ].filter(Boolean)
    };
}
/**
 * 清除回调
 */
export function clearCallbacks() {
    state.callbacks = [];
    state.approvalResults = [];
}
/**
 * 重置
 */
export function reset() {
    state = {
        callbacks: [],
        approvalResults: [],
        stats: {
            totalCallbacks: 0,
            approvals: 0,
            denials: 0,
            otherInteractions: 0
        }
    };
}
// 导出单例
export const feishuInteractionService = {
    handleApprovalCallback,
    handleInteractionCallback,
    getApprovalResults,
    getServerApprovalStatus,
    getAllCallbacks,
    getStats,
    generateInteractionCard,
    clearCallbacks,
    reset
};
export default feishuInteractionService;
//# sourceMappingURL=feishu-interaction-handler.js.map