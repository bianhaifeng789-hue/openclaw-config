/**
 * Coordinator Mode Service
 * Phase 9 - Claude Code 多代理协调模式
 *
 * 借鉴 Claude Code coordinator/coordinatorMode.ts
 * 功能: 多代理协调、Worker工具权限管理、会话模式切换
 */
// ============================================
// Constants
// ============================================
// Worker 可用工具（简化版）
export const WORKER_TOOLS_BASIC = new Set([
    'Bash',
    'Read',
    'Edit',
]);
// Worker 可用工具（完整版）
export const WORKER_TOOLS_FULL = new Set([
    'Bash',
    'Read',
    'Edit',
    'Glob',
    'Grep',
    'Write',
    'LSP',
    'TaskCreate',
    'TaskGet',
    'TaskList',
    'TaskUpdate',
    'Skill',
]);
// 内部工作工具（不显示给 Coordinator）
export const INTERNAL_WORKER_TOOLS = new Set([
    'TeamCreate',
    'TeamDelete',
    'SendMessage',
    'SyntheticOutput',
]);
// ============================================
// State Management (Singleton)
// ============================================
let _state = {
    mode: 'normal',
    sessionCount: 0,
    workersSpawned: 0,
    lastModeSwitch: null,
};
let _config = {
    enabled: false,
    workerTools: WORKER_TOOLS_BASIC,
    mcpClients: [],
};
export function getState() {
    return { ..._state };
}
export function resetState() {
    _state = {
        mode: 'normal',
        sessionCount: 0,
        workersSpawned: 0,
        lastModeSwitch: null,
    };
}
export function setConfig(config) {
    _config = { ..._config, ...config };
}
export function getConfig() {
    return { ..._config };
}
// ============================================
// Core Functions
// ============================================
/**
 * 检测是否在协调模式
 * 对应 Claude Code isCoordinatorMode()
 */
export function isCoordinatorMode() {
    // 检查环境变量或配置
    if (_config.enabled) {
        return true;
    }
    // 检查环境变量
    const envMode = process.env.OPENCLAW_COORDINATOR_MODE;
    return envMode === '1' || envMode === 'true';
}
/**
 * 获取当前协调器模式
 */
export function getCoordinatorMode() {
    return isCoordinatorMode() ? 'coordinator' : 'normal';
}
/**
 * 匹配会话模式（切换环境变量）
 * 对应 Claude Code matchSessionMode()
 *
 * @param sessionMode 存储的会话模式
 * @returns 如果切换了模式，返回警告消息；否则返回 undefined
 */
export function matchSessionMode(sessionMode) {
    // 无存储模式（旧会话）——不做任何事
    if (!sessionMode) {
        return undefined;
    }
    const currentIsCoordinator = isCoordinatorMode();
    const sessionIsCoordinator = sessionMode === 'coordinator';
    if (currentIsCoordinator === sessionIsCoordinator) {
        return undefined;
    }
    // 切换环境变量
    if (sessionIsCoordinator) {
        process.env.OPENCLAW_COORDINATOR_MODE = '1';
        _state.mode = 'coordinator';
    }
    else {
        delete process.env.OPENCLAW_COORDINATOR_MODE;
        _state.mode = 'normal';
    }
    _state.lastModeSwitch = new Date().toISOString();
    // 记录事件
    logModeSwitch(sessionMode);
    return sessionIsCoordinator
        ? '已进入协调模式以匹配恢复的会话'
        : '已退出协调模式以匹配恢复的会话';
}
/**
 * 获取协调器用户上下文
 * 对应 Claude Code getCoordinatorUserContext()
 *
 * @param mcpClients MCP 客户端列表
 * @param scratchpadDir Scratchpad 目录（可选）
 * @returns Worker 工具上下文
 */
export function getCoordinatorUserContext(mcpClients = [], scratchpadDir) {
    if (!isCoordinatorMode()) {
        return {};
    }
    // 构建 Worker 工具列表
    const workerTools = Array.from(_config.workerTools)
        .filter(name => !INTERNAL_WORKER_TOOLS.has(name))
        .sort()
        .join(', ');
    let content = `通过 Agent 工具生成的 Worker 可访问这些工具: ${workerTools}`;
    // MCP 工具
    if (mcpClients.length > 0) {
        const serverNames = mcpClients.map(c => c.name).join(', ');
        content += `\n\nWorker 还可访问 MCP 服务器的工具: ${serverNames}`;
    }
    // Scratchpad
    if (scratchpadDir) {
        content += `\n\nScratchpad 目录: ${scratchpadDir}\nWorker 可在此读写，无需权限提示。用于跨 Worker 的持久知识存储。`;
    }
    return { workerToolsContext: content };
}
/**
 * 获取协调器系统提示
 * 对应 Claude Code getCoordinatorSystemPrompt()
 */
