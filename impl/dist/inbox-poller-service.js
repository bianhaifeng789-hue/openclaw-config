/**
 * Inbox Poller Service
 * 借鉴 Claude Code useInboxPoller.ts
 * 飞书场景：轮询收件箱，处理待处理消息/任务
 */
// 单例状态
let state = {
    messages: [],
    isPolling: false,
    pollInterval: 60_000, // 1 minute
    stats: {
        totalMessages: 0,
        highPriority: 0,
        unread: 0,
        actionRequired: 0,
        pollsCompleted: 0,
        lastPollTime: 0
    }
};
/**
 * 添加收件箱消息
 */
export function addMessage(message) {
    state.messages.push(message);
    state.stats.totalMessages++;
    if (message.priority === 'high')
        state.stats.highPriority++;
    if (!message.read)
        state.stats.unread++;
    if (message.actionRequired)
        state.stats.actionRequired++;
}
/**
 * 获取未读消息
 */
export function getUnreadMessages() {
    return state.messages.filter(m => !m.read);
}
/**
 * 获取高优先级消息
 */
export function getHighPriorityMessages() {
    return state.messages.filter(m => m.priority === 'high');
}
/**
 * 获取需要行动的消息
 */
export function getActionRequiredMessages() {
    return state.messages.filter(m => m.actionRequired);
}
/**
 * 标记已读
 */
export function markAsRead(messageId) {
    const message = state.messages.find(m => m.id === messageId);
    if (message && !message.read) {
        message.read = true;
        state.stats.unread--;
        return true;
    }
    return false;
}
/**
 * 模拟轮询（飞书场景）
 */
export function pollInbox() {
    state.stats.pollsCompleted++;
    state.stats.lastPollTime = Date.now();
    // 实际场景中会调用飞书 API 获取新消息
    // 这里返回未读消息
    return getUnreadMessages();
}
/**
 * 处理消息
 */
export function processMessage(messageId) {
    const message = state.messages.find(m => m.id === messageId);
    if (message) {
        message.read = true;
        if (message.actionRequired)
            state.stats.actionRequired--;
        state.stats.unread--;
        return true;
    }
    return false;
}
/**
 * 获取统计
 */
export function getStats() {
    return { ...state.stats };
}
/**
 * 设置轮询间隔
 */
export function setPollInterval(ms) {
    state.pollInterval = ms;
}
/**
 * 生成飞书收件箱卡片
 */
export function generateInboxCard() {
    const unread = getUnreadMessages();
    const highPriority = getHighPriorityMessages();
    const actionRequired = getActionRequiredMessages();
    return {
        config: { wide_screen_mode: true },
        header: {
            template: state.stats.unread > 0 ? 'orange' : 'green',
            title: { content: '📬 收件箱状态', tag: 'plain_text' }
        },
        elements: [
            {
                tag: 'div',
                fields: [
                    { is_short: true, text: { content: `${state.stats.unread}`, tag: 'lark_md' }, title: { content: '未读', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.highPriority}`, tag: 'lark_md' }, title: { content: '高优先', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.actionRequired}`, tag: 'lark_md' }, title: { content: '待行动', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.pollsCompleted}`, tag: 'lark_md' }, title: { content: '轮询次数', tag: 'lark_md' } }
                ]
            },
            unread.length > 0 ? {
                tag: 'div',
                text: {
                    content: '**未读消息:**\n' + unread
                        .slice(0, 5)
                        .map(m => `• ${m.priority === 'high' ? '🔴' : '○'} ${m.content.slice(0, 50)}${m.actionRequired ? ' (需行动)' : ''}`)
                        .join('\n'),
                    tag: 'lark_md'
                }
            } : undefined,
            actionRequired.length > 0 ? {
                tag: 'div',
                text: {
                    content: '**⚠️ 需要行动:**\n' + actionRequired
                        .slice(0, 3)
                        .map(m => `• ${m.content.slice(0, 80)}`)
                        .join('\n'),
                    tag: 'lark_md'
                }
            } : undefined,
            {
                tag: 'note',
                elements: [{ tag: 'plain_text', content: `轮询间隔: ${state.pollInterval / 1000}s | 最后轮询: ${state.stats.lastPollTime ? new Date(state.stats.lastPollTime).toLocaleTimeString('zh-CN') : '未开始'}` }]
            }
        ].filter(Boolean)
    };
}
/**
 * 清除已读消息
 */
export function clearReadMessages() {
    state.messages = state.messages.filter(m => !m.read);
}
/**
 * 重置
 */
export function reset() {
    state = {
        messages: [],
        isPolling: false,
        pollInterval: 60_000,
        stats: {
            totalMessages: 0,
            highPriority: 0,
            unread: 0,
            actionRequired: 0,
            pollsCompleted: 0,
            lastPollTime: 0
        }
    };
}
// 导出单例
export const inboxPollerService = {
    addMessage,
    getUnreadMessages,
    getHighPriorityMessages,
    getActionRequiredMessages,
    markAsRead,
    pollInbox,
    processMessage,
    getStats,
    setPollInterval,
    generateInboxCard,
    clearReadMessages,
    reset
};
export default inboxPollerService;
//# sourceMappingURL=inbox-poller-service.js.map