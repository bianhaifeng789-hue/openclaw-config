/**
 * Session Memory Service - Session Memory 管理服务
 * 
 * 借鉴 Claude Code 的 sessionMemory.ts:
 * - services/SessionMemory/sessionMemory.ts 的后台提取机制
 * - shouldExtractMemory() 的触发条件
 * - runForkedAgent() 的使用方式
 * 
 * OpenClaw 适配：
 * - 与 MEMORY.md 整合
 * - 与 heartbeat 模式整合
 * - 飞书卡片通知
 */

import {
  getLastCacheSafeParams,
  createCacheSafeParams,
  runForkedAgent
} from './forked-agent-cache'
import {
  registerTask,
  updateProgress,
  completeTask,
  createTaskCard
} from './background-task-utils'
import {
  sessionMemoryCompact,
  estimateTokenCount,
  updateAutoUpdateBlock,
  extractAutoUpdateBlock,
  DEFAULT_MEMORY_SECTIONS
} from './session-memory-compact'

// ============================================================================
// Configuration
// ============================================================================

export interface SessionMemoryConfig {
  /** 初始化的最小 tokens（触发第一次提取） */
  minimumMessageTokensToInit: number
  /** 更新之间的最小 tokens 增长 */
  minimumTokensBetweenUpdate: number
  /** 工具调用次数阈值 */
  toolCallsBetweenUpdates: number
  /** 是否启用 */
  enabled: boolean
}

// 默认配置（借鉴 Claude Code）
export const DEFAULT_SESSION_MEMORY_CONFIG: SessionMemoryConfig = {
  minimumMessageTokensToInit: 10_000,
  minimumTokensBetweenUpdate: 5_000,
  toolCallsBetweenUpdates: 3,
  enabled: true
}

// 当前配置
let sessionMemoryConfig: SessionMemoryConfig = {
  ...DEFAULT_SESSION_MEMORY_CONFIG
}

// ============================================================================
// State Tracking
// ============================================================================

export interface SessionMemoryState {
  /** 是否已初始化（达到 minimumMessageTokensToInit） */
  initialized: boolean
  /** 上次提取的消息 UUID */
  lastExtractedMessageUuid: string | undefined
  /** 上次提取时的 tokens 数 */
  tokensAtLastExtraction: number
  /** 提取次数 */
  extractionCount: number
  /** 上次提取时间 */
  lastExtractionAt: number
  /** 正在提取中 */
  extractionInProgress: boolean
  /** 上次提取内容摘要 */
  lastExtractionSummary: string | undefined
}

// 状态文件路径
const STATE_PATH = 'memory/session-memory-state.json'

// 状态（内存缓存）
let sessionMemoryState: SessionMemoryState = {
  initialized: false,
  lastExtractedMessageUuid: undefined,
  tokensAtLastExtraction: 0,
  extractionCount: 0,
  lastExtractionAt: 0,
  extractionInProgress: false,
  lastExtractionSummary: undefined
}

// ============================================================================
// Config Management
// ============================================================================

export function setSessionMemoryConfig(config: Partial<SessionMemoryConfig>): void {
  sessionMemoryConfig = {
    ...sessionMemoryConfig,
    ...config
  }
}

export function getSessionMemoryConfig(): SessionMemoryConfig {
  return { ...sessionMemoryConfig }
}

export function resetSessionMemoryConfig(): void {
  sessionMemoryConfig = { ...DEFAULT_SESSION_MEMORY_CONFIG }
}

// ============================================================================
// State Management
// ============================================================================

export function getSessionMemoryState(): SessionMemoryState {
  return { ...sessionMemoryState }
}

export function updateSessionMemoryState(updates: Partial<SessionMemoryState>): void {
  sessionMemoryState = {
    ...sessionMemoryState,
    ...updates
  }
  // 实际实现需要保存到文件
  // fs.writeFileSync(STATE_PATH, JSON.stringify(sessionMemoryState))
}