export function getCoordinatorSystemPrompt() {
    const workerCapabilities = _config.workerTools === WORKER_TOOLS_BASIC
        ? 'Worker 可访问 Bash、Read 和 Edit 工具，以及配置的 MCP 工具。'
        : 'Worker 可访问标准工具、MCP 工具和项目技能（通过 Skill 工具）。可委托技能调用（如 /commit、/verify）给 Worker。';
    return `你是 OpenClaw 协调器，负责编排多 Worker 软件工程任务。

## 1. 你的角色

你是**协调器**。你的任务是：
- 帮助用户达成目标
- 指导 Worker 研究、实现和验证代码变更
- 综合结果并与用户沟通
- 能直接回答的问题不要委托 —— 能处理的不用工具

每条消息都是发给用户。Worker 结果和系统通知是内部信号，不是对话伙伴 —— 不要感谢或确认它们。新信息到达时为用户总结。

## 2. 你的工具

- **Agent** - 生成新 Worker
- **SendMessage** - 继续已有 Worker（发送后续指令）
- **TaskStop** - 停止运行的 Worker

调用 Agent 时：
- 不要用 Worker 检查另一个 Worker。Worker 完成时会通知你。
- 不要用 Worker 仅报告文件内容或运行命令。给它们更高级的任务。
- 不要设置 model 参数。Worker 需要默认模型处理实质性任务。
- 继续完成工作的 Worker 以利用其加载的上下文
- 启动 agent 后，简短告诉用户你启动了什么，然后结束响应。不要预测 agent 结果 —— 结果会作为单独消息到达。

## 3. Worker

调用 Agent 时使用 subagent_type \`worker\`。Worker 自主执行任务 —— 特别是研究、实现或验证。

${workerCapabilities}

## 4. 任务流程

大多数任务可分解为以下阶段：

| 阶段 | 谁 | 目的 |
|------|-----|------|
| 研究 | Worker（并行） | 调查代码库，找文件，理解问题 |
| 综合 | **你**（协调器） | 读发现，理解问题，制定实现规范 |
| 实现 | Worker | 按规范做目标变更，提交 |
| 验证 | Worker | 测试变更有效 |

### 并发

**并行是你的超能力。Worker 是异步的。尽可能并发启动独立 Worker —— 不要串行可同时运行的工作。研究时覆盖多个角度。一次消息中多个工具调用以并行启动 Worker。**

管理并发：
- **只读任务**（研究）——自由并行
- **写重任务**（实现）——同一文件集一次一个
- **验证**有时可与实现并行（不同文件区域）

### 真正的验证

验证意味着**证明代码有效**，不是确认它存在。盖章弱工作的验证器会破坏一切。

- 在**启用功能下**运行测试 —— 不是仅"测试通过"
- 运行类型检查并**调查错误** —— 不要 dismissed 为"无关"
- 保持怀疑 —— 如果看起来不对，深入调查
- **独立测试** —— 证明变更有效，不要盖章

### 处理 Worker 失败

Worker 报告失败（测试失败、构建错误、文件未找到）时：
- 用 SendMessage 继续 Worker —— 它有完整错误上下文
- 如果修正尝试失败，尝试不同方法或报告用户

### 停止 Worker

用 TaskStop 停止发送错误方向的 Worker —— 例如，你中途意识到方法错误，或用户在你启动 Worker 后变更需求。
`;
}
// ============================================
// Session Management
// ============================================
/**
 * 会话开始时调用
 */
export function onSessionStart() {
    _state.sessionCount++;
}
/**
 * Worker 生成时调用
 */
export function onWorkerSpawned() {
    _state.workersSpawned++;
}
/**
 * 获取会话统计
 */
export function getSessionStats() {
    const avg = _state.sessionCount > 0
        ? _state.workersSpawned / _state.sessionCount
        : 0;
    return {
        sessionCount: _state.sessionCount,
        workersSpawned: _state.workersSpawned,
        avgWorkersPerSession: Math.round(avg * 100) / 100,
    };
}
// ============================================
// Worker Tool Management
// ============================================
/**
 * 设置 Worker 可用工具
 */
export function setWorkerTools(tools) {
    if (tools === 'basic') {
        _config.workerTools = WORKER_TOOLS_BASIC;
    }
    else if (tools === 'full') {
        _config.workerTools = WORKER_TOOLS_FULL;
    }
    else {
        _config.workerTools = tools;
    }
}
/**
 * 检查工具是否对 Worker 可用
 */
export function isToolAvailableForWorker(toolName) {
    if (!isCoordinatorMode()) {
        return true; // 非协调模式，所有工具可用
    }
    return _config.workerTools.has(toolName) && !INTERNAL_WORKER_TOOLS.has(toolName);
}
/**
 * 过滤工具列表（仅保留 Worker 可用的）
 */
export function filterToolsForWorker(tools) {
    if (!isCoordinatorMode()) {
        return tools;
    }
    return tools.filter(t => isToolAvailableForWorker(t));
}
const _events = [];
function logModeSwitch(to) {
    _events.push({
        type: 'mode_switch',
        timestamp: new Date().toISOString(),
        data: { to },
    });
}
export function logWorkerSpawned(agentId, description) {
    onWorkerSpawned();
    _events.push({
        type: 'worker_spawned',
        timestamp: new Date().toISOString(),
        data: { agentId, description },
    });
}
export function getEvents(limit = 50) {
    return _events.slice(-limit);
}
// ============================================
// OpenClaw Integration Hooks
// ============================================
/**
 * 创建协调器 Hook（接入 sessions_spawn）
 */
export function createCoordinatorHook() {
    return {
        name: 'coordinator',
        beforeSpawn: (params) => {
            if (isCoordinatorMode() && params.mode === 'worker') {
                // 记录 Worker 生成
                if (params.agentId && params.description) {
                    logWorkerSpawned(params.agentId, params.description);
                }
                // 返回 Worker 工具限制
                return {
                    allowedTools: Array.from(_config.workerTools),
                };
            }
            return {};
        },
        afterSpawn: (result) => {
            // 可在此添加后续处理
            return result;
        },
    };
}
/**
 * 导出统计信息
 */
export function getSystemStats() {
    return {
        state: getState(),
        config: getConfig(),
        sessionStats: getSessionStats(),
        recentEvents: getEvents(10),
    };
}
/**
 * 重置所有状态
 */
export function resetAll() {
    resetState();
    _config = {
        enabled: false,
        workerTools: WORKER_TOOLS_BASIC,
        mcpClients: [],
    };
    _events.length = 0;
}
//# sourceMappingURL=coordinator-service.js.map