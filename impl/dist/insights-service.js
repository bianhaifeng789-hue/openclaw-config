/**
 * Phase 18: Insights 工作模式分析
 *
 * 借鉴 Claude Code 的 insights.ts (3200 lines)
 *
 * 功能：
 * - 分析用户工作习惯
 * - Facet extraction（特征提取）
 * - Narrative insights（叙述性洞察）
 * - 模型使用统计
 *
 * OpenClaw 飞书适配：
 * - 飞书卡片显示用户洞察
 * - 工作模式总结报告
 */
// ============================================================================
// Default Config
// ============================================================================
const DEFAULT_CONFIG = {
    enabled: true,
    analysisIntervalHours: 6,
    minSessionsForAnalysis: 10,
};
// ============================================================================
// State Management
// ============================================================================
let state = {
    totalAnalysisRuns: 0,
    lastAnalysisAt: 0,
    insights: [],
    patterns: [],
    modelUsage: new Map(),
    toolUsage: new Map(),
    sessionCount: 0,
    averageSessionLength: 0,
};
// ============================================================================
// Pattern Detection
// ============================================================================
/**
 * 检测工作模式
 *
 * 基于历史会话数据
 */
export function detectWorkPatterns(sessions) {
    const patterns = [];
    // 1. 检测编程模式
    const codeSessions = sessions.filter(s => s.messages.some(m => m.content.includes('implement') ||
        m.content.includes('function') ||
        m.content.includes('class')));
    if (codeSessions.length > 0) {
        patterns.push({
            pattern: '编程实现',
            description: '频繁进行代码实现任务',
            examples: ['实现新功能', '修复bug', '重构代码'],
            count: codeSessions.length,
        });
    }
    // 2. 检测分析模式
    const analysisSessions = sessions.filter(s => s.messages.some(m => m.content.includes('分析') ||
        m.content.includes('compare') ||
        m.content.includes('review')));
    if (analysisSessions.length > 0) {
        patterns.push({
            pattern: '分析审查',
            description: '频繁进行分析和审查任务',
            examples: ['代码审查', '架构分析', '性能分析'],
            count: analysisSessions.length,
        });
    }
    // 3. 检测文档模式
    const docSessions = sessions.filter(s => s.messages.some(m => m.content.includes('文档') ||
        m.content.includes('readme') ||
        m.content.includes('documentation')));
    if (docSessions.length > 0) {
        patterns.push({
            pattern: '文档编写',
            description: '频繁编写和维护文档',
            examples: ['编写readme', '更新文档', '编写API文档'],
            count: docSessions.length,
        });
    }
    return patterns;
}
// ============================================================================
// Insight Generation
// ============================================================================
/**
 * 生成工作洞察
 *
 * 基于检测到的模式
 */
export function generateInsights(patterns) {
    const insights = [];
    // 按频率排序
    const sortedPatterns = [...patterns].sort((a, b) => b.count - a.count);
    // 生成主要洞察
    if (sortedPatterns.length > 0) {
        const topPattern = sortedPatterns[0];
        insights.push({
            category: '主要工作类型',
            insight: `用户主要进行 ${topPattern.pattern} 任务（${Math.round(topPattern.count / patterns.reduce((sum, p) => sum + p.count, 0) * 100)}%）`,
            confidence: 0.8,
            frequency: topPattern.count,
        });
    }
    // 生成次要洞察
    if (sortedPatterns.length > 1) {
        const secondaryPattern = sortedPatterns[1];
        insights.push({
            category: '次要工作类型',
            insight: `用户也经常进行 ${secondaryPattern.pattern} 任务`,
            confidence: 0.6,
            frequency: secondaryPattern.count,
        });
    }
    // 生成习惯洞察
    if (state.averageSessionLength > 0) {
        insights.push({
            category: '会话习惯',
            insight: `平均会话长度: ${Math.round(state.averageSessionLength)} 条消息`,
            confidence: 0.9,
            frequency: state.sessionCount,
        });
    }
    return insights;
}
// ============================================================================
// Analysis Runner
// ============================================================================
/**
 * 运行工作模式分析
 *
 * OpenClaw 适配：
 * - 基于记忆文件分析
 * - 生成飞书报告
 */
export async function runInsightsAnalysis(sessions) {
    // 更新统计
    state.sessionCount = sessions.length;
    state.averageSessionLength = sessions.reduce((sum, s) => sum + s.messages.length, 0) / sessions.length;
    // 检测模式
    const patterns = detectWorkPatterns(sessions);
    state.patterns = patterns;
    // 生成洞察
    const insights = generateInsights(patterns);
    state.insights = insights;
    // 更新模型使用统计
    for (const session of sessions) {
        const count = state.modelUsage.get(session.model) || 0;
        state.modelUsage.set(session.model, count + 1);
        for (const tool of session.tools) {
            const toolCount = state.toolUsage.get(tool) || 0;
            state.toolUsage.set(tool, toolCount + 1);
        }
    }
    // 更新时间
    state.lastAnalysisAt = Date.now();
    state.totalAnalysisRuns++;
    return { insights, patterns };
}
// ============================================================================
// State Accessors
// ============================================================================
export function getState() {
    return {
        ...state,
        modelUsage: new Map(state.modelUsage),
        toolUsage: new Map(state.toolUsage),
    };
}
export function resetState() {
    state = {
        totalAnalysisRuns: 0,
        lastAnalysisAt: 0,
        insights: [],
        patterns: [],
        modelUsage: new Map(),
        toolUsage: new Map(),
        sessionCount: 0,
        averageSessionLength: 0,
    };
}
export function getConfig() {
    return DEFAULT_CONFIG;
}
// ============================================================================
// Feishu Card
// ============================================================================
/**
 * 构建飞书洞察卡片
 */
export function createInsightsCard() {
    if (state.insights.length === 0) {
        return {
            title: '📊 工作模式分析',
            content: '暂无分析数据\n\n需要积累更多会话',
        };
    }
    const insightsContent = state.insights
        .map(i => `**${i.category}**: ${i.insight}\n  置信度: ${Math.round(i.confidence * 100)}%`)
        .join('\n\n');
    const patternsContent = state.patterns
        .slice(0, 3)
        .map(p => `${p.pattern}: ${p.count} 次`)
        .join('\n');
    return {
        title: '📊 工作模式分析',
        content: `${insightsContent}

---

**工作模式统计**
${patternsContent}

分析次数: ${state.totalAnalysisRuns}`,
    };
}
// ============================================================================
// Insights Service Object
// ============================================================================
export const insightsService = {
    detectPatterns: detectWorkPatterns,
    generateInsights,
    runAnalysis: runInsightsAnalysis,
    getState,
    resetState,
    getConfig,
    createCard: createInsightsCard,
};
export default insightsService;
//# sourceMappingURL=insights-service.js.map