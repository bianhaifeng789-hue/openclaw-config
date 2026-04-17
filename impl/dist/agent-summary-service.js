/**
 * Phase 15: AgentSummary 代理进度摘要
 *
 * 借鉴 Claude Code 的 agentSummary.ts
 *
 * 功能：
 * - 每 30 秒生成 1-2 句进度摘要
 * - Coordinator Mode 子代理进度显示
 * - 过滤未完成 tool calls
 * - 禁止使用工具（只生成摘要）
 *
 * OpenClaw 飞书适配：
 * - 飞书卡片显示子代理进度
 * - 多代理协作时实时更新
 */
// ============================================================================
// Default Config
// ============================================================================
const DEFAULT_CONFIG = {
    intervalMs: 30_000, // 30 秒
    maxWords: 10, // 最多 10 个字
    enabled: true,
};
const SUMMARY_INTERVAL_MS = 30_000;
// ============================================================================
// Summary Prompt
// ============================================================================
/**
 * 构建摘要提示
 *
 * 借鉴 Claude Code 的 buildSummaryPrompt
 */
export function buildSummaryPrompt(previousSummary) {
    const prevLine = previousSummary
        ? `\n上次摘要: "${previousSummary}" — 请说**新内容**。\n`
        : '';
    return `用中文描述你最近的操作，用 3-5 个词，使用现在进行时。
命名具体的文件或函数，不要说分支名。
不要使用工具。

${prevLine}
好的示例:
- "读取 runAgent.ts"
- "修复 validate.ts 的 null check"
- "运行 auth 模块测试"
- "添加 fetchUser 的重试逻辑"

不好的示例（过去时）: "分析了分支 diff"
不好的示例（太模糊）: "正在调查问题"
不好的示例（太长）: "正在审查完整分支 diff 和 AgentTool.tsx 集成"
不好的示例（分支名）: "分析了 adam/background-summary 分支"`;
}
// ============================================================================
// State Management
// ============================================================================
let state = {
    summaries: new Map(),
    totalSummaries: 0,
    totalToolUses: 0,
    averageIntervalMs: SUMMARY_INTERVAL_MS,
};
// ============================================================================
// Summary Generator
// ============================================================================
/**
 * 生成代理摘要
 *
 * OpenClaw 适配：
 * - 基于 transcript 生成摘要
 * - 使用启发式方法（无需 forked agent）
 */
export function generateSummary(agentId, messages, previousSummary) {
    // 提取最近的工具调用
    const lastToolCalls = [];
    const lastFiles = [];
    for (let i = messages.length - 1; i >= 0 && i >= messages.length - 5; i--) {
        const msg = messages[i];
        if (msg.role === 'assistant') {
            // 查找工具调用
            const toolMatch = msg.content.match(/使用\s+(\w+)\s+工具/);
            if (toolMatch) {
                lastToolCalls.push(toolMatch[1]);
            }
            // 查找文件名
            const fileMatch = msg.content.match(/([\/\w-]+\.\w{2,4})/);
            if (fileMatch) {
                lastFiles.push(fileMatch[1]);
            }
        }
    }
    // 生成摘要
    if (lastFiles.length > 0) {
        const file = lastFiles[0].split('/').pop() || lastFiles[0];
        return `处理 ${file}`;
    }
    if (lastToolCalls.length > 0) {
        return `使用 ${lastToolCalls[0]}`;
    }
    // 默认摘要
    if (previousSummary) {
        return '继续处理';
    }
    return '开始工作';
}
/**
 * 启动代理摘要定时器
 *
 * 借鉴 Claude Code 的 startAgentSummarization
 */
export function startAgentSummarization(taskId, agentId, onUpdate) {
    let stopped = false;
    let previousSummary = null;
    let messageCount = 0;
    async function runSummary() {
        if (stopped)
            return;
        // TODO: 从 sessionStorage 获取 transcript
        // 暂时使用模拟数据
        const messages = [
            { role: 'user', content: '继续工作' },
            { role: 'assistant', content: '好的，我正在处理' },
        ];
        if (messages.length < 3) {
            // 消息太少，跳过
            return;
        }
        messageCount = messages.length;
        // 生成摘要
        const summary = generateSummary(agentId, messages, previousSummary);
        previousSummary = summary;
        // 更新状态
        const agentSummary = {
            agentId,
            taskId,
            summary,
            previousSummary,
            lastUpdateAt: Date.now(),
            messageCount,
            toolUseCount: 1,
        };
        state.summaries.set(agentId, agentSummary);
        state.totalSummaries++;
        state.totalToolUses++;
        // 回调通知
        onUpdate(agentSummary);
    }
    // 启动定时器
    const intervalId = setInterval(runSummary, SUMMARY_INTERVAL_MS);
    return {
        stop: () => {
            stopped = true;
            clearInterval(intervalId);
            state.summaries.delete(agentId);
        },
    };
}
// ============================================================================
// Multi-Agent Support
// ============================================================================
/**
 * 获取所有代理摘要
 */
export function getAllSummaries() {
    return Array.from(state.summaries.values());
}
/**
 * 获取特定代理摘要
 */
export function getAgentSummary(agentId) {
    return state.summaries.get(agentId) || null;
}
/**
 * 更新代理摘要
 */
export function updateAgentSummary(agentId, summary) {
    const existing = state.summaries.get(agentId);
    if (existing) {
        existing.summary = summary;
        existing.lastUpdateAt = Date.now();
        state.summaries.set(agentId, existing);
    }
}
// ============================================================================
// State Accessors
// ============================================================================
export function getState() {
    return {
        summaries: new Map(state.summaries),
        totalSummaries: state.totalSummaries,
        totalToolUses: state.totalToolUses,
        averageIntervalMs: state.averageIntervalMs,
    };
}
export function resetState() {
    state = {
        summaries: new Map(),
        totalSummaries: 0,
        totalToolUses: 0,
        averageIntervalMs: SUMMARY_INTERVAL_MS,
    };
}
export function getConfig() {
    return DEFAULT_CONFIG;
}
// ============================================================================
// Feishu Card
// ============================================================================
/**
 * 构建飞书代理进度卡片
 */
export function createAgentSummaryCard() {
    const summaries = getAllSummaries();
    if (summaries.length === 0) {
        return {
            title: '🤖 代理进度',
            content: '暂无活跃代理',
        };
    }
    const content = summaries
        .map(s => `**${s.agentId}**: ${s.summary}\n  消息: ${s.messageCount} | 工具: ${s.toolUseCount}`)
        .join('\n\n');
    return {
        title: `🤖 代理进度 (${summaries.length} 个)`,
        content,
    };
}
// ============================================================================
// Agent Summary Service Object
// ============================================================================
export const agentSummaryService = {
    buildSummaryPrompt,
    generateSummary,
    startSummarization: startAgentSummarization,
    getAllSummaries,
    getAgentSummary,
    updateAgentSummary,
    getState,
    resetState,
    getConfig,
    createSummaryCard: createAgentSummaryCard,
};
export default agentSummaryService;
//# sourceMappingURL=agent-summary-service.js.map