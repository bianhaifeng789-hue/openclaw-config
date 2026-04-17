/**
 * Hooks System - React Hooks 系统适配
 *
 * 借鉴 Claude Code 的 hooks 系统：
 * - hooks/useCanUseTool.ts - 工具权限检查
 * - hooks/useStatus.ts - 状态管理
 * - hooks/useInboxPoller.ts - 收件箱轮询
 * - hooks/useAfterFirstRender.ts - 首次渲染后执行
 *
 * OpenClaw 适配：
 * - 非 React 环境（使用函数式适配）
 * - 飞书场景下的轮询和状态
 */
// 权限上下文（全局状态）
let permissionContext = {
    permissionMode: 'confirm',
    allowedTools: new Set(),
    deniedTools: new Set(),
    recentDenials: 0,
    shouldAvoidPermissionPrompts: false
};
/**
 * Get Permission Context
 */
export function getPermissionContext() {
    return { ...permissionContext };
}
/**
 * Set Permission Context
 */
export function setPermissionContext(context) {
    permissionContext = {
        ...permissionContext,
        ...context
    };
}
/**
 * Can Use Tool
 *
 * 检查是否可以使用工具
 *
 * @param toolName - 工具名称
 * @returns 是否可以使用
 */
export function canUseTool(toolName) {
    const context = getPermissionContext();
    // 检查黑名单
    if (context.deniedTools.has(toolName)) {
        return {
            allowed: false,
            reason: '工具在黑名单中',
            needsPrompt: false
        };
    }
    // 检查白名单
    if (context.allowedTools.has(toolName)) {
        return {
            allowed: true,
            reason: '工具在白名单中',
            needsPrompt: false
        };
    }
    // 根据权限模式
    switch (context.permissionMode) {
        case 'auto':
            // 自动模式：所有工具都允许
            return {
                allowed: true,
                reason: '自动模式允许所有工具',
                needsPrompt: false
            };
        case 'plan':
            // Plan 模式：只允许读取类工具
            const readOnlyTools = ['read', 'ls', 'grep', 'find', 'cat', 'head', 'tail'];
            if (readOnlyTools.includes(toolName)) {
                return {
                    allowed: true,
                    reason: 'Plan 模式允许只读工具',
                    needsPrompt: false
                };
            }
            return {
                allowed: false,
                reason: 'Plan 模式禁止写入工具',
                needsPrompt: true
            };
        case 'confirm':
            // Confirm 模式：需要确认
            if (context.shouldAvoidPermissionPrompts) {
                return {
                    allowed: true,
                    reason: '避免权限提示模式',
                    needsPrompt: false
                };
            }
            return {
                allowed: true,
                reason: '需要用户确认',
                needsPrompt: true
            };
        case 'restricted':
            // Restricted 模式：只允许白名单工具
            return {
                allowed: context.allowedTools.has(toolName),
                reason: context.allowedTools.has(toolName)
                    ? '白名单工具'
                    : '非白名单工具，禁止',
                needsPrompt: false
            };
        default:
            return {
                allowed: false,
                reason: '未知权限模式',
                needsPrompt: true
            };
    }
}
// 状态上下文（全局状态）
let statusContext = {
    status: 'idle',
    startTime: Date.now(),
    history: []
};
// 状态变更监听器
const statusListeners = [];
/**
 * Get Status
 */
export function getStatus() {
    return { ...statusContext };
}
/**
 * Set Status
 *
 * 设置状态并通知监听器
 */
export function setStatus(status, description, currentTool) {
    const previousStatus = statusContext.status;
    const previousStartTime = statusContext.startTime;
    // 记录历史
    const historyEntry = {
        status: previousStatus,
        timestamp: previousStartTime,
        durationMs: Date.now() - previousStartTime
    };
    statusContext = {
        status,
        description,
        currentTool,
        startTime: Date.now(),
        history: [...statusContext.history, historyEntry]
    };
    // 通知监听器
    for (const listener of statusListeners) {
        listener(statusContext);
    }
}
/**
 * Subscribe Status Changes
 *
 * 订阅状态变更
 */
