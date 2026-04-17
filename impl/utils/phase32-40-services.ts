/**
 * Phase 32-40: 补充高价值功能（批量）
 * 
 * Phase 32: SideQuery - 后台子查询
 * Phase 33: FileHistory - 文件历史快照
 * Phase 34: CollapseReadSearch - 折叠读/搜操作（简化版）
 * Phase 35: TeammateMailbox - 队友邮箱
 * Phase 36: Notifier - 终端通知（飞书卡片适配）
 * Phase 37: PreventSleep - macOS caffeinate
 * Phase 38: SessionActivity - 会话心跳
 * Phase 39: ArgumentSubstitution - $ARGUMENTS 参数替换
 * Phase 40: Asciicast - 终端录制
 */

// ============================================================================
// Phase 32: SideQuery
// ============================================================================

export interface SideQueryOptions {
  model: string                   // 模型名称
  system?: string                 // 系统提示
  messages: Array<{ role: string; content: string }>  // 消息列表
  max_tokens?: number             // 最大 tokens（默认 1024）
  signal?: AbortSignal            // 中止信号
  querySource: string             // 查询来源
}

export interface SideQueryState {
  totalQueries: number            // 总查询数
  lastQueryAt: number             // 上次查询时间
  querySources: Map<string, number>  // 各来源查询数
}

let sideQueryState: SideQueryState = {
  totalQueries: 0,
  lastQueryAt: 0,
  querySources: new Map(),
}

/**
 * 执行后台子查询
 * 
 * 不打断主会话的独立查询
 */
export async function executeSideQuery(options: SideQueryOptions): Promise<string | null> {
  // 简化版：返回模拟结果
  // 完整版需要调用模型
  
  const result = `[SideQuery] 使用 ${options.model} 处理查询...`
  
  // 更新状态
  sideQueryState.totalQueries++
  sideQueryState.lastQueryAt = Date.now()
  const sourceCount = sideQueryState.querySources.get(options.querySource) || 0
  sideQueryState.querySources.set(options.querySource, sourceCount + 1)
  
  return result
}

export function getSideQueryState(): SideQueryState {
  return {
    totalQueries: sideQueryState.totalQueries,
    lastQueryAt: sideQueryState.lastQueryAt,
    querySources: new Map(sideQueryState.querySources),
  }
}

export function resetSideQueryState(): void {
  sideQueryState = {
    totalQueries: 0,
    lastQueryAt: 0,
    querySources: new Map(),
  }
}

export const sideQueryService = {
  execute: executeSideQuery,
  getState: getSideQueryState,
  reset: resetSideQueryState,
}

// ============================================================================
// Phase 33: FileHistory
// ============================================================================

export interface FileHistorySnapshot {
  messageId: string               // 消息 ID
  trackedFileBackups: Record<string, { version: number; backupTime: Date }>  // 文件备份
  timestamp: Date                 // 时间戳
}

export interface FileHistoryState {
  snapshots: FileHistorySnapshot[]  // 快照列表
  trackedFiles: Set<string>         // 追踪的文件
  snapshotSequence: number          // 快照序列号
}

let fileHistoryState: FileHistoryState = {
  snapshots: [],
  trackedFiles: new Set(),
  snapshotSequence: 0,
}

const MAX_SNAPSHOTS = 100

/**
 * 记录文件快照
 */
export function recordFileSnapshot(
  messageId: string,
  filePath: string,
  content: string,
): void {
  fileHistoryState.trackedFiles.add(filePath)
  
  const snapshot: FileHistorySnapshot = {
    messageId,
    trackedFileBackups: {
      [filePath]: {
        version: fileHistoryState.snapshotSequence,
        backupTime: new Date(),
      },
    },
    timestamp: new Date(),
  }
  
  fileHistoryState.snapshots.push(snapshot)
  fileHistoryState.snapshotSequence++
  
  // 清理旧快照
  if (fileHistoryState.snapshots.length > MAX_SNAPSHOTS) {
    fileHistoryState.snapshots.shift()
  }
}

/**
 * 获取文件历史
 */
export function getFileHistory(filePath: string): FileHistorySnapshot[] {
  return fileHistoryState.snapshots.filter(s => s.trackedFileBackups[filePath])
}

export function getFileHistoryState(): FileHistoryState {
  return {
    snapshots: [...fileHistoryState.snapshots],
    trackedFiles: new Set(fileHistoryState.trackedFiles),
    snapshotSequence: fileHistoryState.snapshotSequence,
  }
}

export function resetFileHistoryState(): void {
  fileHistoryState = {
    snapshots: [],
    trackedFiles: new Set(),
    snapshotSequence: 0,
  }
}

