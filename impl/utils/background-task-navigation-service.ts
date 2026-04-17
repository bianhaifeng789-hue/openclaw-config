/**
 * Background Task Navigation Service
 * 借鉴 Claude Code useBackgroundTaskNavigation.ts
 * 飞书场景：后台任务导航和状态管理
 */

// 任务类型
type BackgroundTaskType = 'local_agent' | 'local_bash' | 'remote_agent' | 'scheduled' | 'swarm'

// 后台任务
interface BackgroundTask {
  id: string
  type: BackgroundTaskType
  name: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: number
  endTime?: number
  progress?: number
  metadata?: Record<string, any>
}

// 导航状态
interface NavigationState {
  selectedIndex: number
  expandedView: boolean
  tasks: BackgroundTask[]
  stats: {
    totalTasks: number
    runningTasks: number
    completedTasks: number
    failedTasks: number
    navigationCount: number
  }
}

// 单例状态
let state: NavigationState = {
  selectedIndex: -1,
  expandedView: false,
  tasks: [],
  stats: {
    totalTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    navigationCount: 0
  }
}

/**
 * 添加后台任务
 */
export function addTask(task: BackgroundTask): void {
  state.tasks.push(task)
  state.stats.totalTasks++
  
  if (task.status === 'running') state.stats.runningTasks++
  else if (task.status === 'completed') state.stats.completedTasks++
  else if (task.status === 'failed') state.stats.failedTasks++
}

/**
 * 更新任务状态
 */
export function updateTaskStatus(taskId: string, status: BackgroundTask['status']): void {
  const task = state.tasks.find(t => t.id === taskId)
  if (task) {
    const oldStatus = task.status
    task.status = status
    task.endTime = status !== 'running' ? Date.now() : undefined
    
    // 更新统计
    if (oldStatus === 'running') state.stats.runningTasks--
    if (status === 'completed') state.stats.completedTasks++
    if (status === 'failed') state.stats.failedTasks++
  }
}

/**
 * 获取运行中的任务
 */
export function getRunningTasks(): BackgroundTask[] {
  return state.tasks.filter(t => t.status === 'running')
}

/**
 * 获取所有任务
 */
export function getAllTasks(): BackgroundTask[] {
  return [...state.tasks]
}

/**
 * 导航到下一个任务
 */
export function navigateNext(): BackgroundTask | null {
  const running = getRunningTasks()
  if (running.length === 0) return null
  
  state.selectedIndex = (state.selectedIndex + 1) % running.length
  state.expandedView = true
  state.stats.navigationCount++
  
  return running[state.selectedIndex]
}

/**
 * 导航到上一个任务
 */
export function navigatePrev(): BackgroundTask | null {
  const running = getRunningTasks()
  if (running.length === 0) return null
  
  state.selectedIndex = state.selectedIndex <= 0 ? running.length - 1 : state.selectedIndex - 1
  state.expandedView = true
  state.stats.navigationCount++
  
  return running[state.selectedIndex]
}

/**
 * 选择特定任务
 */
export function selectTask(taskId: string): BackgroundTask | null {
  const running = getRunningTasks()
  const index = running.findIndex(t => t.id === taskId)
  
  if (index >= 0) {
    state.selectedIndex = index
    state.expandedView = true
    state.stats.navigationCount++
    return running[index]
  }
  
  return null
}

/**
 * 获取当前选中任务
 */
export function getSelectedTask(): BackgroundTask | null {
  if (state.selectedIndex < 0) return null
  const running = getRunningTasks()
  return running[state.selectedIndex] || null
}

/**
 * 展开/收起视图
 */
export function toggleExpandedView(): void {
  state.expandedView = !state.expandedView
}

/**
 * 获取统计
 */
export function getStats(): NavigationState['stats'] {
  return { ...state.stats }
}

/**
 * 生成飞书任务导航卡片
 */
export function generateNavigationCard(): object {
  const running = getRunningTasks()
  const selected = getSelectedTask()
  
  return {
    config: { wide_screen_mode: true },
    header: {
      template: state.stats.failedTasks > 0 ? 'red' : state.stats.runningTasks > 0 ? 'blue' : 'green',
      title: { content: '🧭 后台任务导航', tag: 'plain_text' }
    },
    elements: [
      {
        tag: 'div',
        fields: [
          { is_short: true, text: { content: `${state.stats.runningTasks}`, tag: 'lark_md' }, title: { content: '运行中', tag: 'lark_md' } },
          { is_short: true, text: { content: `${state.stats.completedTasks}`, tag: 'lark_md' }, title: { content: '已完成', tag: 'lark_md' } },
          { is_short: true, text: { content: `${state.stats.failedTasks}`, tag: 'lark_md' }, title: { content: '失败', tag: 'lark_md' } },
          { is_short: true, text: { content: `${state.stats.navigationCount}`, tag: 'lark_md' }, title: { content: '导航次数', tag: 'lark_md' } }
        ]
      },
      running.length > 0 ? {
        tag: 'div',
        text: {
          content: '**运行中任务:**\n' + running
            .slice(0, 5)
            .map((t, i) => `${i === state.selectedIndex ? '▶️' : '○'} ${t.name} (${t.type})`)
            .join('\n'),
          tag: 'lark_md'
        }
      } : undefined,
      selected ? {
        tag: 'div',
        text: {
          content: `**当前选中:** ${selected.name}\n• 类型: ${selected.type}\n• 开始时间: ${new Date(selected.startTime).toLocaleTimeString('zh-CN')}\n• 进度: ${selected.progress || 0}%`,
          tag: 'lark_md'
        }
      } : undefined,
      {
        tag: 'action',
        actions: [
          { tag: 'button', text: { content: '上一个', tag: 'plain_text' }, type: 'primary', value: 'navigate_prev' },
          { tag: 'button', text: { content: '下一个', tag: 'plain_text' }, type: 'primary', value: 'navigate_next' },
          { tag: 'button', text: { content: '收起', tag: 'plain_text' }, type: 'default', value: 'collapse' }
        ]
      },
      {
        tag: 'note',
        elements: [{ tag: 'plain_text', content: `选中索引: ${state.selectedIndex} | 展开状态: ${state.expandedView}` }]
      }
    ].filter(Boolean)
  }
}

/**
 * 清除任务
 */
export function clearCompletedTasks(): void {
  state.tasks = state.tasks.filter(t => t.status !== 'completed' && t.status !== 'failed')
}

/**
 * 重置
 */
export function reset(): void {
  state = {
    selectedIndex: -1,
    expandedView: false,
    tasks: [],
    stats: {
      totalTasks: 0,
      runningTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      navigationCount: 0
    }
  }
}

// 导出单例
export const backgroundTaskNavigationService = {
  addTask,
  updateTaskStatus,
  getRunningTasks,
  getAllTasks,
  navigateNext,
  navigatePrev,
  selectTask,
  getSelectedTask,
  toggleExpandedView,
  getStats,
  generateNavigationCard,
  clearCompletedTasks,
  reset
}

export default backgroundTaskNavigationService