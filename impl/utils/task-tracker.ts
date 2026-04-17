/**
 * Task Tracker - 任务状态追踪器
 * 
 * 整合：
 * - background-task-service.ts 的任务管理
 * - background-task-card.ts 的卡片生成
 * - 飞书消息发送
 * 
 * 借鉴 Claude Code：
 * - utils/task/framework.ts 的任务注册
 * - tasks/types.ts 的状态类型
 * - Footer pill 的实时更新
 */

import backgroundTaskService, { BackgroundTask } from './background-task-service'
import { createTaskCard, createTasksSummaryCard, DEFAULT_CONFIG, type TaskCardConfig } from './background-task-card'

// 任务追踪状态
export interface TaskTrackerState {
  activeTasks: BackgroundTask[]
  cardMessageId: string | null  // 当前卡片消息 ID（用于更新）
  lastUpdate: number
  taskResults: Record<string, string>  // 任务结果缓存
}

// 默认状态
const DEFAULT_STATE: TaskTrackerState = {
  activeTasks: [],
  cardMessageId: null,
  lastUpdate: 0,
  taskResults: {}
}

// 全局状态（简单实现，后续可改为持久化）
let trackerState: TaskTrackerState = { ...DEFAULT_STATE }

/**
 * 任务追踪器类
 */
export class TaskTracker {
  private config: TaskCardConfig
  private updateInterval: number
  private lastCardUpdate: number = 0
  
  constructor(config: Partial<TaskCardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.updateInterval = this.config.updateIntervalMs
  }
  
  /**
   * 注册新任务（借鉴 Claude Code registerTask）
   */
  registerTask(name: string): BackgroundTask {
    const task = backgroundTaskService.create(name)
    trackerState.activeTasks.push(task)
    trackerState.lastUpdate = Date.now()
    
    // 立即发送启动卡片
    this.sendTaskCard(task)
    
    return task
  }
  
  /**
   * 更新任务进度
   */
  updateProgress(taskId: string, progress: number, description?: string): void {
    backgroundTaskService.updateProgress(taskId, progress)
    
    // 缓存进度描述
    if (description) {
      const task = backgroundTaskService.getTask(taskId)
      if (task) {
        trackerState.taskResults[taskId] = description
      }
    }
    
    // 检查是否需要更新卡片（避免频繁更新）
    const now = Date.now()
    if (now - this.lastCardUpdate >= this.updateInterval) {
      this.updateActiveCard()
      this.lastCardUpdate = now
    }
  }
  
  /**
   * 完成任务
   */
  completeTask(taskId: string, result?: string): void {
    backgroundTaskService.complete(taskId)
    
    if (result) {
      trackerState.taskResults[taskId] = result
    }
    
    // 从活动任务移除
    trackerState.activeTasks = trackerState.activeTasks.filter(t => t.id !== taskId)
    trackerState.lastUpdate = Date.now()
    
    // 发送完成卡片
    const task = backgroundTaskService.getTask(taskId)
    if (task) {
      this.sendTaskCard(task, result)
    }
  }
  
  /**
   * 任务失败
   */
  failTask(taskId: string, error?: string): void {
    backgroundTaskService.fail(taskId, error)
    
    // 从活动任务移除
    trackerState.activeTasks = trackerState.activeTasks.filter(t => t.id !== taskId)
    trackerState.lastUpdate = Date.now()
    
    // 发送失败卡片（如果配置了通知）
    if (this.config.notifyOnFailure) {
      const task = backgroundTaskService.getTask(taskId)
      if (task) {
        this.sendTaskCard(task)
      }
    }
  }
  
  /**
   * 发送任务卡片
   * 
   * 注意：这个方法需要与 message 工具配合
   * 实际发送逻辑在 heartbeat 执行时由 agent 完成
   */
  sendTaskCard(task: BackgroundTask, result?: string): Record<string, unknown> {
    return createTaskCard(task, result, this.config)
  }
  
  /**
   * 更新活动卡片（显示所有运行中的任务）
   */
  updateActiveCard(): Record<string, unknown> | null {
    const running = backgroundTaskService.getRunning()
    
    if (running.length === 0) {
      return null
    }
    
    return createTasksSummaryCard(running, this.config)
  }
  
  /**
   * 获取任务状态
   */
  getState(): TaskTrackerState {
    return { ...trackerState }
  }
  
  /**
   * 获取运行中的任务
   */
  getRunningTasks(): BackgroundTask[] {
    return backgroundTaskService.getRunning()
  }
  
  /**
   * 获取最近的完成任务
   */
  getRecentCompleted(limit: number = 5): BackgroundTask[] {
    return backgroundTaskService.getCompleted().slice(-limit)
  }
  
  /**
   * 检查是否有活动任务
   */
  hasActiveTasks(): boolean {
    return trackerState.activeTasks.length > 0
  }
  
  /**
   * 设置卡片消息 ID（用于后续更新）
   */
  setCardMessageId(messageId: string): void {
    trackerState.cardMessageId = messageId
    trackerState.lastUpdate = Date.now()
  }
  
  /**
   * 清理状态（用于重置）
   */
  clear(): void {
    trackerState = { ...DEFAULT_STATE }
    backgroundTaskService.clear()
  }
  
  /**
   * 获取统计信息
   */
  getStats(): {
    tasksCount: number
    runningCount: number
    completedCount: number
    failedCount: number
    cancelledCount: number
    averageProgress: number
  } {
    return backgroundTaskService.getStats()
  }
}

// 全局实例
export const taskTracker = new TaskTracker()

// 导出便捷函数
export function registerTask(name: string): BackgroundTask {
  return taskTracker.registerTask(name)
}

export function updateProgress(taskId: string, progress: number, description?: string): void {
  taskTracker.updateProgress(taskId, progress, description)
}

export function completeTask(taskId: string, result?: string): void {
  taskTracker.completeTask(taskId, result)
}

export function failTask(taskId: string, error?: string): void {
  taskTracker.failTask(taskId, error)
}

export function getRunningTasks(): BackgroundTask[] {
  return taskTracker.getRunningTasks()
}

export default taskTracker