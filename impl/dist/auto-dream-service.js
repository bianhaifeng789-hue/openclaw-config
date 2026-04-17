/**
 * Phase 14: AutoDream 自动记忆合并
 *
 * 借鉴 Claude Code 的 autoDream 服务
 *
 * 门控顺序（从便宜到昂贵）：
 * 1. Time: hours since lastConsolidatedAt >= minHours (default 24h)
 * 2. Sessions: transcript count >= minSessions (default 5)
 * 3. Lock: no other process mid-consolidation
 *
 * OpenClaw 飞书适配：
 * - 使用 heartbeat 定期检查
 * - 飞书卡片通知合并完成
 * - sessions_spawn forked agent 运行
 */
// ============================================================================
// Default Config
// ============================================================================
const DEFAULT_CONFIG = {
    minHours: 24,
    minSessions: 5,
    enabled: true,
};
const SESSION_SCAN_INTERVAL_MS = 10 * 60 * 1000; // 10 分钟扫描间隔
// ============================================================================
// State Management
// ============================================================================
let state = {
    lastConsolidatedAt: 0,
    sessionCount: 0,
    isLocked: false,
    lockAcquiredBy: null,
    filesTouched: [],
    savedTokens: 0,
    totalRuns: 0,
};
let lastSessionScanAt = 0;
// ============================================================================
// Config Loader
// ============================================================================
/**
 * 获取 AutoDream 配置
 *
 * 飞书场景：从 memory/auto-dream-state.json 加载
 */
export function getAutoDreamConfig() {
    // TODO: 从配置文件加载
    return DEFAULT_CONFIG;
}
/**
 * 检查是否启用 AutoDream
 */
export function isAutoDreamEnabled() {
    const config = getAutoDreamConfig();
    return config.enabled;
}
// ============================================================================
// Gate Checks
// ============================================================================
/**
 * 时间门控：距离上次合并是否超过 minHours
 */
export function checkTimeGate(config) {
    const hoursSince = (Date.now() - state.lastConsolidatedAt) / 3_600_000;
    return hoursSince >= config.minHours;
}
/**
 * 会话门控：累计会话数是否达到 minSessions
 */
export function checkSessionGate(config) {
    return state.sessionCount >= config.minSessions;
}
/**
 * 锁门控：是否有其他进程正在合并
 */
export function checkLockGate() {
    return !state.isLocked;
}
/**
 * 扫描节流：避免频繁扫描
 */
export function checkScanThrottle() {
    const sinceScanMs = Date.now() - lastSessionScanAt;
    return sinceScanMs >= SESSION_SCAN_INTERVAL_MS;
}
/**
 * 综合门控检查
 *
 * 顺序：Time → Session → Lock
 */
export function shouldRunAutoDream() {
    const config = getAutoDreamConfig();
    if (!config.enabled) {
        return { shouldRun: false, reason: 'disabled' };
    }
    if (!checkTimeGate(config)) {
        const hoursSince = Math.floor((Date.now() - state.lastConsolidatedAt) / 3_600_000);
        return { shouldRun: false, reason: `time_gate: ${hoursSince}h < ${config.minHours}h` };
    }
    if (!checkScanThrottle()) {
        const sinceScanMs = Math.floor((Date.now() - lastSessionScanAt) / 60_000);
        return { shouldRun: false, reason: `scan_throttle: ${sinceScanMs}m ago` };
    }
    if (!checkSessionGate(config)) {
        return { shouldRun: false, reason: `session_gate: ${state.sessionCount} < ${config.minSessions}` };
    }
    if (!checkLockGate()) {
        return { shouldRun: false, reason: 'locked' };
    }
    return { shouldRun: true, reason: 'all_gates_passed' };
}
// ============================================================================
// Lock Management
// ============================================================================
/**
 * 尝试获取合并锁
 */
export async function tryAcquireLock() {
    if (state.isLocked) {
        return false;
    }
    state.isLocked = true;
    state.lockAcquiredBy = `session_${Date.now()}`;
    return true;
}
/**
 * 释放合并锁
 */
export async function releaseLock() {
    state.isLocked = false;
    state.lockAcquiredBy = null;
}
/**
 * 回滚锁（失败时）
 */
export async function rollbackLock(priorMtime) {
    state.isLocked = false;
    state.lockAcquiredBy = null;
    state.lastConsolidatedAt = priorMtime; // 回退时间
}
// ============================================================================
// Session Tracking
// ============================================================================
/**
 * 增加会话计数
 */
export function incrementSessionCount() {
    state.sessionCount++;
}
/**
 * 获取会话列表（自上次合并以来）
 *
 * OpenClaw 适配：扫描 memory/ 目录的修改时间
 */
export async function listSessionsTouchedSince(since) {
    // TODO: 实际扫描 memory/*.md 文件
    // 暂时返回模拟数据
    const now = Date.now();
    const sessions = [];
    // 基于当前 sessionCount 生成模拟会话 ID
    for (let i = 0; i < state.sessionCount; i++) {
        sessions.push(`session_${since + i * 3600_000}`);
    }
    return sessions;
}
// ============================================================================
// Consolidation Prompt
// ============================================================================
/**
 * 构建合并提示
 *
 * 借鉴 Claude Code 的 consolidationPrompt.ts
 */