export const fileHistoryService = {
  recordSnapshot: recordFileSnapshot,
  getHistory: getFileHistory,
  getState: getFileHistoryState,
  reset: resetFileHistoryState,
}

// ============================================================================
// Phase 34: CollapseReadSearch (简化版)
// ============================================================================

export interface CollapseGroup {
  type: 'read' | 'search' | 'list'  // 类型
  count: number                    // 操作数
  paths: string[]                  // 路径列表
}

/**
 * 创建折叠组
 */
export function createCollapseGroup(
  operations: Array<{ type: string; path: string }>,
): CollapseGroup[] {
  const groups: CollapseGroup[] = []
  
  // 按类型分组
  const byType = new Map<string, CollapseGroup>()
  
  for (const op of operations) {
    const existing = byType.get(op.type)
    if (existing) {
      existing.count++
      existing.paths.push(op.path)
    } else {
      const group: CollapseGroup = {
        type: op.type as 'read' | 'search' | 'list',
        count: 1,
        paths: [op.path],
      }
      byType.set(op.type, group)
      groups.push(group)
    }
  }
  
  return groups
}

export const collapseReadSearchService = {
  createGroup: createCollapseGroup,
}

// ============================================================================
// Phase 35: TeammateMailbox
// ============================================================================

export interface TeammateMessage {
  from: string                    // 发送者
  text: string                    // 消息内容
  timestamp: string               // 时间戳
  read: boolean                   // 是否已读
  color?: string                  // 发送者颜色
  summary?: string                // 5-10 词摘要
}

export interface TeammateMailboxState {
  inboxes: Map<string, TeammateMessage[]>  // 邮箱（按队友名）
  totalMessages: number           // 总消息数
}

let teammateMailboxState: TeammateMailboxState = {
  inboxes: new Map(),
  totalMessages: 0,
}

/**
 * 发送消息给队友
 */
export function sendMessageToTeammate(
  teammateName: string,
  message: TeammateMessage,
): void {
  const inbox = teammateMailboxState.inboxes.get(teammateName) || []
  inbox.push(message)
  teammateMailboxState.inboxes.set(teammateName, inbox)
  teammateMailboxState.totalMessages++
}

/**
 * 获取队友未读消息
 */
export function getUnreadMessages(teammateName: string): TeammateMessage[] {
  const inbox = teammateMailboxState.inboxes.get(teammateName) || []
  return inbox.filter(m => !m.read)
}

/**
 * 标记消息已读
 */
export function markMessagesRead(teammateName: string): void {
  const inbox = teammateMailboxState.inboxes.get(teammateName) || []
  for (const msg of inbox) {
    msg.read = true
  }
}

export function getTeammateMailboxState(): TeammateMailboxState {
  return {
    inboxes: new Map(teammateMailboxState.inboxes),
    totalMessages: teammateMailboxState.totalMessages,
  }
}

export function resetTeammateMailboxState(): void {
  teammateMailboxState = {
    inboxes: new Map(),
    totalMessages: 0,
  }
}

export const teammateMailboxService = {
  send: sendMessageToTeammate,
  getUnread: getUnreadMessages,
  markRead: markMessagesRead,
  getState: getTeammateMailboxState,
  reset: resetTeammateMailboxState,
}

// ============================================================================
// Phase 36: Notifier (飞书卡片适配)
// ============================================================================

export interface NotificationOptions {
  message: string                 // 消息内容
  title?: string                  // 标题
  notificationType: string        // 类型
}

let notifierState = {
  totalNotifications: 0,
  lastNotificationAt: 0,
  notificationTypes: new Map<string, number>(),
}

/**
 * 发送飞书卡片通知
 */
export function sendFeishuNotification(options: NotificationOptions): void {
  // 简化版：记录状态
  // 完整版需要调用飞书 API
  
  notifierState.totalNotifications++
  notifierState.lastNotificationAt = Date.now()
  const typeCount = notifierState.notificationTypes.get(options.notificationType) || 0
  notifierState.notificationTypes.set(options.notificationType, typeCount + 1)
}

export function getNotifierState(): typeof notifierState {
  return {
    totalNotifications: notifierState.totalNotifications,
    lastNotificationAt: notifierState.lastNotificationAt,
    notificationTypes: new Map(notifierState.notificationTypes),
  }
}

export function resetNotifierState(): void {
  notifierState = {
    totalNotifications: 0,
    lastNotificationAt: 0,
    notificationTypes: new Map(),
  }
}

