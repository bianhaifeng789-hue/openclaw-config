#!/usr/bin/env node
/**
 * Heartbeat CLI - 轻量 heartbeat 统一入口
 *
 * 仅保留当前 3 个轻任务相关能力（状态文件仅使用最小 schema）：
 *   status  - 显示轻量 heartbeat 状态
 *   check   - 快速检查需处理任务
 *   run     - 执行最多 2 个待处理任务
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || process.cwd()
const MEMORY_DIR = path.join(WORKSPACE, 'memory')
const STATE_FILE = path.join(MEMORY_DIR, 'heartbeat-state.json')
const COMPACT_CLI = path.join(WORKSPACE, 'impl', 'bin', 'compact-cli.js')

const LIGHTWEIGHT_TASKS = [
  { name: 'context-pressure-check', intervalMs: 2 * 60 * 60 * 1000, priority: 'medium', stateKey: 'contextPressure' },
  { name: 'memory-maintenance', intervalMs: 24 * 60 * 60 * 1000, priority: 'low', stateKey: 'memoryReview' },
  { name: 'doctor-check', intervalMs: 24 * 60 * 60 * 1000, priority: 'low', stateKey: 'doctor' },
]

function defaultState() {
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

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return defaultState()
    const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
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

function saveState(state) {
  fs.mkdirSync(MEMORY_DIR, { recursive: true })
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
}

function getDueTasks(state) {
  const now = Date.now()
  return LIGHTWEIGHT_TASKS
    .map(task => {
      const lastRun = state.lastChecks?.[task.stateKey] || 0
      const elapsed = now - lastRun
      const due = elapsed >= task.intervalMs
      return {
        ...task,
        lastRun,
        due,
        elapsed,
      }
    })
    .filter(task => task.due)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
}

function runCompactCheck() {
  try {
    const out = execSync(`node "${COMPACT_CLI}" auto glm-5`, {
      encoding: 'utf8',
      cwd: WORKSPACE,
      timeout: 30000,
      env: { ...process.env, OPENCLAW_WORKSPACE: WORKSPACE },
    })
    return out.trim()
  } catch (e) {
    return (e.stdout || e.stderr || e.message || '').trim()
  }
}

function runDoctor() {
  try {
    const out = execSync('openclaw doctor --non-interactive', {
      encoding: 'utf8',
      cwd: WORKSPACE,
      timeout: 60000,
      env: { ...process.env, OPENCLAW_WORKSPACE: WORKSPACE },
    })
    return out.trim()
  } catch (e) {
    return (e.stdout || e.stderr || e.message || '').trim()
  }
}

function getTaskSummary() {
  const dreamTasksPath = path.join(WORKSPACE, 'state', 'tasks', 'dream-tasks.json')
  if (!fs.existsSync(dreamTasksPath)) {
    return { active: 0, recentlyCompleted: 0 }
  }

  try {
    const data = JSON.parse(fs.readFileSync(dreamTasksPath, 'utf8'))
    const tasks = Array.isArray(data.tasks) ? data.tasks : []
    const recentThreshold = Date.now() - 5 * 60 * 1000
    return {
      active: tasks.filter(t => t.status === 'running').length,
      recentlyCompleted: tasks.filter(t => t.status === 'completed' && t.completedAt >= recentThreshold).length,
    }
  } catch {
    return { active: 0, recentlyCompleted: 0 }
  }
}

async function cmdStatus() {
  const state = loadState()
  const due = getDueTasks(state)
  console.log(JSON.stringify({
    tasksDefined: LIGHTWEIGHT_TASKS.length,
    taskNames: LIGHTWEIGHT_TASKS.map(t => t.name),
    pendingCount: due.length,
    pending: due.map(t => t.name),
    lastChecks: state.lastChecks,
  }, null, 2))
}

async function cmdCheck() {
  const state = loadState()
  state.lastChecks.heartbeat = Date.now()
  saveState(state)

  const due = getDueTasks(state)
  if (due.length === 0) {
    console.log('HEARTBEAT_OK')
    return
  }

  console.log(`需处理: ${due.slice(0, 2).map(t => t.name).join(', ')}`)
}

async function cmdRun() {
  const state = loadState()
  const now = Date.now()
  state.lastChecks.heartbeat = now
  const due = getDueTasks(state).slice(0, 2)

  const results = []
  for (const task of due) {
    let result
    if (task.name === 'context-pressure-check') {
      const out = runCompactCheck()
      result = { task: task.name, status: /needsAction\":true|urgency\":\s*[2-9]/.test(out) ? 'needs_attention' : 'ok', data: out }
    } else if (task.name === 'memory-maintenance') {
      result = { task: task.name, status: 'ok', data: 'lightweight/routed only' }
    } else if (task.name === 'doctor-check') {
      const out = runDoctor()
      result = { task: task.name, status: /critical|error/i.test(out) ? 'needs_attention' : 'ok', data: out.slice(-1500) }
    }

    state.lastChecks[task.stateKey] = now
    results.push(result)
  }

  saveState(state)
  console.log(JSON.stringify({
    message: `Processed ${results.length} tasks`,
    results,
  }, null, 2))
}

async function cmdTasks() {
  console.log(JSON.stringify(getTaskSummary(), null, 2))
}

async function main() {
  const command = process.argv[2] || 'check'

  switch (command) {
    case 'status':
      await cmdStatus()
      break
    case 'check':
      await cmdCheck()
      break
    case 'run':
      await cmdRun()
      break
    case 'tasks':
      await cmdTasks()
      break
    default:
      console.error(`Unknown command: ${command}`)
      process.exit(1)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