export function subscribeStatus(listener) {
    statusListeners.push(listener);
    // 返回取消订阅函数
    return () => {
        const index = statusListeners.indexOf(listener);
        if (index > -1) {
            statusListeners.splice(index, 1);
        }
    };
}
// 轮询上下文（全局状态）
let pollerContext = {
    isPolling: false,
    pollInterval: 30_000, // 30 秒
    lastPollTime: 0,
    newMessagesCount: 0,
    hasError: false
};
// 轮询任务
let pollerTask = null;
// 消息处理器
const messageHandlers = [];
/**
 * Start Inbox Poller
 *
 * 启动收件箱轮询
 */
export function startInboxPoller(pollInterval = 30_000) {
    if (pollerContext.isPolling) {
        return; // 已经在轮询
    }
    pollerContext.isPolling = true;
    pollerContext.pollInterval = pollInterval;
    // 开始轮询任务
    pollerTask = setInterval(async () => {
        try {
            await pollInbox();
        }
        catch (error) {
            pollerContext.hasError = true;
            pollerContext.error = String(error);
        }
    }, pollInterval);
}
/**
 * Stop Inbox Poller
 *
 * 停止收件箱轮询
 */
export function stopInboxPoller() {
    if (pollerTask) {
        clearInterval(pollerTask);
        pollerTask = null;
    }
    pollerContext.isPolling = false;
}
/**
 * Poll Inbox
 *
 * 执行收件箱检查
 */
async function pollInbox() {
    pollerContext.lastPollTime = Date.now();
    // 实际实现需要调用飞书 API
    // 这里是占位
    const messages = []; // await fetchNewMessages()
    if (messages.length > 0) {
        pollerContext.newMessagesCount += messages.length;
        // 触发消息处理器
        for (const handler of messageHandlers) {
            await handler(messages);
        }
    }
    pollerContext.hasError = false;
    pollerContext.error = undefined;
}
/**
 * Register Message Handler
 *
 * 注册消息处理器
 */
export function registerMessageHandler(handler) {
    messageHandlers.push(handler);
    return () => {
        const index = messageHandlers.indexOf(handler);
        if (index > -1) {
            messageHandlers.splice(index, 1);
        }
    };
}
/**
 * Get Poller Context
 */
export function getPollerContext() {
    return { ...pollerContext };
}
// ============================================================================
// After First Render
// ============================================================================
/**
 * useAfterFirstRender - 首次渲染后执行
 *
 * 借鉴 Claude Code 的 useAfterFirstRender hook
 *
 * 功能：
 * - 在首次"渲染"后执行回调
 * - 用于初始化和延迟任务
 */
let hasRendered = false;
const afterRenderCallbacks = [];
/**
 * Mark First Render
 *
 * 标记首次渲染完成
 */
export function markFirstRender() {
    if (hasRendered) {
        return;
    }
    hasRendered = true;
    // 执行所有回调
    for (const callback of afterRenderCallbacks) {
        callback();
    }
    // 清空回调列表
    afterRenderCallbacks.length = 0;
}
/**
 * After First Render
 *
 * 注册首次渲染后执行的回调
 */
export function afterFirstRender(callback) {
    if (hasRendered) {
        // 已经渲染过了，立即执行
        callback();
    }
    else {
        // 添加到队列
        afterRenderCallbacks.push(callback);
    }
}
/**
 * Calculate Virtual Scroll
 *
 * 计算虚拟滚动参数
 */
export function calculateVirtualScroll(scrollTop, config) {
    const overscan = config.overscan ?? 3;
    const startIndex = Math.max(0, Math.floor(scrollTop / config.itemHeight) - overscan);
    const endIndex = Math.min(config.itemCount - 1, Math.floor((scrollTop + config.containerHeight) / config.itemHeight) + overscan);
    const visibleIndices = [];
    for (let i = startIndex; i <= endIndex; i++) {
        visibleIndices.push(i);
    }
    const offsetY = startIndex * config.itemHeight;
    return {
        visibleIndices,
        startIndex,
        endIndex,
        offsetY
    };
}
/**
 * Match Typeahead
 *
 * 匹配补全选项
 */
