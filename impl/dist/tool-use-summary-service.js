/**
 * Tool Use Summary Service
 * 借鉴 Claude Code toolUseSummary.ts
 * 飞书场景：生成工具使用摘要（用于进度报告）
 */
// 单例状态
let state = {
    summaries: [],
    toolStats: new Map(),
    stats: {
        totalTools: 0,
        successfulTools: 0,
        failedTools: 0,
        summariesGenerated: 0
    }
};
// 摘要模板
const SUMMARY_TEMPLATES = {
    'read': (tools) => `读取了 ${tools.length} 个文件`,
    'write': (tools) => `创建了 ${tools.length} 个文件`,
    'edit': (tools) => `编辑了 ${tools.length} 个文件`,
    'bash': (tools) => `执行了 ${tools.length} 个命令`,
    'glob': (tools) => `搜索了 ${tools.length} 个模式`,
    'grep': (tools) => `搜索了 ${tools.length} 个关键词`,
    'message': (tools) => `发送了 ${tools.length} 条消息`,
    'web_fetch': (tools) => `抓取了 ${tools.length} 个网页`,
    'feishu': (tools) => `处理了 ${tools.length} 个飞书操作`
};
/**
 * 生成工具使用摘要
 */
export function generateSummary(params) {
    const { tools, context } = params;
    if (tools.length === 0) {
        return '无工具调用';
    }
    // 按工具名分组
    const byTool = {};
    for (const tool of tools) {
        const baseName = getBaseToolName(tool.name);
        if (!byTool[baseName])
            byTool[baseName] = [];
        byTool[baseName].push(tool);
    }
    // 生成摘要
    const parts = [];
    for (const [toolName, toolList] of Object.entries(byTool)) {
        const template = SUMMARY_TEMPLATES[toolName];
        if (template) {
            parts.push(template(toolList));
        }
        else {
            const successCount = toolList.filter(t => t.success).length;
            parts.push(`${toolName}: ${successCount}/${toolList.length} 成功`);
        }
    }
    const summary = parts.join(' | ');
    // 更新状态
    state.summaries.push(summary);
    state.stats.summariesGenerated++;
    // 更新工具统计
    for (const tool of tools) {
        const baseName = getBaseToolName(tool.name);
        const existing = state.toolStats.get(baseName) || { count: 0, success: 0, fail: 0 };
        existing.count++;
        if (tool.success)
            existing.success++;
        else
            existing.fail++;
        state.toolStats.set(baseName, existing);
        state.stats.totalTools++;
        if (tool.success)
            state.stats.successfulTools++;
        else
            state.stats.failedTools++;
    }
    return context ? `${context}: ${summary}` : summary;
}
/**
 * 获取工具基础名
 */
function getBaseToolName(name) {
    // 处理复合名称
    if (name.includes('feishu'))
        return 'feishu';
    if (name.includes('read'))
        return 'read';
    if (name.includes('write'))
        return 'write';
    if (name.includes('edit'))
        return 'edit';
    if (name.includes('bash') || name.includes('exec'))
        return 'bash';
    return name.split('_')[0].split('-')[0];
}
/**
 * 获取所有摘要
 */
export function getAllSummaries() {
    return [...state.summaries];
}
/**
 * 获取最近摘要
 */
export function getRecentSummaries(count = 5) {
    return state.summaries.slice(-count);
}
/**
 * 获取工具统计
 */
export function getToolStats() {
    return new Map(state.toolStats);
}
/**
 * 获取总体统计
 */
export function getStats() {
    return { ...state.stats };
}
/**
 * 生成飞书摘要卡片
 */
export function generateSummaryCard() {
    const toolStatsArray = Array.from(state.toolStats.entries());
    const successRate = state.stats.totalTools > 0
        ? Math.floor((state.stats.successfulTools / state.stats.totalTools) * 100)
        : 100;
    return {
        config: { wide_screen_mode: true },
        header: {
            template: successRate >= 80 ? 'green' : successRate >= 50 ? 'orange' : 'red',
            title: { content: '📊 工具使用摘要', tag: 'plain_text' }
        },
        elements: [
            {
                tag: 'div',
                fields: [
                    { is_short: true, text: { content: `${state.stats.totalTools}`, tag: 'lark_md' }, title: { content: '总调用', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${successRate}%`, tag: 'lark_md' }, title: { content: '成功率', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${state.stats.summariesGenerated}`, tag: 'lark_md' }, title: { content: '摘要生成', tag: 'lark_md' } },
                    { is_short: true, text: { content: `${toolStatsArray.length}`, tag: 'lark_md' }, title: { content: '工具类型', tag: 'lark_md' } }
                ]
            },
            {
                tag: 'div',
                text: {
                    content: '**工具统计:**\n' + toolStatsArray
                        .slice(0, 8)
                        .map(([name, stats]) => `• ${name}: ${stats.count}次 (${stats.success}/${stats.fail})`)
                        .join('\n'),
                    tag: 'lark_md'
                }
            },
            state.summaries.length > 0 ? {
                tag: 'div',
                text: {
                    content: '**最近摘要:**\n' + getRecentSummaries(3).map(s => `• ${s}`).join('\n'),
                    tag: 'lark_md'
                }
            } : undefined,
            {
                tag: 'note',
                elements: [{ tag: 'plain_text', content: `成功率 ${successRate}% | 失败 ${state.stats.failedTools} 次` }]
            }
        ].filter(Boolean)
    };
}
/**
 * 清除摘要
 */
export function clearSummaries() {
    state.summaries = [];
    state.toolStats = new Map();
}
/**
 * 重置
 */
export function reset() {
    state = {
        summaries: [],
        toolStats: new Map(),
        stats: {
            totalTools: 0,
            successfulTools: 0,
            failedTools: 0,
            summariesGenerated: 0
        }
    };
}
// 导出单例
export const toolUseSummaryService = {
    generateSummary,
    getAllSummaries,
    getRecentSummaries,
    getToolStats,
    getStats,
    generateSummaryCard,
    clearSummaries,
    reset
};
export default toolUseSummaryService;
//# sourceMappingURL=tool-use-summary-service.js.map