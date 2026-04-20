#!/usr/bin/env node
/**
 * Auto Trigger CLI - heartbeat 轻状态初始化/查看
 */

const path = require('path')
const fs = require('fs')
const os = require('os')

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
      initializedBy: 'auto-trigger-cli',
    },
  }
}

function loadState(statePath) {
  try {
    if (!fs.existsSync(statePath)) return defaultState()
    const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'))
    const base = defaultState()
    return {
      ...base,
      ...parsed,
      lastChecks: { ...base.lastChecks, ...(parsed.lastChecks || {}) },
      lastNotices: { ...base.lastNotices, ...(parsed.lastNotices || {}) },
      notes: { ...base.notes, ...(parsed.notes || {}) },
    }
  } catch {
    return defaultState()
  }
}

function saveState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true })
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2))
}

async function main() {
  const command = process.argv[2] || 'init'
  const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(os.homedir(), '.openclaw', 'workspace')
  const STATE_PATH = path.join(WORKSPACE, 'memory', 'heartbeat-state.json')

  if (command === 'init') {
    const existed = fs.existsSync(STATE_PATH)
    const state = loadState(STATE_PATH)
    saveState(STATE_PATH, state)

    console.log(JSON.stringify({
      initialized: !existed,
      statePath: STATE_PATH,
      mode: 'minimal-heartbeat-state',
      message: existed ? 'heartbeat 状态已存在，已按最小 schema 归并' : 'heartbeat 状态已按最小 schema 初始化',
    }, null, 2))
    return
  }

  if (command === 'status') {
    const state = loadState(STATE_PATH)
    console.log(JSON.stringify({
      statePath: STATE_PATH,
      lastChecks: state.lastChecks,
      lastNotices: state.lastNotices,
      notes: state.notes,
    }, null, 2))
    return
  }

  console.log('用法: node auto-trigger-cli.js [init|status]')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
