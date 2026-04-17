/**
 * Service Registry - 服务注册表
 *
 * 统一管理所有服务的启用状态和调用方式
 * 实现"一键启用所有服务"
 */
// ============================================================================
// Service Definitions - 已知服务清单
// ============================================================================
const KNOWN_SERVICES = [
    // Core - 核心服务（应该自动启用）
    { name: 'AutoDream', file: 'auto-dream-service.ts', category: 'core', enabled: true, autoStart: true, priority: 'high', description: '自动记忆合并', methods: ['check', 'run'] },
    { name: 'SessionMemoryCompact', file: 'session-memory-compact.ts', category: 'core', enabled: true, autoStart: true, priority: 'high', description: '记忆压缩', methods: ['compact', 'estimateTokens'] },
    { name: 'AgentSummary', file: 'agent-summary-service.ts', category: 'core', enabled: true, autoStart: true, priority: 'high', description: '代理摘要', methods: ['getStats', 'reset'] },
    { name: 'MagicDocs', file: 'magic-docs.ts', category: 'core', enabled: true, autoStart: true, priority: 'medium', description: '自动文档维护', methods: ['scan', 'update'] },
    { name: 'PromptSuggestion', file: 'prompt-suggestion-service.ts', category: 'core', enabled: true, autoStart: true, priority: 'medium', description: '提示建议', methods: ['suggest', 'predict'] },
    { name: 'HeartbeatExecutor', file: 'heartbeat-executor.ts', category: 'core', enabled: true, autoStart: true, priority: 'high', description: '心跳执行器', methods: ['check', 'run', 'status'] },
    { name: 'TaskTracker', file: 'task-tracker.ts', category: 'core', enabled: true, autoStart: true, priority: 'high', description: '任务追踪', methods: ['track', 'visualize'] },
    { name: 'SmartDispatcher', file: 'smart-dispatcher.ts', category: 'core', enabled: true, autoStart: true, priority: 'high', description: '智能调度器', methods: ['detectScene', 'dispatchServices'] },
    // Services - 服务类（可自动启用）
    { name: 'AwaySummary', file: 'away-summary-service.ts', category: 'service', enabled: true, autoStart: true, priority: 'high', description: '离开摘要', methods: ['recordActivity', 'generateSummary'] },
    { name: 'BuddyCompanion', file: 'buddy-companion-service.ts', category: 'service', enabled: true, autoStart: true, priority: 'medium', description: '虚拟伙伴', methods: ['generateBuddy', 'recordInteraction'] },
    { name: 'SideQuery', file: 'side-query-service.ts', category: 'service', enabled: true, autoStart: true, priority: 'medium', description: '后台子查询', methods: ['create', 'run', 'getStats'] },
    { name: 'ArgumentSubstitution', file: 'argument-substitution-service.ts', category: 'service', enabled: true, autoStart: true, priority: 'low', description: '参数替换', methods: ['set', 'substitute'] },
    { name: 'TeammateMailbox', file: 'teammate-mailbox-service.ts', category: 'service', enabled: true, autoStart: true, priority: 'medium', description: '队友邮箱', methods: ['send', 'get', 'checkPending'] },
    { name: 'Insights', file: 'insights-service.ts', category: 'service', enabled: true, autoStart: true, priority: 'medium', description: '用户洞察', methods: ['analyze', 'report'] },
    { name: 'Notifier', file: 'notifier-service.ts', category: 'service', enabled: true, autoStart: false, priority: 'medium', description: '通知服务', methods: ['send', 'queue'] },
    { name: 'SessionActivity', file: 'session-activity-service.ts', category: 'service', enabled: true, autoStart: false, priority: 'high', description: '会话活动', methods: ['track', 'report'] },
    { name: 'CodeIndex', file: 'code-index-service.ts', category: 'service', enabled: false, autoStart: false, priority: 'medium', description: '代码索引', methods: ['index', 'search'] },
    { name: 'ClaudeAILimits', file: 'claude-ai-limits.ts', category: 'service', enabled: false, autoStart: false, priority: 'high', description: 'API限额追踪', methods: ['check', 'warn'] },
    { name: 'BackgroundTask', file: 'background-task-service.ts', category: 'service', enabled: false, autoStart: false, priority: 'high', description: '后台任务', methods: ['start', 'stop', 'status'] },
    { name: 'CompactService', file: 'compact-service.ts', category: 'service', enabled: false, autoStart: false, priority: 'low', description: 'Compact命令', methods: ['compact', 'check'] },
    { name: 'Analytics', file: 'analytics-service.ts', category: 'service', enabled: false, autoStart: false, priority: 'low', description: '分析服务', methods: ['track', 'report'] },
    { name: 'Billing', file: 'billing-service.ts', category: 'service', enabled: false, autoStart: false, priority: 'medium', description: '计费服务', methods: ['track', 'estimate'] },
    // Disabled - 明确禁用的服务
    { name: 'CoordinatorService', file: 'coordinator-service.ts', category: 'disabled', enabled: false, autoStart: false, priority: 'low', description: '多代理协调', methods: ['start', 'stop'] },
    { name: 'EnhancedTelemetry', file: 'enhanced-telemetry-gate.ts', category: 'disabled', enabled: false, autoStart: false, priority: 'low', description: '遥测门控', methods: ['enable', 'disable'] },
    { name: 'ProxyUtils', file: 'proxy-utils.ts', category: 'disabled', enabled: false, autoStart: false, priority: 'low', description: 'HTTP代理', methods: ['configure'] },
    // Tools - 工具类（不应自动启用）
    { name: 'BashTool', file: 'bash-tool.ts', category: 'tool', enabled: false, autoStart: false, priority: 'low', description: 'Bash工具', methods: ['execute'] },
    { name: 'AskUserQuestion', file: 'ask-user-question-tool.ts', category: 'tool', enabled: false, autoStart: false, priority: 'low', description: '提问工具', methods: ['ask'] },
    { name: 'BriefTool', file: 'brief-tool.ts', category: 'tool', enabled: false, autoStart: false, priority: 'low', description: 'Brief工具', methods: ['brief'] },
    { name: 'SkillTool', file: 'skill-tool.ts', category: 'tool', enabled: false, autoStart: false, priority: 'low', description: '技能工具', methods: ['load', 'execute'] },
    { name: 'VoiceCommand', file: 'voice-command-service.ts', category: 'tool', enabled: false, autoStart: false, priority: 'low', description: '语音命令', methods: ['register', 'execute'] },
];
// ============================================================================
// State
// ============================================================================
const DEFAULT_CONFIG = {
    autoEnableCore: true,
    autoEnableServices: true,
    autoEnableTools: false,
    enableDisabled: false,
};
let config = DEFAULT_CONFIG;
let registry = new Map(KNOWN_SERVICES.map(s => [s.name, s]));
// ============================================================================
// Auto Enable - 一键启用
// ============================================================================
export function autoEnableAll(options) {
    const cfg = { ...config, ...options };
    const enabled = [];
    const skipped = [];
    for (const [name, entry] of registry) {
        let shouldEnable = false;
        if (entry.category === 'core' && cfg.autoEnableCore) {
            shouldEnable = true;
        }
        else if (entry.category === 'service' && cfg.autoEnableServices) {
            shouldEnable = true;
        }
        else if (entry.category === 'tool' && cfg.autoEnableTools) {
            shouldEnable = true;
        }
        else if (entry.category === 'disabled' && cfg.enableDisabled) {
            shouldEnable = true;
        }
        if (shouldEnable && !entry.enabled) {
            entry.enabled = true;
            entry.autoStart = entry.priority === 'high';
            enabled.push(name);
        }
        else if (!shouldEnable && entry.enabled) {
            skipped.push(name);
        }
    }
    const summary = `Auto-enabled ${enabled.length} services:\n` +
        enabled.map(n => `  ✅ ${n}`).join('\n') +
        `\nSkipped ${skipped.length} services:\n` +
        skipped.map(n => `  ⏸️ ${n}`).join('\n');
    return { enabled, skipped, summary };
}
export function enableService(name) {
    const entry = registry.get(name);
    if (entry) {
        entry.enabled = true;
        return true;
    }
    return false;
}
export function disableService(name) {
    const entry = registry.get(name);
    if (entry) {
        entry.enabled = false;
        entry.autoStart = false;
        return true;
    }
    return false;
}
export function setAutoStart(name, autoStart) {
    const entry = registry.get(name);
    if (entry) {
        entry.autoStart = autoStart;
        return true;
    }
    return false;
}
// ============================================================================
// Query
// ============================================================================
export function getService(name) {
    return registry.get(name);
}
export function getServicesByCategory(category) {
    return Array.from(registry.values()).filter(s => s.category === category);
}
export function getEnabledServices() {
    return Array.from(registry.values()).filter(s => s.enabled);
}
export function getAutoStartServices() {
    return Array.from(registry.values()).filter(s => s.autoStart);
}
export function getRegistryStats() {
    const services = Array.from(registry.values());
    const byCategory = {};
    for (const s of services) {
        byCategory[s.category] = (byCategory[s.category] || 0) + 1;
    }
    return {
        totalServices: services.length,
        enabledServices: services.filter(s => s.enabled).length,
        disabledServices: services.filter(s => !s.enabled).length,
        autoStartServices: services.filter(s => s.autoStart).length,
        byCategory,
    };
}
// ============================================================================
// Export
// ============================================================================
export const serviceRegistry = {
    autoEnableAll,
    enableService,
    disableService,
    setAutoStart,
    getService,
    getServicesByCategory,
    getEnabledServices,
    getAutoStartServices,
    getStats: getRegistryStats,
};
export default serviceRegistry;
//# sourceMappingURL=service-registry.js.map