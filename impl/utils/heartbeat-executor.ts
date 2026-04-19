/**
 * HEARTBEAT 任务执行器（轻量版）
 *
 * 只执行当前 HEARTBEAT.md 中保留的 3 个轻任务：
 * - context-pressure-check
 * - memory-maintenance
 * - doctor-check
 *
 * 目标：保持 heartbeat 作为轻量 check / route / notify 入口，
 * 避免旧的大任务面与旧状态结构继续回流。
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export interface HeartbeatTask {
  name: string
  interval: number
  priority: 'high' | 'medium' | 'low'
  lastCheck?: number
  shouldRun: boolean
  reason: string
}

export interface HeartbeatCheckResult {
  tasksChecked: number
  tasksRun: number
  notificationsSent: number
  results: TaskResult[]
  overallStatus: 'ok' | 'action_taken' | 'error'
}

export interface TaskResult {
  name: string
  executed: boolean
  success?: boolean
  output?: string
  error?: string
  reason?: string
}

type HeartbeatState = {
  lastChecks: {
    heartbeat: number | null
    tasks: number | null
    contextPressure: number | null
    doctor: number | null
    memoryReview: number | null
  }
  lastNotices: {
    heartbeat: number | null
    tasks: number | null
    contextPressure: number | null
    doctor: number | null
    memoryReview: number | null
  }
  notes?: Record<string, any>
}

const WORKSPACE_ROOT = process.env.OPENCLAW_WORKSPACE || process.cwd()
const MEMORY_DIR = path.join(WORKSPACE_ROOT, 'memory')
const HEARTBEAT_STATE_PATH = path.join(MEMORY_DIR, 'heartbeat-state.json')
const HEARTBEAT_CLI = path.join(WORKSPACE_ROOT, 'impl', 'bin', 'heartbeat-cli.js')
const COMPACT_CLI = path.join(WORKSPACE_ROOT, 'impl', 'bin', 'compact-cli.js')
const MAX_TASKS_PER_RUN = 2

const TASK_CONFIGS: Array<Omit<HeartbeatTask, 'shouldRun' | 'reason'>> = [
  { name: 'context-pressure-check', interval: 120, priority: 'medium' },
  { name: 'memory-maintenance', interval: 1440, priority: 'low' },
  { name: 'doctor-check', interval: 1440, priority: 'low' },
]

const TASK_TO_STATE_KEY: Record<string, keyof HeartbeatState['lastChecks']> = {
  'context-pressure-check': 'contextPressure',
  'memory-maintenance': 'memoryReview',
  'doctor-check': 'doctor',
}

function defaultState(): HeartbeatState {
  return {
    lastChecks: {
      heartbeat: null,
      tasks: null,
      contextPressure: null,
      doctor: null,
      memoryReview: null,
    },
    lastNotices: {
      heartbeat: null,
      tasks: null,
      contextPressure: null,
      doctor: null,
      memoryReview: null,
    },
    notes: {
      comment: 'Minimal heartbeat state schema. Keep small and stable.',
    },
  }
}

async function loadHeartbeatState(): Promise<HeartbeatState> {
  try {
    const content = await fs.readFile(HEARTBEAT_STATE_PATH, 'utf-8')
    const parsed = JSON.parse(content)
    return {
      ...defaultState(),
      ...parsed,
      lastChecks: { ...defaultState().lastChecks, ...(parsed.lastChecks || {}) },
      lastNotices: { ...defaultState().lastNotices, ...(parsed.lastNotices || {}) },
      notes: { ...defaultState().notes, ...(parsed.notes || {}) },
    }
  } catch {
    return defaultState()
  }
}

async function saveHeartbeatState(state: HeartbeatState): Promise<void> {
  await fs.mkdir(MEMORY_DIR, { recursive: true })
  await fs.writeFile(HEARTBEAT_STATE_PATH, JSON.stringify(state, null, 2), 'utf-8')
}

function checkAllTasks(state: HeartbeatState): HeartbeatTask[] {
  const now = Date.now()

  return TASK_CONFIGS.map(task => {
    const stateKey = TASK_TO_STATE_KEY[task.name]
    const lastCheck = state.lastChecks[stateKey] || 0
    const elapsedMin = Math.floor((now - lastCheck) / 60_000)
    const shouldRun = elapsedMin >= task.interval

    return {
      ...task,
      lastCheck,
      shouldRun,
      reason: shouldRun
        ? `elapsed: ${elapsedMin}m >= interval: ${task.interval}m`
        : `elapsed: ${elapsedMin}m < interval: ${task.interval}m`,
    }
  }).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

async function runNodeScript(scriptPath: string, args: string[]): Promise<string> {
  const { stdout, stderr } = await execFileAsync('node', [scriptPath, ...args], {
    cwd: WORKSPACE_ROOT,
    env: { ...process.env, OPENCLAW_WORKSPACE: WORKSPACE_ROOT },
  })
  return (stdout || stderr || '').trim()
}

async function executeContextPressureCheck(): Promise<TaskResult> {
  try {
    const output = await runNodeScript(COMPACT_CLI, ['auto', 'glm-5'])
    return {
      name: 'context-pressure-check',
      executed: true,
      success: true,
      output: output || 'context pressure check completed',
    }
  } catch (e) {
    return { name: 'context-pressure-check', executed: true, success: false, error: String(e) }
  }
}

async function executeMemoryMaintenance(): Promise<TaskResult> {
  return {
    name: 'memory-maintenance',
    executed: true,
    success: true,
    output: 'memory maintenance remains routed/lightweight; no inline heavy replay',
  }
}

async function executeDoctorCheck(): Promise<TaskResult> {
  try {
    const { stdout, stderr } = await execFileAsync('openclaw', ['doctor', '--non-interactive'], {
      cwd: WORKSPACE_ROOT,
      env: { ...process.env, OPENCLAW_WORKSPACE: WORKSPACE_ROOT },
    })
    const output = (stdout || stderr || '').trim()
    const summary = output.split('\n').slice(-8).join('\n')
    return {
      name: 'doctor-check',
      executed: true,
      success: true,
      output: summary || 'doctor check completed',
    }
  } catch (e) {
    return { name: 'doctor-check', executed: true, success: false, error: String(e) }
  }
}

export async function runHeartbeatExecutor(): Promise<HeartbeatCheckResult> {
  const state = await loadHeartbeatState()
  const tasks = checkAllTasks(state)
  const now = Date.now()
  state.lastChecks.heartbeat = now

  const tasksToRun = tasks.filter(t => t.shouldRun).slice(0, MAX_TASKS_PER_RUN)
  const results: TaskResult[] = []

  for (const task of tasksToRun) {
    let result: TaskResult

    switch (task.name) {
      case 'context-pressure-check':
        result = await executeContextPressureCheck()
        break
      case 'memory-maintenance':
        result = await executeMemoryMaintenance()
        break
      case 'doctor-check':
        result = await executeDoctorCheck()
        break
      default:
        result = { name: task.name, executed: false, reason: 'unsupported task in lightweight executor' }
    }

    results.push(result)
    const stateKey = TASK_TO_STATE_KEY[task.name]
    state.lastChecks[stateKey] = now
  }

  await saveHeartbeatState(state)

  const tasksRun = results.filter(r => r.executed).length
  const overallStatus: HeartbeatCheckResult['overallStatus'] = results.some(r => r.success === false)
    ? 'error'
    : (tasksRun > 0 ? 'action_taken' : 'ok')

  return {
    tasksChecked: tasks.length,
    tasksRun,
    notificationsSent: 0,
    results,
    overallStatus,
  }
}

export async function quickHeartbeatCheck(): Promise<string> {
  const state = await loadHeartbeatState()
  const now = Date.now()
  state.lastChecks.heartbeat = now

  const tasks = checkAllTasks(state)
  const tasksDue = tasks.filter(t => t.shouldRun)

  if (tasksDue.length === 0) {
    return 'HEARTBEAT_OK'
  }

  return `需处理: ${tasksDue.slice(0, MAX_TASKS_PER_RUN).map(t => t.name).join(', ')}`
}

export function getExecutorStats(): { tasksDefined: number; lastCheckTime: string | null; taskNames: string[] } {
  return {
    tasksDefined: TASK_CONFIGS.length,
    lastCheckTime: null,
    taskNames: TASK_CONFIGS.map(t => t.name),
  }
}

export default {
  run: runHeartbeatExecutor,
  quickCheck: quickHeartbeatCheck,
  getStats: getExecutorStats,
}
