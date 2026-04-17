/**
 * Phase 20-23: Task Framework + PluginLoader + SessionStorage + LocalMainSession
 * 
 * 补充 Phase 1-13 中未完整实现的功能
 */

// ============================================================================
// Phase 20: PluginLoader (简化版)
// ============================================================================

export interface PluginManifest {
  name: string              // 插件名称
  version: string           // 版本号
  description?: string      // 描述
  commands?: string[]       // 提供的命令
  agents?: string[]         // 提供的代理
  hooks?: string[]          // 提供的 hooks
}

export interface PluginState {
  installedPlugins: Map<string, PluginManifest>
  sessionPlugins: Map<string, PluginManifest>
  totalPlugins: number
}

let pluginState: PluginState = {
  installedPlugins: new Map(),
  sessionPlugins: new Map(),
  totalPlugins: 0,
}

export function registerPlugin(manifest: PluginManifest): void {
  pluginState.installedPlugins.set(manifest.name, manifest)
  pluginState.totalPlugins++
}

export function getInstalledPlugins(): PluginManifest[] {
  return Array.from(pluginState.installedPlugins.values())
}

export function isPluginInstalled(name: string): boolean {
  return pluginState.installedPlugins.has(name)
}

// ============================================================================
// Phase 21: SessionStorage (补充)
// ============================================================================

export interface TranscriptMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface SessionTranscript {
  sessionId: string
  messages: TranscriptMessage[]
  createdAt: number
  updatedAt: number
}

export interface SessionStorageState {
  transcripts: Map<string, SessionTranscript>
  currentSessionId: string | null
  totalSessions: number
}

let sessionStorageState: SessionStorageState = {
  transcripts: new Map(),
  currentSessionId: null,
  totalSessions: 0,
}

