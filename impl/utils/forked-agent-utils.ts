/**
 * Forked Agent Utils - Forked Agent 工具集入口
 * 
 * 整合 forked agent cache 和 background task 工具。
 * 
 * 借鉴 Claude Code：
 * - utils/forkedAgent.ts 的完整机制
 * - services/SessionMemory/sessionMemory.ts 的使用方式
 * - services/autoDream/autoDream.ts 的 fork 调用
 * 
 * 使用方式：
 * ```typescript
 * import {
 *   saveCacheSafeParams,
 *   getLastCacheSafeParams,
 *   runForkedAgent,
 *   createCacheSafeParams,
 *   createSubagentContext
 * } from './forked-agent-utils'
 * ```
 */

// Forked Agent Cache - 先导入再导出
import {
  forkedAgentCache,
  saveCacheSafeParams,
  getLastCacheSafeParams,
  createCacheSafeParams,
  runForkedAgent,
  createSubagentContext,
} from './forked-agent-cache'

export {
  forkedAgentCache,
  saveCacheSafeParams,
  getLastCacheSafeParams,
  createCacheSafeParams,
  runForkedAgent,
  createSubagentContext,
}

// Background Task Utils - 先导入再导出
import {
  registerTask,
  updateProgress,
  completeTask,
  failTask,
  getRunningTasks,
  createTaskCard,
  createTasksSummaryCard,
  checkActiveTasks,
  backgroundTaskService,
} from './background-task-utils'

export {
  registerTask,
  updateProgress,
  completeTask,
  failTask,
  getRunningTasks,
  createTaskCard,
  createTasksSummaryCard,
  checkActiveTasks,
  backgroundTaskService,
}

/**
 * Run Background Task with Cache Sharing
 * 
 * 整合 forked agent cache 和 background task tracker
 */

export interface RunBackgroundTaskOptions {
  taskName: string
  taskPrompt: string
  runtime?: 'subagent' | 'acp'
  mode?: 'run' | 'session'
  label?: string
  sendCard?: (card: Record<string, unknown>) => Promise<void>
  onProgress?: (progress: number, description: string) => void
}

export interface RunBackgroundTaskResult {
  success: boolean
  result?: string
  error?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
  durationMs: number
}

export async function runBackgroundTaskWithCache(
  options: RunBackgroundTaskOptions
): Promise<RunBackgroundTaskResult> {
  const startTime = Date.now()
  
  // 1. 注册任务
  const task = registerTask(options.taskName)
  
  // 2. 发送启动卡片
  if (options.sendCard) {
    const startCard = createTaskCard(task)
    await options.sendCard(startCard)
  }
  
  // 3. 获取 cache params
  const cacheParams = getLastCacheSafeParams()
  
  // 4. 运行 forked agent
  try {
    // 模拟进度更新
    if (options.onProgress) {
      options.onProgress(20, 'Starting...')
    }
    
    const forkResult = await runForkedAgent({
      task: options.taskPrompt,
      cacheSafeParams: cacheParams,
      runtime: options.runtime ?? 'subagent',
      mode: options.mode ?? 'run',
      label: options.label ?? options.taskName
    })
    
    // 更新进度
    updateProgress(task.id, 80, 'Processing...')
    if (options.onProgress) {
      options.onProgress(80, 'Processing...')
    }
    
    // 完成任务
    const result = 'Task completed successfully'
    completeTask(task.id, result)
    
    // 发送完成卡片
    if (options.sendCard) {
      const completeCard = createTaskCard(task, result)
      await options.sendCard(completeCard)
    }
    
    return {
      success: true,
      result,
      usage: {
        inputTokens: forkResult.totalUsage.inputTokens,
        outputTokens: forkResult.totalUsage.outputTokens,
        totalTokens: forkResult.totalUsage.inputTokens + forkResult.totalUsage.outputTokens,
      },
      durationMs: Date.now() - startTime
    }
  } catch (error) {
    // 任务失败
    failTask(task.id, String(error))
    
    // 发送失败卡片
    if (options.sendCard) {
      const failCard = createTaskCard(task)
      await options.sendCard(failCard)
    }
    
    return {
      success: false,
      error: String(error),
      durationMs: Date.now() - startTime
    }
  }
}

// ============================================
// Convenience Fork Creators
// ============================================

export function createMemoryMaintenanceFork(): RunBackgroundTaskOptions {
  return {
    taskName: 'Memory Maintenance',
    taskPrompt: 'Review recent daily notes and update MEMORY.md',
    label: 'memory-maintenance'
  }
}

export function createInsightsAnalysisFork(): RunBackgroundTaskOptions {
  return {
    taskName: 'Insights Analysis',
    taskPrompt: 'Analyze user patterns and generate insights',
    label: 'insights-analysis'
  }
}

export function createAutoDreamFork(): RunBackgroundTaskOptions {
  return {
    taskName: 'AutoDream',
    taskPrompt: 'Consolidate memories from sessions',
    label: 'auto-dream'
  }
}

// 默认导出
export default {
  // Cache
  saveCacheSafeParams,
  getLastCacheSafeParams,
  createCacheSafeParams,
  runForkedAgent,
  createSubagentContext,
  
  // Background Tasks
  registerTask,
  updateProgress,
  completeTask,
  failTask,
  getRunningTasks,
  createTaskCard,
  createTasksSummaryCard,
  checkActiveTasks,
  
  // Combined
  runBackgroundTaskWithCache,
  createMemoryMaintenanceFork,
  createInsightsAnalysisFork,
  createAutoDreamFork
}