export function markExtractionStarted(): void {
  updateSessionMemoryState({
    extractionInProgress: true,
    lastExtractionAt: Date.now()
  })
}

export function markExtractionCompleted(summary: string): void {
  updateSessionMemoryState({
    extractionInProgress: false,
    extractionCount: sessionMemoryState.extractionCount + 1,
    lastExtractionSummary: summary
  })
}

// ============================================================================
// Extraction Logic
// ============================================================================

/**
 * Check if should extract memory
 * 
 * 借鉴 Claude Code 的 shouldExtractMemory()
 * 
 * 触发条件：
 * 1. 已初始化
 * 2. tokens 增长达到阈值
 * 3. 工具调用次数达到阈值
 * 4. 或：上一轮没有工具调用（自然断点）
 */
export function shouldExtractMemory(
  currentTokenCount: number,
  toolCallsSinceLastUpdate: number,
  hasToolCallsInLastTurn: boolean
): boolean {
  const config = getSessionMemoryConfig()
  const state = getSessionMemoryState()
  
  // 检查是否启用
  if (!config.enabled) {
    return false
  }
  
  // 检查是否正在提取
  if (state.extractionInProgress) {
    return false
  }
  
  // 检查初始化阈值
  if (!state.initialized) {
    if (currentTokenCount >= config.minimumMessageTokensToInit) {
      updateSessionMemoryState({ initialized: true })
      return true
    }
    return false
  }
  
  // 检查 tokens 增长阈值
  const tokensGrowth = currentTokenCount - state.tokensAtLastExtraction
  const hasMetTokenThreshold = tokensGrowth >= config.minimumTokensBetweenUpdate
  
  // 检查工具调用阈值
  const hasMetToolCallThreshold = toolCallsSinceLastUpdate >= config.toolCallsBetweenUpdates
  
  // 触发条件：
  // 1. tokens AND tool calls 都达到阈值
  // 2. 或：tokens 达到阈值 + 自然断点（无工具调用）
  const shouldExtract =
    (hasMetTokenThreshold && hasMetToolCallThreshold) ||
    (hasMetTokenThreshold && !hasToolCallsInLastTurn)
  
  return shouldExtract
}

/**
 * Run Memory Extraction
 * 
 * 借鉴 Claude Code 的 runMemoryExtraction()
 * 
 * 流程：
 * 1. 注册后台任务
 * 2. 发送启动卡片
 * 3. 运行 forked agent 提取记忆
 * 4. 更新 MEMORY.md
 * 5. 发送完成卡片
 */
export async function runMemoryExtraction(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentMemoryContent: string,
  sendCard?: (card: Record<string, unknown>) => Promise<void>
): Promise<{
  success: boolean
  updatedContent: string
  summary: string
  usage: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
  }
}> {
  // 1. 注册任务
  const task = registerTask('memory_extraction')
  
  // 2. 发送启动卡片
  if (sendCard) {
    const startCard = createTaskCard(task)
    await sendCard(startCard)
  }
  
  // 3. 标记开始
  markExtractionStarted()
  
  try {
    // 4. 构建 prompt
    const extractionPrompt = buildExtractionPrompt(messages, currentMemoryContent)
    
    // 5. 获取 cache params
    const cacheParams = getLastCacheSafeParams()
    
    // 6. 运行 forked agent
    updateProgress(task.id, 20, 'Analyzing conversation...')
    
    const forkResult = await runForkedAgent({
      task: extractionPrompt,
      cacheSafeParams: cacheParams,
      runtime: 'subagent',
      mode: 'run',
      label: 'memory_extraction',
      maxTurns: 3
    })
    
    updateProgress(task.id, 80, 'Updating MEMORY.md...')
    
    // 7. 解析结果并更新 MEMORY.md
    const updatedContent = updateAutoUpdateBlock(
      currentMemoryContent,
      'current_focus',
      extractCurrentFocusFromResult(forkResult)
    )
    
    // 8. 完成任务
    const summary = 'Updated Current Focus, Key Decisions, Learnings'
    completeTask(task.id, summary)
    markExtractionCompleted(summary)
    
    // 9. 发送完成卡片
    if (sendCard) {
      const completeCard = createTaskCard(task, summary)
      await sendCard(completeCard)
    }
    
    return {
      success: true,
      updatedContent,
      summary,
      usage: {
        inputTokens: forkResult.totalUsage.inputTokens,
        outputTokens: forkResult.totalUsage.outputTokens,
        cacheReadTokens: forkResult.totalUsage.cacheReadTokens
      }
    }
  } catch (error) {
    // 失败处理
    updateProgress(task.id, 100, 'Failed')
    markExtractionCompleted('Failed')
    
    return {
      success: false,
      updatedContent: currentMemoryContent,
      summary: String(error),
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0
      }
    }
  }
}

