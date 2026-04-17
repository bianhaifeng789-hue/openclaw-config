/**
 * Phase 20-23: Task Framework + PluginLoader + SessionStorage + LocalMainSession
 *
 * 补充 Phase 1-13 中未完整实现的功能
 */
let pluginState = {
    installedPlugins: new Map(),
    sessionPlugins: new Map(),
    totalPlugins: 0,
};
export function registerPlugin(manifest) {
    pluginState.installedPlugins.set(manifest.name, manifest);
    pluginState.totalPlugins++;
}
export function getInstalledPlugins() {
    return Array.from(pluginState.installedPlugins.values());
}
export function isPluginInstalled(name) {
    return pluginState.installedPlugins.has(name);
}
let sessionStorageState = {
    transcripts: new Map(),
    currentSessionId: null,
    totalSessions: 0,
};
export function createSessionTranscript(sessionId) {
    const transcript = {
        sessionId,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };
    sessionStorageState.transcripts.set(sessionId, transcript);
    sessionStorageState.currentSessionId = sessionId;
    sessionStorageState.totalSessions++;
    return transcript;
}
export function appendMessageToTranscript(sessionId, message) {
    const transcript = sessionStorageState.transcripts.get(sessionId);
    if (transcript) {
        transcript.messages.push(message);
        transcript.updatedAt = Date.now();
    }
}
export function getTranscript(sessionId) {
    return sessionStorageState.transcripts.get(sessionId) || null;
}
export function getCurrentTranscript() {
    if (!sessionStorageState.currentSessionId)
        return null;
    return getTranscript(sessionStorageState.currentSessionId);
}
let taskFrameworkState = {
    tasks: new Map(),
    totalTasks: 0,
    activeTasks: 0,
};
export function registerFrameworkTask(task) {
    taskFrameworkState.tasks.set(task.id, task);
    taskFrameworkState.totalTasks++;
    if (task.status === 'running') {
        taskFrameworkState.activeTasks++;
    }
}
export function updateFrameworkTask(taskId, updater) {
    const task = taskFrameworkState.tasks.get(taskId);
    if (task) {
        const updated = updater(task);
        taskFrameworkState.tasks.set(taskId, updated);
        // 更新活跃计数
        if (task.status === 'running' && updated.status !== 'running') {
            taskFrameworkState.activeTasks--;
        }
        else if (task.status !== 'running' && updated.status === 'running') {
            taskFrameworkState.activeTasks++;
        }
    }
}
export function getFrameworkTask(taskId) {
    return taskFrameworkState.tasks.get(taskId) || null;
}
export function getActiveFrameworkTasks() {
    return Array.from(taskFrameworkState.tasks.values())
        .filter(t => t.status === 'running');
}
export function createTaskAttachment(task) {
    return {
        type: 'task_status',
        taskId: task.id,
        taskType: task.type,
        status: task.status,
        description: task.description,
        deltaSummary: null,
    };
}
// ============================================================================
// Phase 23: LocalMainSessionTask
// ============================================================================
const TASK_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
function generateMainSessionTaskId() {
    // 模拟随机 ID 生成
    const now = Date.now().toString();
    let id = 's'; // 's' prefix for main session
    for (let i = 0; i < 8; i++) {
        const charCode = now.charCodeAt(i % now.length) || 48;
        id += TASK_ID_ALPHABET[charCode % TASK_ID_ALPHABET.length];
    }
    return id;
}
export function registerMainSessionTask(description) {
    const taskId = generateMainSessionTaskId();
    const abortController = new AbortController();
    const task = {
        id: taskId,
        type: 'main_session',
        status: 'running',
        description,
        startTime: Date.now(),
        messages: [],
        diskLoaded: false,
        pendingMessages: [],
    };
    registerFrameworkTask(task);
    return {
        taskId,
        abortSignal: abortController.signal,
    };
}
export function completeMainSessionTask(taskId) {
    updateFrameworkTask(taskId, (task) => ({
        ...task,
        status: 'completed',
        endTime: Date.now(),
    }));
}
export function failMainSessionTask(taskId, error) {
    updateFrameworkTask(taskId, (task) => ({
        ...task,
        status: 'failed',
        endTime: Date.now(),
        description: `${task.description}\n错误: ${error}`,
    }));
}
// ============================================================================
// Phase 24-28: Low Priority Features (Batch)
// ============================================================================
// Phase 24: Voice Stream STT (Placeholder)
export const voiceStreamSTTService = {
    isEnabled: () => false,
    startStreaming: async () => null,
    stopStreaming: async () => { },
};
// Phase 25: MCP Server Approval (Placeholder)
export const mcpApprovalService = {
    isApproved: (serverName) => true,
    requestApproval: async (serverName) => true,
};
// Phase 26: Remote Managed Settings (Placeholder)
export const remoteSettingsService = {
    isEnabled: () => false,
    getSettings: () => null,
    syncSettings: async () => { },
};
// Phase 27: Team Memory Sync (Placeholder)
export const teamMemorySyncService = {
    isEnabled: () => false,
    syncMemory: async () => { },
    getSharedMemory: () => null,
};
// Phase 28: Settings Sync (Placeholder)
export const settingsSyncService = {
    isEnabled: () => false,
    sync: async () => { },
    getLastSyncTime: () => 0,
};
// ============================================================================
// Unified State Accessors
// ============================================================================
export function getPluginState() {
    return {
        installedPlugins: new Map(pluginState.installedPlugins),
        sessionPlugins: new Map(pluginState.sessionPlugins),
        totalPlugins: pluginState.totalPlugins,
    };
}
export function getSessionStorageState() {
    return {
        transcripts: new Map(sessionStorageState.transcripts),
        currentSessionId: sessionStorageState.currentSessionId,
        totalSessions: sessionStorageState.totalSessions,
    };
}
export function getTaskFrameworkState() {
    return {
        tasks: new Map(taskFrameworkState.tasks),
        totalTasks: taskFrameworkState.totalTasks,
        activeTasks: taskFrameworkState.activeTasks,
    };
}
export function resetAllPhase20to28States() {
    pluginState = {
        installedPlugins: new Map(),
        sessionPlugins: new Map(),
        totalPlugins: 0,
    };
    sessionStorageState = {
        transcripts: new Map(),
        currentSessionId: null,
        totalSessions: 0,
    };
    taskFrameworkState = {
        tasks: new Map(),
        totalTasks: 0,
        activeTasks: 0,
    };
}
// ============================================================================
// Feishu Cards
// ============================================================================
export function createPhase20to28Card() {
    const content = `**PluginLoader**
插件数: ${pluginState.totalPlugins}

**SessionStorage**
会话数: ${sessionStorageState.totalSessions}

**Task Framework**
总任务: ${taskFrameworkState.totalTasks}
活跃任务: ${taskFrameworkState.activeTasks}

**Phase 24-28** (低优先级，待实施)
- Voice Stream STT
- MCP Server Approval
- Remote Managed Settings
- Team Memory Sync
- Settings Sync`;
    return {
        title: '📦 Phase 20-28 状态',
        content,
    };
}
//# sourceMappingURL=phase20-28-services.js.map