export function matchTypeahead(query, allOptions) {
    const queryLower = query.toLowerCase();
    // 计算匹配分数
    const scoredOptions = allOptions.map(option => {
        const labelLower = option.label.toLowerCase();
        const valueLower = option.value.toLowerCase();
        // 完全匹配最高
        if (labelLower === queryLower || valueLower === queryLower) {
            return { ...option, score: 100 };
        }
        // 开头匹配
        if (labelLower.startsWith(queryLower) || valueLower.startsWith(queryLower)) {
            return { ...option, score: 80 };
        }
        // 包含匹配
        if (labelLower.includes(queryLower) || valueLower.includes(queryLower)) {
            return { ...option, score: 60 };
        }
        // 不匹配
        return { ...option, score: 0 };
    });
    // 过滤和排序
    const options = scoredOptions
        .filter(o => o.score > 0)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    return {
        options,
        highlightedIndex: 0,
        hasMatch: options.length > 0
    };
}
// 取消上下文（全局状态）
let cancelContext = {
    canCancel: false,
    isCancelled: false
};
/**
 * Get Cancel Context
 */
export function getCancelContext() {
    return { ...cancelContext };
}
/**
 * Set Can Cancel
 *
 * 设置是否可以取消
 */
export function setCanCancel(canCancel, abortController) {
    cancelContext = {
        canCancel,
        isCancelled: false,
        abortController
    };
}
/**
 * Cancel Request
 *
 * 取消当前请求
 */
export function cancelRequest() {
    if (!cancelContext.canCancel || cancelContext.isCancelled) {
        return false;
    }
    if (cancelContext.abortController) {
        cancelContext.abortController.abort();
    }
    cancelContext.isCancelled = true;
    cancelContext.canCancel = false;
    return true;
}
// ============================================================================
// Blink Effect
// ============================================================================
/**
 * useBlink - 闪烁效果适配
 *
 * 借鉴 Claude Code 的 useBlink hook
 *
 * 功能：
 * - 提供视觉提示（闪烁）
 * - 用于错误或重要消息
 */
let blinkState = false;
let blinkTask = null;
const blinkListeners = [];
/**
 * Start Blink
 *
 * 开始闪烁
 */
export function startBlink(intervalMs = 500) {
    if (blinkTask) {
        return; // 已经在闪烁
    }
    blinkTask = setInterval(() => {
        blinkState = !blinkState;
        // 通知监听器
        for (const listener of blinkListeners) {
            listener(blinkState);
        }
    }, intervalMs);
}
/**
 * Stop Blink
 *
 * 停止闪烁
 */
export function stopBlink() {
    if (blinkTask) {
        clearInterval(blinkTask);
        blinkTask = null;
    }
    blinkState = false;
    // 通知监听器
    for (const listener of blinkListeners) {
        listener(false);
    }
}
/**
 * Subscribe Blink
 *
 * 订阅闪烁状态
 */
export function subscribeBlink(listener) {
    blinkListeners.push(listener);
    return () => {
        const index = blinkListeners.indexOf(listener);
        if (index > -1) {
            blinkListeners.splice(index, 1);
        }
    };
}
// ============================================================================
// Export
// ============================================================================
export const hooksSystem = {
    // Permission
    getPermissionContext,
    setPermissionContext,
    canUseTool,
    // Status
    getStatus,
    setStatus,
    subscribeStatus,
    // Inbox Poller
    startInboxPoller,
    stopInboxPoller,
    registerMessageHandler,
    getPollerContext,
    // After First Render
    markFirstRender,
    afterFirstRender,
    // Virtual Scroll
    calculateVirtualScroll,
    // Typeahead
    matchTypeahead,
    // Cancel Request
    getCancelContext,
    setCanCancel,
    cancelRequest,
    // Blink
    startBlink,
    stopBlink,
    subscribeBlink,
    // Types
};
// Types (moved to separate export)
export default hooksSystem;
//# sourceMappingURL=hooks-system.js.map