export function createSessionTranscript(sessionId: string): SessionTranscript {
  const transcript: SessionTranscript = {
    sessionId,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  
  sessionStorageState.transcripts.set(sessionId, transcript)
  sessionStorageState.currentSessionId = sessionId
  sessionStorageState.totalSessions++
  
  return transcript
}

export function appendMessageToTranscript(
  sessionId: string,
  message: TranscriptMessage,
): void {
  const transcript = sessionStorageState.transcripts.get(sessionId)
  if (transcript) {
    transcript.messages.push(message)
    transcript.updatedAt = Date.now()
  }
}

export function getTranscript(sessionId: string): SessionTranscript | null {
  return sessionStorageState.transcripts.get(sessionId) || null
}

export function getCurrentTranscript(): SessionTranscript | null {
  if (!sessionStorageState.currentSessionId) return null
  return getTranscript(sessionStorageState.currentSessionId)
}

// ============================================================================
// Phase 22: Task Framework (补充)
// ============================================================================

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'killed'
export type TaskType = 'agent' | 'main_session' | 'shell' | 'dream' | 'summary'

export interface TaskAttachment {
  type: 'task_status'
  taskId: string
  taskType: TaskType
  status: TaskStatus
  description: string
  deltaSummary: string | null
}

export interface FrameworkTask {
  id: string
  type: TaskType
  status: TaskStatus
  description: string
  startTime: number
  endTime?: number
  messages: TranscriptMessage[]
  diskLoaded: boolean
  pendingMessages: TranscriptMessage[]
}

export interface TaskFrameworkState {
  tasks: Map<string, FrameworkTask>
  totalTasks: number
  activeTasks: number
}

let taskFrameworkState: TaskFrameworkState = {
  tasks: new Map(),
  totalTasks: 0,
  activeTasks: 0,
}

export function registerFrameworkTask(task: FrameworkTask): void {
  taskFrameworkState.tasks.set(task.id, task)
  taskFrameworkState.totalTasks++
  if (task.status === 'running') {
    taskFrameworkState.activeTasks++
  }
}

export function updateFrameworkTask(
  taskId: string,
  updater: (task: FrameworkTask) => FrameworkTask,
): void {
  const task = taskFrameworkState.tasks.get(taskId)
  if (task) {
    const updated = updater(task)
    taskFrameworkState.tasks.set(taskId, updated)
    
    // 更新活跃计数
    if (task.status === 'running' && updated.status !== 'running') {
      taskFrameworkState.activeTasks--
    } else if (task.status !== 'running' && updated.status === 'running') {
      taskFrameworkState.activeTasks++
    }
  }
}

export function getFrameworkTask(taskId: string): FrameworkTask | null {
  return taskFrameworkState.tasks.get(taskId) || null
}

export function getActiveFrameworkTasks(): FrameworkTask[] {
  return Array.from(taskFrameworkState.tasks.values())
    .filter(t => t.status === 'running')
}

export function createTaskAttachment(task: FrameworkTask): TaskAttachment {
  return {
    type: 'task_status',
    taskId: task.id,
    taskType: task.type,
    status: task.status,
    description: task.description,
    deltaSummary: null,
  }
}

// ============================================================================
// Phase 23: LocalMainSessionTask
// ============================================================================

const TASK_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

function generateMainSessionTaskId(): string {
  // 模拟随机 ID 生成
  const now = Date.now().toString()
  let id = 's'  // 's' prefix for main session
  for (let i = 0; i < 8; i++) {
    const charCode = now.charCodeAt(i % now.length) || 48
    id += TASK_ID_ALPHABET[charCode % TASK_ID_ALPHABET.length]
  }
  return id
}

export function registerMainSessionTask(
  description: string,
): { taskId: string; abortSignal: AbortSignal } {
  const taskId = generateMainSessionTaskId()
  const abortController = new AbortController()
  
  const task: FrameworkTask = {
    id: taskId,
    type: 'main_session',
    status: 'running',
    description,
    startTime: Date.now(),
    messages: [],
    diskLoaded: false,
    pendingMessages: [],
  }
  
  registerFrameworkTask(task)
  
  return {
    taskId,
    abortSignal: abortController.signal,
  }
}

export function completeMainSessionTask(taskId: string): void {
  updateFrameworkTask(taskId, (task) => ({
    ...task,
    status: 'completed',
    endTime: Date.now(),
  }))
}

export function failMainSessionTask(taskId: string, error: string): void {
  updateFrameworkTask(taskId, (task) => ({
    ...task,
    status: 'failed',
    endTime: Date.now(),
    description: `${task.description}\n错误: ${error}`,
  }))
}

// ============================================================================
// Phase 24-28: Low Priority Features (Batch)
// ============================================================================

// Phase 24: Voice Stream STT (Placeholder)
export const voiceStreamSTTService = {
  isEnabled: () => false,
  startStreaming: async () => null,
  stopStreaming: async () => {},
}

// Phase 25: MCP Server Approval (Placeholder)
export const mcpApprovalService = {
  isApproved: (serverName: string) => true,
  requestApproval: async (serverName: string) => true,
}

// Phase 26: Remote Managed Settings (Placeholder)
export const remoteSettingsService = {
  isEnabled: () => false,
  getSettings: () => null,
  syncSettings: async () => {},
}

// Phase 27: Team Memory Sync (Placeholder)
export const teamMemorySyncService = {
  isEnabled: () => false,
  syncMemory: async () => {},
  getSharedMemory: () => null,
}

// Phase 28: Settings Sync (Placeholder)
export const settingsSyncService = {
  isEnabled: () => false,
  sync: async () => {},
  getLastSyncTime: () => 0,
}

// ============================================================================
// Unified State Accessors
// ============================================================================

export function getPluginState(): PluginState {
  return {
    installedPlugins: new Map(pluginState.installedPlugins),
    sessionPlugins: new Map(pluginState.sessionPlugins),
    totalPlugins: pluginState.totalPlugins,
  }
}

export function getSessionStorageState(): SessionStorageState {
  return {
    transcripts: new Map(sessionStorageState.transcripts),
    currentSessionId: sessionStorageState.currentSessionId,
    totalSessions: sessionStorageState.totalSessions,
  }
}

export function getTaskFrameworkState(): TaskFrameworkState {
  return {
    tasks: new Map(taskFrameworkState.tasks),
    totalTasks: taskFrameworkState.totalTasks,
    activeTasks: taskFrameworkState.activeTasks,
  }
}

export function resetAllPhase20to28States(): void {
  pluginState = {
    installedPlugins: new Map(),
    sessionPlugins: new Map(),
    totalPlugins: 0,
  }
  
  sessionStorageState = {
    transcripts: new Map(),
    currentSessionId: null,
    totalSessions: 0,
  }
  
  taskFrameworkState = {
    tasks: new Map(),
    totalTasks: 0,
    activeTasks: 0,
  }
}

// ============================================================================
// Feishu Cards
// ============================================================================

export function createPhase20to28Card(): {
  title: string
  content: string
} {
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
- Settings Sync`
  
  return {
    title: '📦 Phase 20-28 状态',
    content,
  }
}