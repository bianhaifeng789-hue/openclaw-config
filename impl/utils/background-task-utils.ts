// @ts-nocheck
/**
 * Background Task Utils - 后台任务工具集入口
 * 
 * 整合所有后台任务相关工具，提供统一导入入口。
 * 
 * 借鉴 Claude Code：
 * - utils/task/ 目录结构
 * - tasks/ 的任务类型定义
 * - components/tasks/ 的 UI 组件
 */

// 核心服务
export { 
  backgroundTaskService,
  type BackgroundTask 
} from './background-task-service'

// 卡片生成
export {
  backgroundTaskCard,
  createTaskCard,
  createTaskStartCard,
  createTaskProgressCard,
  createTaskCompleteCard,
  createTaskFailedCard,
  createTasksSummaryCard,
  formatProgressBar,
  formatDuration,
  STATUS_ICONS,
  TASK_TYPE_NAMES,
  DEFAULT_CONFIG,
  type TaskCardConfig
} from './background-task-card'

// 任务追踪器
export {
  taskTracker,
  TaskTracker,
  registerTask,
  updateProgress,
  completeTask,
  failTask,
  getRunningTasks,
  type TaskTrackerState
} from './task-tracker'

// 便捷函数：创建并发送任务卡片
export async function sendTaskUpdateCard(
  task: import('./background-task-service').BackgroundTask,
  result?: string,
  options?: {
    showMessage?: (card: Record<string, unknown>) => Promise<void>
  }
): Promise<void> {
  const card = createTaskCard(task, result)
  
  if (options?.showMessage) {
    await options.showMessage(card)
  }
}

// 便捷函数：创建并发送多任务汇总卡片
export async function sendTasksSummaryCard(
  tasks: import('./background-task-service').BackgroundTask[],
  options?: {
    showMessage?: (card: Record<string, unknown>) => Promise<void>
  }
): Promise<void> {
  if (tasks.length === 0) return
  
  const card = createTasksSummaryCard(tasks)
  
  if (options?.showMessage) {
    await options.showMessage(card)
  }
}

// 便捷函数：检查并更新活动任务卡片
export function checkActiveTasks(): {
  hasActive: boolean
  card: Record<string, unknown> | null
  runningCount: number
} {
  const running = getRunningTasks()
  
  return {
    hasActive: running.length > 0,
    card: running.length > 0 ? createTasksSummaryCard(running) : null,
    runningCount: running.length
  }
}