export const notifierService = {
  notify: sendFeishuNotification,
  getState: getNotifierState,
  reset: resetNotifierState,
}

// ============================================================================
// Phase 37: PreventSleep (macOS)
// ============================================================================

let preventSleepState = {
  refCount: 0,
  isPreventing: false,
  caffeinateProcess: null as any,
  restartInterval: null as any,
}

/**
 * 开始防止睡眠
 * 
 * macOS only: 使用 caffeinate
 */
export function startPreventSleep(): void {
  preventSleepState.refCount++
  
  if (preventSleepState.refCount === 1) {
    preventSleepState.isPreventing = true
    // 简化版：不实际启动 caffeinate
    // 完整版需要 spawn caffeinate process
  }
}

/**
 * 结束防止睡眠
 */
export function stopPreventSleep(): void {
  if (preventSleepState.refCount > 0) {
    preventSleepState.refCount--
  }
  
  if (preventSleepState.refCount === 0) {
    preventSleepState.isPreventing = false
    // 简化版：不实际停止
  }
}

export function getPreventSleepState(): typeof preventSleepState {
  return {
    refCount: preventSleepState.refCount,
    isPreventing: preventSleepState.isPreventing,
    caffeinateProcess: null,
    restartInterval: null,
  }
}

export function resetPreventSleepState(): void {
  preventSleepState = {
    refCount: 0,
    isPreventing: false,
    caffeinateProcess: null,
    restartInterval: null,
  }
}

export const preventSleepService = {
  start: startPreventSleep,
  stop: stopPreventSleep,
  getState: getPreventSleepState,
  reset: resetPreventSleepState,
}

// ============================================================================
// Phase 38: SessionActivity
// ============================================================================

const SESSION_ACTIVITY_INTERVAL_MS = 30_000  // 30 秒

let sessionActivityState = {
  activityCallback: null as (() => void) | null,
  refCount: 0,
  heartbeatTimer: null as any,
  totalHeartbeats: 0,
  lastHeartbeatAt: 0,
}

/**
 * 注册会话活动回调
 */
export function registerSessionActivityCallback(cb: () => void): void {
  sessionActivityState.activityCallback = cb
}

/**
 * 开始会话活动
 */
export function startSessionActivity(): void {
  sessionActivityState.refCount++
  
  if (sessionActivityState.refCount === 1 && sessionActivityState.heartbeatTimer === null) {
    sessionActivityState.heartbeatTimer = setInterval(() => {
      sessionActivityState.totalHeartbeats++
      sessionActivityState.lastHeartbeatAt = Date.now()
      sessionActivityState.activityCallback?.()
    }, SESSION_ACTIVITY_INTERVAL_MS)
  }
}

/**
 * 结束会话活动
 */
export function stopSessionActivity(): void {
  if (sessionActivityState.refCount > 0) {
    sessionActivityState.refCount--
  }
  
  if (sessionActivityState.refCount === 0 && sessionActivityState.heartbeatTimer !== null) {
    clearInterval(sessionActivityState.heartbeatTimer)
    sessionActivityState.heartbeatTimer = null
  }
}

export function getSessionActivityState(): typeof sessionActivityState {
  return {
    activityCallback: sessionActivityState.activityCallback,
    refCount: sessionActivityState.refCount,
    heartbeatTimer: null,
    totalHeartbeats: sessionActivityState.totalHeartbeats,
    lastHeartbeatAt: sessionActivityState.lastHeartbeatAt,
  }
}

export function resetSessionActivityState(): void {
  if (sessionActivityState.heartbeatTimer !== null) {
    clearInterval(sessionActivityState.heartbeatTimer)
  }
  sessionActivityState = {
    activityCallback: null,
    refCount: 0,
    heartbeatTimer: null,
    totalHeartbeats: 0,
    lastHeartbeatAt: 0,
  }
}

export const sessionActivityService = {
  registerCallback: registerSessionActivityCallback,
  start: startSessionActivity,
  stop: stopSessionActivity,
  getState: getSessionActivityState,
  reset: resetSessionActivityState,
}

// ============================================================================
// Phase 39: ArgumentSubstitution
// ============================================================================

/**
 * 解析参数字符串
 * 
 * 使用 shell-quote 解析
 */
export function parseArguments(args: string): string[] {
  if (!args || !args.trim()) {
    return []
  }
  
  // 简化版：使用空格分割
  // 完整版需要使用 shell-quote
  return args.split(/\s+/).filter(Boolean)
}

/**
 * 替换 $ARGUMENTS 占位符
 */