export function buildConsolidationPrompt(memoryRoot, sessionsToReview) {
    return `# 记忆合并任务

你是 OpenClaw 的记忆维护助手。请分析以下会话记录，提取有价值的信息并更新 MEMORY.md。

## 记忆目录
${memoryRoot}

## 待合并会话
${sessionsToReview.map(id => `- ${id}`).join('\n')}

## 任务要求
1. 识别用户偏好、习惯、重要决策
2. 更新 MEMORY.md 的 AUTO_UPDATE 区块
3. 保持信息简洁、有价值
4. 避免重复已有内容

## 输出格式
请直接更新 MEMORY.md，不需要额外解释。

## 工具限制
- Bash 仅限 read-only 命令（ls, find, grep, cat, stat, wc, head, tail）
- 禁止写入操作
- 禁止网络请求`;
}
// ============================================================================
// Run AutoDream
// ============================================================================
/**
 * 运行 AutoDream 合并
 *
 * OpenClaw 适配：
 * 1. 检查门控
 * 2. 获取锁
 * 3. 生成提示
 * 4. sessions_spawn forked agent
 * 5. 更新 MEMORY.md
 * 6. 发送飞书通知
 * 7. 释放锁
 */
export async function runAutoDream() {
    const startTime = Date.now();
    const gateCheck = shouldRunAutoDream();
    if (!gateCheck.shouldRun) {
        return {
            success: false,
            filesUpdated: [],
            tokensSaved: 0,
            durationMs: 0,
            error: gateCheck.reason,
        };
    }
    // 获取锁
    const lockAcquired = await tryAcquireLock();
    if (!lockAcquired) {
        return {
            success: false,
            filesUpdated: [],
            tokensSaved: 0,
            durationMs: 0,
            error: 'lock_failed',
        };
    }
    const priorMtime = state.lastConsolidatedAt;
    try {
        // 获取待合并会话
        const sessions = await listSessionsTouchedSince(priorMtime);
        // 构建提示
        const prompt = buildConsolidationPrompt('~/.openclaw/workspace/memory/', sessions);
        // TODO: 实际调用 sessions_spawn
        // 暂时模拟成功
        const filesUpdated = ['MEMORY.md'];
        const tokensSaved = 5000;
        // 更新状态
        state.lastConsolidatedAt = Date.now();
        state.filesTouched = filesUpdated;
        state.savedTokens += tokensSaved;
        state.totalRuns++;
        state.sessionCount = 0; // 重置会话计数
        // 释放锁
        await releaseLock();
        const durationMs = Date.now() - startTime;
        return {
            success: true,
            filesUpdated,
            tokensSaved,
            durationMs,
        };
    }
    catch (error) {
        // 回滚锁
        await rollbackLock(priorMtime);
        return {
            success: false,
            filesUpdated: [],
            tokensSaved: 0,
            durationMs: Date.now() - startTime,
            error: String(error),
        };
    }
}
// ============================================================================
// State Accessors
// ============================================================================
export function getState() {
    return { ...state };
}
export function resetState() {
    state = {
        lastConsolidatedAt: 0,
        sessionCount: 0,
        isLocked: false,
        lockAcquiredBy: null,
        filesTouched: [],
        savedTokens: 0,
        totalRuns: 0,
    };
    lastSessionScanAt = 0;
}
// ============================================================================
// HEARTBEAT Integration
// ============================================================================
/**
 * Heartbeat 检查点
 *
 * 供 HEARTBEAT.md 的 auto-dream 任务调用
 */
export async function checkAutoDreamForHeartbeat() {
    const check = shouldRunAutoDream();
    return {
        shouldRun: check.shouldRun,
        state: getState(),
        reason: check.reason,
    };
}
// ============================================================================
// Feishu Notification
// ============================================================================
/**
 * 构建飞书合并完成卡片
 */
export function createDreamCompletionCard(result) {
    if (!result.success) {
        return {
            title: '❌ AutoDream 合并失败',
            content: `原因: ${result.error}\n耗时: ${result.durationMs}ms`,
        };
    }
    return {
        title: '✅ AutoDream 合并完成',
        content: `更新文件: ${result.filesUpdated.join(', ')}
节省 tokens: ${result.tokensSaved}
耗时: ${Math.round(result.durationMs / 1000)}s

累计合并: ${state.totalRuns} 次
累计节省: ${state.savedTokens} tokens`,
    };
}
// ============================================================================
// AutoDream Service Object
// ============================================================================
export const autoDreamService = {
    getConfig: getAutoDreamConfig,
    isEnabled: isAutoDreamEnabled,
    shouldRun: shouldRunAutoDream,
    run: runAutoDream,
    getState,
    resetState,
    incrementSessionCount,
    checkForHeartbeat: checkAutoDreamForHeartbeat,
    createCompletionCard: createDreamCompletionCard,
    // Gate checks
    checkTimeGate,
    checkSessionGate,
    checkLockGate,
    checkScanThrottle,
    // Lock management
    tryAcquireLock,
    releaseLock,
    rollbackLock,
};
export default autoDreamService;
//# sourceMappingURL=auto-dream-service.js.map