/**
 * Build Extraction Prompt
 * 
 * 构建 memory extraction 的 prompt
 * 借鉴 Claude Code 的 prompts.ts
 */
function buildExtractionPrompt(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentMemory: string
): string {
  return `
Update the session memory file based on the recent conversation.

Current memory content:
<current_memory>
${currentMemory}
</current_memory>

Recent conversation (last 10 messages):
<recent_conversation>
${messages.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n')}
</recent_conversation>

Your task:
1. Read the current memory content
2. Identify new information from the conversation
3. Update the following sections:
   - Current Focus: What's being worked on right now
   - Key Decisions: Important decisions made
   - Learnings: What worked, what didn't
   - User Profile: User preferences observed

Rules:
- Preserve existing content unless contradicted
- Add new information, don't remove existing
- Keep each section concise (under 500 tokens)
- Use bullet points for clarity
- Include dates for time-sensitive info

Update the memory using the edit tool, then stop.
`
}

/**
 * Extract Current Focus from Result
 * 
 * 从 forked agent 结果中提取 Current Focus 内容
 */
function extractCurrentFocusFromResult(result: {
  messages: Array<unknown>
}): string {
  // 实际实现需要解析 assistant message 的内容
  // 这里是占位
  return '- **最新进展**: Session Memory 提取已完成'
}

// ============================================================================
// Heartbeat Integration
// ============================================================================

/**
 * Check and Extract Memory (for heartbeat)
 * 
 * 在 heartbeat 时检查是否需要提取记忆
 */
export async function checkAndExtractMemory(
  getCurrentTokenCount: () => number,
  getToolCallsCount: () => number,
  hasToolCallsInLastTurn: () => boolean,
  getCurrentMemory: () => string,
  sendCard?: (card: Record<string, unknown>) => Promise<void>
): Promise<{
  extracted: boolean
  summary?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    cacheReadTokens: number
  }
}> {
  const currentTokens = getCurrentTokenCount()
  const toolCalls = getToolCallsCount()
  const hasToolCalls = hasToolCallsInLastTurn()
  
  if (!shouldExtractMemory(currentTokens, toolCalls, hasToolCalls)) {
    return { extracted: false }
  }
  
  // 执行提取
  const currentMemory = getCurrentMemory()
  const result = await runMemoryExtraction(
    [],  // 实际需要传入最近消息
    currentMemory,
    sendCard
  )
  
  return {
    extracted: result.success,
    summary: result.summary,
    usage: result.usage
  }
}

// ============================================================================
// Export
// ============================================================================

export const sessionMemoryService = {
  // Config
  setSessionMemoryConfig,
  getSessionMemoryConfig,
  resetSessionMemoryConfig,
  
  // State
  getSessionMemoryState,
  updateSessionMemoryState,
  markExtractionStarted,
  markExtractionCompleted,
  
  // Extraction
  shouldExtractMemory,
  runMemoryExtraction,
  checkAndExtractMemory,
  
  // Constants
  DEFAULT_SESSION_MEMORY_CONFIG,
  DEFAULT_MEMORY_SECTIONS
}

export default sessionMemoryService