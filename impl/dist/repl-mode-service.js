/**
 * REPL Mode Service - REPL 交互模式
 *
 * 借鉴 Claude Code 的 REPLTool 模块，支持：
 * - REPL 模式切换
 * - 原始工具隐藏（REPL_ONLY_TOOLS）
 * - 批量操作支持
 * - 虚拟消息渲染
 */
// ============================================================================
// Constants
// ============================================================================
export const REPL_TOOL_NAME = 'REPL';
/**
 * REPL 模式下隐藏的原始工具
 * 强制模型使用 REPL 进行批量操作
 */
export const REPL_ONLY_TOOLS = new Set([
    'FileReadTool',
    'FileWriteTool',
    'FileEditTool',
    'GlobTool',
    'GrepTool',
    'BashTool',
    'NotebookEditTool',
    'AgentTool',
]);
/**
 * 原始工具列表
 */
export const REPL_PRIMITIVE_TOOLS = [
    'FileReadTool',
    'FileWriteTool',
    'FileEditTool',
    'GlobTool',
    'GrepTool',
    'BashTool',
    'NotebookEditTool',
    'AgentTool',
];
// ============================================================================
// REPL Mode Detection
// ============================================================================
/**
 * 检测 REPL 模式是否启用
 *
 * 规则：
 * - CLAUDE_CODE_REPL=0 禁用
 * - CLAUDE_REPL_MODE=1 强制启用
 * - USER_TYPE=ant 且 CLI 入口默认启用
 */
export function isReplModeEnabled() {
    if (process.env.CLAUDE_CODE_REPL === '0')
        return false;
    if (process.env.CLAUDE_REPL_MODE === '1')
        return true;
    // 飞书场景默认启用 REPL
    if (process.env.OPENCLAW_CHANNEL === 'feishu')
        return true;
    return (process.env.USER_TYPE === 'ant' &&
        process.env.CLAUDE_CODE_ENTRYPOINT === 'cli');
}
/**
 * 获取当前 REPL 配置
 */
export function getReplConfig() {
    const enabled = isReplModeEnabled();
    const mode = enabled ? 'interactive' : 'disabled';
    return {
        mode,
        enabled,
        primitiveTools: [...REPL_PRIMITIVE_TOOLS],
        hiddenTools: enabled ? REPL_ONLY_TOOLS : new Set(),
    };
}
// ============================================================================
// REPL Command Processor
// ============================================================================
export class ReplProcessor {
    config;
    batches = new Map();
    commandQueue = [];
    constructor() {
        this.config = getReplConfig();
    }
    /**
     * 创建批量命令
     */
    createBatch(commands) {
        const id = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const fullCommands = commands.map((cmd, idx) => ({
            id: `${id}-cmd-${idx}`,
            type: cmd.type || 'read',
            args: cmd.args || {},
            status: 'pending',
        }));
        const batch = {
            id,
            commands: fullCommands,
            status: 'pending',
        };
        this.batches.set(id, batch);
        return batch;
    }
    /**
     * 执行批量命令
     */
    async executeBatch(batchId) {
        const batch = this.batches.get(batchId);
        if (!batch) {
            throw new Error(`Batch ${batchId} not found`);
        }
        batch.status = 'running';
        batch.startedAt = Date.now();
        // 并行执行命令
        const promises = batch.commands.map(cmd => this.executeCommand(cmd));
        await Promise.all(promises);
        batch.status = batch.commands.every(c => c.status === 'completed')
            ? 'completed'
            : 'failed';
        batch.completedAt = Date.now();
        return batch;
    }
    /**
     * 执行单个命令
     */
    async executeCommand(command) {
        command.status = 'running';
        try {
            // 模拟执行（实际实现需要调用对应工具）
            await new Promise(resolve => setTimeout(resolve, 50));
            command.status = 'completed';
            command.result = `Executed ${command.type} with args: ${JSON.stringify(command.args)}`;
        }
        catch (error) {
            command.status = 'failed';
            command.error = error instanceof Error ? error.message : 'Unknown error';
        }
    }
    /**
     * 检查工具是否被隐藏
     */
    isToolHidden(toolName) {
        return this.config.hiddenTools.has(toolName);
    }
    /**
     * 获取所有批量执行记录
     */
    getBatches() {
        return Array.from(this.batches.values());
    }
    /**
     * 获取配置
     */
    getConfig() {
        return this.config;
    }
}
export function createVirtualMessage(command, collapsed = true) {
    return {
        type: 'repl-virtual',
        toolName: command.type,
        toolArgs: command.args,
        result: command.result,
        error: command.error,
        collapsed,
    };
}
/**
 * 折叠读取和搜索结果
 */
export function collapseReadSearchResults(messages) {
    const collapsed = [];
    let currentGroup = [];
    for (const msg of messages) {
        if (msg.toolName === 'read' || msg.toolName === 'grep' || msg.toolName === 'glob') {
            currentGroup.push(msg);
        }
        else {
            if (currentGroup.length > 0) {
                collapsed.push({
                    type: 'repl-virtual',
                    toolName: 'collapsed-group',
                    toolArgs: { count: currentGroup.length },
                    collapsed: true,
                });
                currentGroup = [];
            }
            collapsed.push(msg);
        }
    }
    if (currentGroup.length > 0) {
        collapsed.push({
            type: 'repl-virtual',
            toolName: 'collapsed-group',
            toolArgs: { count: currentGroup.length },
            collapsed: true,
        });
    }
    return collapsed;
}
class ReplModeServiceImpl {
    batchesCreated = 0;
    commandsExecuted = 0;
    processor = null;
    createProcessor() {
        this.processor = new ReplProcessor();
        return this.processor;
    }
    isReplEnabled() {
        return isReplModeEnabled();
    }
    isToolHidden(toolName) {
        if (!this.processor) {
            this.processor = new ReplProcessor();
        }
        return this.processor.isToolHidden(toolName);
    }
    recordBatchCreated() {
        this.batchesCreated++;
    }
    recordCommandExecuted() {
        this.commandsExecuted++;
    }
    getStats() {
        return {
            batchesCreated: this.batchesCreated,
            commandsExecuted: this.commandsExecuted,
        };
    }
    reset() {
        this.batchesCreated = 0;
        this.commandsExecuted = 0;
        this.processor = null;
    }
}
export const replModeService = new ReplModeServiceImpl();
// ============================================================================
// Export Stats for Heartbeat
// ============================================================================
export function getStats() {
    return replModeService.getStats();
}
export function reset() {
    replModeService.reset();
}
//# sourceMappingURL=repl-mode-service.js.map