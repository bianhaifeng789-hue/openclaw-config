/**
 * Rate Limit Messages Service
 * 借鉴 Claude Code rateLimitMessages.ts
 * 飞书场景：API限速通知，提前预警
 */
// 单例状态
let state = {
    limits: new Map(),
    messages: [],
    stats: {
        warningsSent: 0,
        errorsSent: 0,
        limitsReached: 0,
        checksPerformed: 0
    }
};
// 预警阈值
const WARNING_THRESHOLD = 0.7; // 70%
const CRITICAL_THRESHOLD = 0.9; // 90%
/**
 * 更新限速信息
 */
export function updateLimit(key, info) {
    state.limits.set(key, info);
    state.stats.checksPerformed++;
    // 生成消息
    const message = generateLimitMessage(info);
    if (message) {
        state.messages.push(message);
        if (message.severity === 'warning')
            state.stats.warningsSent++;
        if (message.severity === 'error')
            state.stats.errorsSent++;
        if (info.status === 'exhausted')
            state.stats.limitsReached++;
    }
    return message;
}
/**
 * 生成限速消息
 */
function generateLimitMessage(info) {
    const utilization = info.utilization || (info.used / info.limit);
    const resetTime = info.resetsAt ? formatResetTime(info.resetsAt) : '';
    const limitName = getLimitName(info.type);
    // 状态判断
    if (info.status === 'exhausted') {
        return {
            message: `❌ 已达到 ${limitName}（${info.used}/${info.limit}）${resetTime}`,
            severity: 'error',
            action: '等待重置或切换模型'
        };
    }
    if (info.status === 'limited') {
        return {
            message: `⚠️ 接近 ${limitName}（${Math.floor(utilization * 100)}%）${resetTime}`,
            severity: 'warning',
            action: '注意使用量'
        };
    }
    if (utilization >= CRITICAL_THRESHOLD) {
        return {
            message: `⚠️ ${limitName} 即将耗尽（${Math.floor(utilization * 100)}%）${resetTime}`,
            severity: 'warning',
            action: '减少请求频率'
        };
    }
    if (utilization >= WARNING_THRESHOLD) {
        return {
            message: `ℹ️ ${limitName} 使用量较高（${Math.floor(utilization * 100)}%）${resetTime}`,
            severity: 'info',
            action: null
        };
    }
    return null;
}
/**
 * 获取限速类型名称
 */
function getLimitName(type) {
    switch (type) {
        case 'session': return '会话限制';
        case 'daily': return '日限制';
        case 'weekly': return '周限制';
        case 'monthly': return '月限制';
        case 'custom': return '自定义限制';
        default: return '使用限制';
    }
}
/**
 * 格式化重置时间
 */
function formatResetTime(date) {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    if (diff < 0)
        return '（已重置）';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `· ${days}天后重置`;
    }
    if (hours > 0) {
        return `· ${hours}小时${minutes}分钟后重置`;
    }
    return `· ${minutes}分钟后重置`;
}
/**
 * 获取所有限速信息
 */
export function getAllLimits() {
    return new Map(state.limits);
}
/**
 * 获取特定限速信息
 */
export function getLimit(key) {
    return state.limits.get(key);
}
/**
 * 获取所有消息
 */
export function getMessages() {
    return [...state.messages];
}
/**
 * 获取最新消息
 */
export function getLatestMessage() {
    return state.messages[state.messages.length - 1];
}
/**
 * 检查是否需要发送通知
 */
export function shouldNotify() {
    // 有错误或警告消息时需要通知
    return state.messages.some(m => m.severity === 'error' || m.severity === 'warning');
}
/**
 * 获取统计信息
 */
export function getStats() {
    return { ...state.stats };
}
/**
 * 生成飞书限速卡片
 */
export function generateRateLimitCard() {
    const latestMessage = getLatestMessage();
    const limits = Array.from(state.limits.entries());
    // 限速状态汇总
    const exhausted = limits.filter(([_, info]) => info.status === 'exhausted').length;
    const warning = limits.filter(([_, info]) => info.status === 'limited' || info.status === 'warning').length;
    const ok = limits.filter(([_, info]) => info.status === 'ok').length;
    return {
        config: { wide_screen_mode: true },
        header: {
            template: exhausted > 0 ? 'red' : warning > 0 ? 'orange' : 'blue',
            title: { content: '📊 API 使用量监控', tag: 'plain_text' }
        },
        elements: [
            {
                tag: 'div',
                fields: [
                    { is_short: true, text: { content: `${exhausted}`, tag: 'lark_md' }, title: { content: '耗尽', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${warning}`, tag: 'lark_md' }, title: { content: '警告', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${ok}`, tag: 'lark_md' }, title: { content: '正常', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${limits.length}`, tag: 'lark_md' }, title: { content: '监控项', tag: 'lark_md' } }
                ]
            },
            {
                tag: 'div',
                text: {
                    content: '**各限速项详情:**\n' + limits
                        .slice(0, 5)
                        .map(([key, info]) => {
                        const utilization = Math.floor((info.utilization || info.used / info.limit) * 100);
                        const statusSymbol = info.status === 'exhausted' ? '❌' : info.status === 'limited' ? '⚠️' : '✅';
                        return `${statusSymbol} ${key}: ${utilization}% (${info.used}/${info.limit})`;
                    })
                        .join('\n'),
                    tag: 'lark_md'
                }
            },
            latestMessage ? {
                tag: 'div',
                text: { content: `**最新消息:**\n${latestMessage.message}${latestMessage.action ? `\n建议: ${latestMessage.action}` : ''}`, tag: 'lark_md' }
            } : undefined,
            {
                tag: 'note',
                elements: [{ tag: 'plain_text', content: `检查次数: ${state.stats.checksPerformed} | 警告: ${state.stats.warningsSent} | 错误: ${state.stats.errorsSent}` }]
            }
        ].filter(Boolean)
    };
}
/**
 * 清除消息
 */
export function clearMessages() {
    state.messages = [];
}
/**
 * 重置所有状态
 */
export function reset() {
    state = {
        limits: new Map(),
        messages: [],
        stats: {
            warningsSent: 0,
            errorsSent: 0,
            limitsReached: 0,
            checksPerformed: 0
        }
    };
}
// 导出单例
export const rateLimitMessagesService = {
    updateLimit,
    getAllLimits,
    getLimit,
    getMessages,
    getLatestMessage,
    shouldNotify,
    getStats,
    generateRateLimitCard,
    clearMessages,
    reset
};
export default rateLimitMessagesService;
//# sourceMappingURL=rate-limit-messages-service.js.map