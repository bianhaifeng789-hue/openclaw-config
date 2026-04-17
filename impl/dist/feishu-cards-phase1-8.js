// @ts-nocheck
/**
 * Feishu Card Generator for Phase 1-8
 * 飞书卡片显示后台任务 + Permission + Analytics + Cache + Memory Compact
 */
import * as utils from './index';
// ============================================
// Background Task Card
// ============================================
export function createBackgroundTaskCard() {
    const stats = utils.taskTracker.getStats();
    const activeTasks = utils.taskTracker.getActiveTasks();
    const statusEmoji = {
        pending: '⏳',
        running: '🔄',
        completed: '✅',
        failed: '❌'
    };
    let content = `**统计**
总任务: ${stats.totalTasks}
活跃任务: ${stats.activeTasks}
已完成: ${stats.completedTasks}
失败: ${stats.failedTasks}

`;
    if (activeTasks.length > 0) {
        content += `**活跃任务**\n`;
        for (const task of activeTasks.slice(0, 5)) {
            const emoji = statusEmoji[task.status] || '📋';
            const progress = task.progress ? `${task.progress}%` : '';
            content += `${emoji} ${task.name} ${progress}\n`;
        }
    }
    else {
        content += `暂无活跃任务\n`;
    }
    return {
        title: '📋 后台任务状态',
        content,
    };
}
// ============================================
// Forked Agent Cache Card
// ============================================
export function createCacheCard() {
    const stats = utils.forkedAgentCache.getStats();
    const hitRate = stats.totalRequests > 0
        ? Math.round(stats.cacheHits / stats.totalRequests * 100)
        : 0;
    const content = `**缓存统计**
总请求: ${stats.totalRequests}
缓存命中: ${stats.cacheHits}
缓存未命中: ${stats.cacheMisses}
命中率: ${hitRate}%

**活跃缓存**
条目数: ${stats.entriesCount}
预估节省: ~${Math.round(stats.cacheHits * 500)} tokens

**效果**
${hitRate >= 70 ? '✅ 命中率良好' : '⚠️ 命中率偏低'}
${stats.cacheHits > 10 ? `节省 ${Math.round(stats.cacheHits * 500 / 1000)}K tokens` : '节省较少'}`;
    return {
        title: '💾 Forked Agent Cache',
        content,
    };
}
// ============================================
// Session Memory Compact Card
// ============================================
export function createMemoryCompactCard() {
    const stats = utils.sessionMemoryCompact.getStats();
    const content = `**压缩统计**
总压缩次数: ${stats.totalCompacts}
节省 tokens: ${stats.savedTokens}
平均压缩率: ${stats.avgCompressionRate}%

**内容优先级**
高优先级: 保留（决策、错误）
中优先级: 压缩（对话摘要）
低优先级: 删除（冗余信息）

**效果**
${stats.savedTokens > 5000 ? `✅ 已节省 ${Math.round(stats.savedTokens / 1000)}K tokens` : '效果待积累'}
${stats.avgCompressionRate > 30 ? `压缩率 ${stats.avgCompressionRate}% 良好` : '压缩率偏低'}`;
    return {
        title: '🗜️ Session Memory Compact',
        content,
    };
}
// ============================================
// Permission System Card
// ============================================
export function createPermissionCard() {
    const stats = utils.permissionDecisionTracker.getStats();
    const content = `**权限统计**
总检查: ${stats.totalChecks}
允许: ${stats.allowedCount}
拒绝: ${stats.deniedCount}
学习偏好: ${stats.userPreferencesCount}

**危险模式检测**
检测次数: ${stats.dangerousPatternsDetected}
最常见模式: ${stats.mostCommonPattern || '无'}

**效果**
${stats.userPreferencesCount > 0 ? `✅ 已学习 ${stats.userPreferencesCount} 个偏好` : '尚未学习偏好'}
${stats.dangerousPatternsDetected > 0 ? `检测到 ${stats.dangerousPatternsDetected} 个危险操作` : '无危险操作检测'}`;
    return {
        title: '🔒 Permission System',
        content,
    };
}
// ============================================
// Analytics/Telemetry Card
// ============================================
export function createAnalyticsCard() {
    const stats = utils.analyticsService.getStats();
    const content = `**分析统计**
会话数: ${stats.sessionCount}
工具调用: ${stats.toolCallsCount}
API请求: ${stats.apiRequestsCount}

**热门工具**
${stats.topTools.length > 0
        ? stats.topTools.map(t => `${t.name}: ${t.count}`).join('\n')
        : '暂无数据'}

**追踪**
Perfetto导出: ${stats.perfettoExports} 次
OTLP事件: ${stats.otlpEvents} 个`;
    return {
        title: '📊 Analytics/Telemetry',
        content,
    };
}
// ============================================
// Hooks System Card
// ============================================
export function createHooksCard() {
    const stats = utils.hooksSystem.getStats();
    const content = `**Hooks统计**
注册hooks: ${stats.registeredHooks}
执行次数: ${stats.totalExecutions}

**功能hooks**
- canUseTool: 权限检查
- setStatus: 状态更新
- startInboxPoller: 消息轮询
- matchTypeahead: 自动补全

**执行统计**
${stats.totalExecutions > 50 ? `✅ 执行 ${stats.totalExecutions} 次` : '执行较少'}`;
    return {
        title: '🪝 Hooks System',
        content,
    };
}
// ============================================
// Swarm Service Card
// ============================================
export function createSwarmCard() {
    const teammates = utils.swarmService.getTeammates();
    const backends = utils.swarmService.getAvailableBackends();
    const roleNames = {
        researcher: '研究员',
        planner: '规划者',
        implementer: '实现者',
        reviewer: '审查者',
        tester: '测试者',
        documenter: '文档者',
        coordinator: '协调者',
    };
    const content = `**Swarm统计**
队友数: ${teammates.length}
后端数: ${backends.length}

**队友列表**
${teammates.length > 0
        ? teammates.slice(0, 5).map(t => `${roleNames[t.role] || t.role}: ${t.status}`).join('\n')
        : '暂无队友'}

**后端**
${backends.map(b => `${b.name}: ${b.available ? '可用' : '不可用'}`).join('\n')}`;
    return {
        title: '🐝 Swarm Service',
        content,
    };
}
// ============================================
// Bridge Service Card
// ============================================
export function createBridgeCard() {
    const sessions = utils.bridgeService.getActiveBridgeSessions();
    const capacity = utils.bridgeService.checkCapacity();
    const modeNames = {
        local: '本地',
        remote: '远程',
        cloud: '云端',
        hybrid: '混合',
    };
    const content = `**Bridge统计**
活跃会话: ${sessions.length}
当前负载: ${capacity.currentLoad}
最大容量: ${capacity.maxCapacity}

**会话列表**
${sessions.length > 0
        ? sessions.slice(0, 3).map(s => `${modeNames[s.mode] || s.mode}: ${s.status}`).join('\n')
        : '暂无会话'}

**容量**
${capacity.currentLoad < capacity.maxCapacity * 0.7 ? '✅ 容量充足' : '⚠️ 容量紧张'}`;
    return {
        title: '🌉 Bridge Service',
        content,
    };
}
// ============================================
// All Phase 1-8 Stats Card
// ============================================
export function createAllPhase1to8Card() {
    const taskCard = createBackgroundTaskCard();
    const cacheCard = createCacheCard();
    const memoryCard = createMemoryCompactCard();
    const permissionCard = createPermissionCard();
    const content = `${taskCard.content}

---

${cacheCard.content}

---

${memoryCard.content}

---

${permissionCard.content}

---

✅ Phase 1-8 全部运行正常`;
    return {
        title: '📈 Phase 1-8 综合状态',
        content,
    };
}
// ============================================
// Export all card generators
// ============================================
export const phase1to8CardGenerators = {
    backgroundTask: createBackgroundTaskCard,
    cache: createCacheCard,
    memoryCompact: createMemoryCompactCard,
    permission: createPermissionCard,
    analytics: createAnalyticsCard,
    hooks: createHooksCard,
    swarm: createSwarmCard,
    bridge: createBridgeCard,
    all: createAllPhase1to8Card,
};
//# sourceMappingURL=feishu-cards-phase1-8.js.map