export function substituteArguments(
  prompt: string,
  args: string,
  argNames?: string[],
): string {
  const parsedArgs = parseArguments(args)
  
  // 替换 $ARGUMENTS（完整参数）
  let result = prompt.replace(/\$ARGUMENTS/g, args)
  
  // 替换 $ARGUMENTS[0], $ARGUMENTS[1], etc.
  for (let i = 0; i < parsedArgs.length; i++) {
    result = result.replace(new RegExp(`\\$ARGUMENTS\\[${i}\\]`, 'g'), parsedArgs[i])
    result = result.replace(new RegExp(`\\$${i}`, 'g'), parsedArgs[i])
  }
  
  // 替换命名参数（如果有 argNames）
  if (argNames) {
    for (let i = 0; i < argNames.length && i < parsedArgs.length; i++) {
      result = result.replace(new RegExp(`\\$${argNames[i]}`, 'g'), parsedArgs[i])
    }
  }
  
  return result
}

export const argumentSubstitutionService = {
  parse: parseArguments,
  substitute: substituteArguments,
}

// ============================================================================
// Phase 40: Asciicast (终端录制)
// ============================================================================

export interface AsciicastRecording {
  filePath: string                // 录制文件路径
  sessionId: string               // 会话 ID
  timestamp: number               // 时间戳
  events: Array<{ time: number; type: string; data: string }>  // 录制事件
}

let asciicastState = {
  recordings: [] as AsciicastRecording[],
  isRecording: false,
  currentRecording: null as AsciicastRecording | null,
  totalEvents: 0,
}

/**
 * 开始录制
 */
export function startAsciicastRecording(sessionId: string): void {
  const timestamp = Date.now()
  const filePath = `~/.claude/projects/${sessionId}-${timestamp}.cast`
  
  asciicastState.currentRecording = {
    filePath,
    sessionId,
    timestamp,
    events: [],
  }
  asciicastState.isRecording = true
}

/**
 * 记录事件
 */
export function recordAsciicastEvent(type: string, data: string): void {
  if (!asciicastState.isRecording || !asciicastState.currentRecording) {
    return
  }
  
  const event = {
    time: Date.now() - asciicastState.currentRecording.timestamp,
    type,
    data,
  }
  
  asciicastState.currentRecording.events.push(event)
  asciicastState.totalEvents++
}

/**
 * 结束录制
 */
export function stopAsciicastRecording(): AsciicastRecording | null {
  if (!asciicastState.isRecording || !asciicastState.currentRecording) {
    return null
  }
  
  const recording = asciicastState.currentRecording
  asciicastState.recordings.push(recording)
  asciicastState.isRecording = false
  asciicastState.currentRecording = null
  
  return recording
}

export function getAsciicastState(): typeof asciicastState {
  return {
    recordings: [...asciicastState.recordings],
    isRecording: asciicastState.isRecording,
    currentRecording: asciicastState.currentRecording,
    totalEvents: asciicastState.totalEvents,
  }
}

export function resetAsciicastState(): void {
  asciicastState = {
    recordings: [],
    isRecording: false,
    currentRecording: null,
    totalEvents: 0,
  }
}

export const asciicastService = {
  start: startAsciicastRecording,
  recordEvent: recordAsciicastEvent,
  stop: stopAsciicastRecording,
  getState: getAsciicastState,
  reset: resetAsciicastState,
}

// ============================================================================
// Unified Feishu Card
// ============================================================================

export function createPhase32to40Card(): {
  title: string
  content: string
} {
  const content = `**Phase 32: SideQuery**
查询数: ${sideQueryState.totalQueries}

**Phase 33: FileHistory**
快照数: ${fileHistoryState.snapshotSequence}
追踪文件: ${fileHistoryState.trackedFiles.size}

**Phase 35: TeammateMailbox**
消息数: ${teammateMailboxState.totalMessages}

**Phase 36: Notifier**
通知数: ${notifierState.totalNotifications}

**Phase 37: PreventSleep**
状态: ${preventSleepState.isPreventing ? '防止睡眠' : '正常'}

**Phase 38: SessionActivity**
心跳数: ${sessionActivityState.totalHeartbeats}

**Phase 40: Asciicast**
录制: ${asciicastState.isRecording ? '进行中' : '未录制'}`
  
  return {
    title: '📦 Phase 32-40 状态',
    content,
  }
}

// ============================================================================
// Reset All
// ============================================================================

export function resetAllPhase32to40States(): void {
  resetSideQueryState()
  resetFileHistoryState()
  resetTeammateMailboxState()
  resetNotifierState()
  resetPreventSleepState()
  resetSessionActivityState()
  resetAsciicastState()
}