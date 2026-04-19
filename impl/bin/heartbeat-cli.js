#!/usr/bin/env node
/**
 * Heartbeat CLI - 最小化正式心跳执行器
 *
 * 单一事实源：config/heartbeat-tasks.json
 * 目标：
 * 1. 只按配置文件决定哪些任务存在、是否启用、多久运行一次
 * 2. 不在执行器里硬编码历史任务/旧间隔
 * 3. heartbeat 仅保留正式、可解释、可运行的生产任务
 *
 * Commands:
 *   status  - 显示配置与状态
 *   check   - 显示当前到期任务
 *   run     - 执行到期任务（按优先级排序）
 *   tasks   - 列出启用任务
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const CONFIG_FILE = path.join(WORKSPACE, 'config', 'heartbeat-tasks.json');
const STATE_FILE = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');

const PRIORITY_ORDER = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

function loadJson(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function parseInterval(interval) {
  if (typeof interval !== 'string') return null;
  const m = interval.trim().match(/^(\d+)\s*([mhd])$/i);
  if (!m) return null;
  const value = Number(m[1]);
  const unit = m[2].toLowerCase();
  if (unit === 'm') return value * 60 * 1000;
  if (unit === 'h') return value * 60 * 60 * 1000;
  if (unit === 'd') return value * 24 * 60 * 60 * 1000;
  return null;
}

function loadConfig() {
  const config = loadJson(CONFIG_FILE, { tasks: [], disabled: [] });
  const tasks = Array.isArray(config.tasks) ? config.tasks.filter(t => t && t.enabled !== false) : [];
  return { ...config, tasks };
}

function loadState() {
  const state = loadJson(STATE_FILE, {});
  state.lastChecks = state.lastChecks || {};
  state.lastRuns = state.lastRuns || {};
  return state;
}

function sanitizeStateForConfig(state, config) {
  const allowed = new Set(config.tasks.map(t => t.name));
  const cleanLastRuns = {};
  for (const [name, ts] of Object.entries(state.lastRuns || {})) {
    if (allowed.has(name)) cleanLastRuns[name] = ts;
  }
  state.lastRuns = cleanLastRuns;
  return state;
}

function getDueTasks() {
  const config = loadConfig();
  const state = sanitizeStateForConfig(loadState(), config);
  const now = Date.now();
  const dueTasks = [];

  for (const task of config.tasks) {
    const intervalMs = parseInterval(task.interval);
    if (!intervalMs || !task.name || !task.cmd) continue;

    const lastRun = Number(state.lastRuns[task.name] || 0);
    const elapsedMs = now - lastRun;
    const due = lastRun === 0 || elapsedMs >= intervalMs;

    if (due) {
      dueTasks.push({
        ...task,
        intervalMs,
        lastRun,
        elapsedMs
      });
    }
  }

  dueTasks.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.name.localeCompare(b.name);
  });

  return { config, state, dueTasks, now };
}

function runTask(task) {
  try {
    const output = execSync(task.cmd, {
      cwd: WORKSPACE,
      encoding: 'utf8',
      timeout: 30000
    });
    return {
      ok: true,
      output: output?.trim() || ''
    };
  } catch (error) {
    return {
      ok: false,
      output: (error.stdout || '').toString().trim(),
      error: (error.stderr || error.message || '').toString().trim()
    };
  }
}

function status() {
  const { config, state, dueTasks } = getDueTasks();
  return {
    workspace: WORKSPACE,
    configFile: CONFIG_FILE,
    stateFile: STATE_FILE,
    enabledTasks: config.tasks.map(task => ({
      name: task.name,
      interval: task.interval,
      priority: task.priority,
      cmd: task.cmd,
      lastRun: state.lastRuns[task.name] || null
    })),
    dueTasks: dueTasks.map(task => task.name),
    disabledCount: Array.isArray(config.disabled) ? config.disabled.length : 0,
    timestamp: Date.now()
  };
}

function check() {
  const { dueTasks } = getDueTasks();
  return {
    needsProcessing: dueTasks.map(task => task.name),
    count: dueTasks.length,
    timestamp: Date.now()
  };
}

function run() {
  const { config, state, dueTasks, now } = getDueTasks();
  const results = [];

  for (const task of dueTasks) {
    const result = runTask(task);
    if (result.ok) {
      state.lastRuns[task.name] = now;
    }
    results.push({
      task: task.name,
      ok: result.ok,
      output: result.output,
      error: result.error || null
    });
  }

  saveJson(STATE_FILE, sanitizeStateForConfig(state, config));

  return {
    tasksProcessed: results.map(r => r.task),
    results,
    stateUpdated: true,
    timestamp: now
  };
}

function listTasks() {
  const { config } = getDueTasks();
  return config.tasks;
}

function main() {
  const command = process.argv[2] || 'status';

  switch (command) {
    case 'status':
      console.log(JSON.stringify(status(), null, 2));
      break;
    case 'check':
      console.log(JSON.stringify(check(), null, 2));
      break;
    case 'run':
      console.log(JSON.stringify(run(), null, 2));
      break;
    case 'tasks':
      console.log(JSON.stringify(listTasks(), null, 2));
      break;
    default:
      console.log('Usage: node heartbeat-cli.js [status|check|run|tasks]');
      process.exit(1);
  }
}

main();
