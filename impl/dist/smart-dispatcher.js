/**
 * Smart Dispatcher - 智能调度器
 *
 * 根据场景自动调用相关服务，实现"智能化调用"
 *
 * 场景分类：
 * - feishu_chat: 飞书聊天场景
 * - code_edit: 代码编辑场景
 * - memory_maintenance: 记忆维护场景
 * - background_task: 后台任务场景
 * - swarm_collaboration: 多代理协作场景
 */
// ============================================================================
// Scene Detection Rules
// ============================================================================
const SCENE_SIGNALS = {
    feishu_chat: [
        'channel=feishu',
        'chat_type=direct',
        'chat_type=group',
        '飞书卡片',
        '飞书消息',
    ],
    code_edit: [
        'file_read',
        'file_write',
        'file_edit',
        'impl/utils',
        '.ts',
        '.js',
        'npm run build',
        'git commit',
    ],
    memory_maintenance: [
        'MEMORY.md',
        'heartbeat',
        'auto-dream',
        'compact',
        'memory/',
        'YYYY-MM-DD.md',
    ],
    background_task: [
        'background_task',
        'forked_agent',
        'session_spawn',
        'subagent',
    ],
    swarm_collaboration: [
        'swarm',
        'teammate',
        'mailbox',
        'multi_agent',
        'coordinator',
    ],
    idle: [
        'HEARTBEAT_OK',
        'no_pending_tasks',
        'user_inactive',
    ],
    unknown: [],
};
// ============================================================================
// Service Registry - 每个场景应该调用哪些服务
// ============================================================================
const SCENE_SERVICES = {
    feishu_chat: [
        { service: 'away-summary', method: 'recordActivity', priority: 'high' },
        { service: 'notifier', method: 'checkPending', priority: 'medium' },
        { service: 'buddy-companion', method: 'recordInteraction', priority: 'low' },
        { service: 'session-activity', method: 'track', priority: 'high' },
    ],
    code_edit: [
        { service: 'code-index-service', method: 'updateIndex', priority: 'medium' },
        { service: 'magic-docs', method: 'scanMarkers', priority: 'low' },
        { service: 'file-history', method: 'record', priority: 'high' },
        { service: 'compact-service', method: 'checkSize', priority: 'low' },
    ],
    memory_maintenance: [
        { service: 'auto-dream', method: 'checkConsolidation', priority: 'high' },
        { service: 'session-memory-compact', method: 'compactIfNeeded', priority: 'high' },
        { service: 'insights', method: 'analyzePatterns', priority: 'medium' },
        { service: 'magic-docs', method: 'updateMarkers', priority: 'low' },
    ],
    background_task: [
        { service: 'task-tracker', method: 'visualize', priority: 'high' },
        { service: 'background-task-service', method: 'checkStatus', priority: 'high' },
        { service: 'forked-agent-cache', method: 'cleanupStale', priority: 'medium' },
    ],
    swarm_collaboration: [
        { service: 'teammate-mailbox', method: 'checkPending', priority: 'high' },
        { service: 'swarm-service', method: 'sync', priority: 'high' },
        { service: 'coordinator-service', method: 'checkMode', priority: 'medium' },
        { service: 'team-memory-sync', method: 'sync', priority: 'low' },
    ],
    idle: [
        { service: 'claude-ai-limits', method: 'checkLimits', priority: 'high' },
        { service: 'token-estimation', method: 'report', priority: 'low' },
    ],
    unknown: [],
};
// ============================================================================
// State
// ============================================================================
const DEFAULT_CONFIG = {
    enabled: true,
    autoDetect: true,
    proactiveCall: true,
    minInterval: 60, // 60秒
    maxCallsPerScene: 3,
};
let config = DEFAULT_CONFIG;
let stats = {
    totalScenesDetected: 0,
    totalCallsMade: 0,
    callsByScene: {},
    callsByService: {},
    lastDetection: 0,
    lastCall: 0,
};
let currentScene = null;
// ============================================================================
// Scene Detection
// ============================================================================
export function detectScene(context) {
    const signals = context || detectSignalsFromEnvironment();
    const now = Date.now();
    // 计算每个场景的匹配分数
    const sceneScores = {};
    for (const [scene, expectedSignals] of Object.entries(SCENE_SIGNALS)) {
        if (expectedSignals.length === 0)
            continue;
        const matched = signals.filter(s => expectedSignals.some(expected => s.toLowerCase().includes(expected.toLowerCase())));
        sceneScores[scene] = {
            score: matched.length / expectedSignals.length,
            matched,
        };
    }
    // 选择最高分数的场景
    let bestScene = 'unknown';
    let bestScore = 0;
    let bestMatched = [];
    for (const [scene, data] of Object.entries(sceneScores)) {
        if (data.score > bestScore) {
            bestScene = scene;
            bestScore = data.score;
            bestMatched = data.matched;
        }
    }
    // 更新统计
    stats.totalScenesDetected++;
    stats.lastDetection = now;
    stats.callsByScene[bestScene] = (stats.callsByScene[bestScene] || 0) + 1;
    currentScene = {
        scene: bestScene,
        confidence: bestScore,
        signals: bestMatched,
        timestamp: now,
    };
    return currentScene;
}
function detectSignalsFromEnvironment() {
    const signals = [];
    // 从运行时环境检测
    const runtime = process.env.OPENCLAW_RUNTIME || '';
    if (runtime.includes('feishu'))
        signals.push('channel=feishu');
    if (runtime.includes('discord'))
        signals.push('channel=discord');
    // 从最近文件操作检测（假设有日志）
    // 实际实现可以从某个状态文件读取
    return signals;
}
// ============================================================================
// Service Dispatch
// ============================================================================
export async function dispatchServices(scene) {
    if (!config.enabled || !config.proactiveCall) {
        return [];
    }
    const now = Date.now();
    if (now - stats.lastCall < config.minInterval * 1000) {
        return []; // 调用间隔限制
    }
    const services = SCENE_SERVICES[scene.scene] || [];
    const callsToMake = services
        .filter(s => s.priority === 'high' || (scene.confidence > 0.5 && s.priority === 'medium'))
        .slice(0, config.maxCallsPerScene);
    // 执行调用
    for (const call of callsToMake) {
        try {
            // 这里需要实际调用服务
            // 目前只是记录统计
            stats.totalCallsMade++;
            stats.callsByService[call.service] = (stats.callsByService[call.service] || 0) + 1;
            stats.lastCall = now;
        }
        catch (e) {
            // 忽略调用失败
        }
    }
    return callsToMake;
}
// ============================================================================
// Smart Dispatch - 一键智能化
// ============================================================================
export async function smartDispatch(context) {
    const scene = detectScene(context);
    const calls = await dispatchServices(scene);
    const summary = `Scene: ${scene.scene} (${(scene.confidence * 100).toFixed(0)}% confidence)\n` +
        `Signals: ${scene.signals.join(', ') || 'none'}\n` +
        `Calls: ${calls.length > 0 ? calls.map(c => `${c.service}.${c.method}`).join(', ') : 'none'}`;
    return { scene, calls, summary };
}
// ============================================================================
// API
// ============================================================================
export function getDispatcherStats() {
    return { ...stats, config, currentScene };
}
export function setDispatcherConfig(newConfig) {
    config = { ...config, ...newConfig };
}
export function getCurrentScene() {
    return currentScene;
}
export function resetDispatcher() {
    stats = {
        totalScenesDetected: 0,
        totalCallsMade: 0,
        callsByScene: {},
        callsByService: {},
        lastDetection: 0,
        lastCall: 0,
    };
    currentScene = null;
}
// ============================================================================
// Export Service
// ============================================================================
export const smartDispatcher = {
    detectScene,
    dispatchServices,
    smartDispatch,
    getStats: getDispatcherStats,
    setConfig: setDispatcherConfig,
    getCurrentScene,
    reset: resetDispatcher,
};
export default smartDispatcher;
//# sourceMappingURL=smart-dispatcher.js.map