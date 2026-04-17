#!/usr/bin/env node
/**
 * Schedule Cron Tool - 基于 Claude Code ScheduleCronTool
 * 
 * Cron 调度工具：
 *   - 创建定时任务
 *   - 管理任务队列
 *   - 执行和清理任务
 * 
 * Usage:
 *   node schedule-cron-tool.js create <name> <interval> <prompt>
 *   node schedule-cron-tool.js list
 *   node schedule-cron-tool.js cancel <taskId>
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const CRON_DIR = path.join(WORKSPACE, 'state', 'cron-tasks');
const TASKS_FILE = path.join(CRON_DIR, 'scheduled-tasks.json');

function loadScheduledTasks() {
  if (!fs.existsSync(TASKS_FILE)) {
    return { tasks: [], nextRunId: 1 };
  }
  
  try {
    return JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
  } catch {
    return { tasks: [], nextRunId: 1 };
  }
}

function saveScheduledTasks(scheduled) {
  fs.mkdirSync(CRON_DIR, { recursive: true });
  fs.writeFileSync(TASKS_FILE, JSON.stringify(scheduled, null, 2));
}

function parseInterval(interval) {
  // Parse interval string like '30m', '1h', '24h', '5m'
  const match = interval.match(/^(\d+)(m|h|d)$/);
  
  if (!match) {
    return null;
  }
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  switch (unit) {
    case 'm':
      return value * 60 * 1000; // minutes to ms
    case 'h':
      return value * 60 * 60 * 1000; // hours to ms
    case 'd':
      return value * 24 * 60 * 60 * 1000; // days to ms
    default:
      return null;
  }
}

function createScheduledTask(name, interval, prompt, options = {}) {
  const intervalMs = parseInterval(interval);
  
  if (!intervalMs) {
    return {
      created: false,
      error: 'invalid interval format',
      interval
    };
  }
  
  const scheduled = loadScheduledTasks();
  
  const task = {
    id: `cron_${scheduled.nextRunId}`,
    name,
    interval,
    intervalMs,
    prompt,
    options,
    createdAt: Date.now(),
    nextRunAt: Date.now() + intervalMs,
    enabled: true,
    runs: 0
  };
  
  scheduled.tasks.push(task);
  scheduled.nextRunId++;
  
  saveScheduledTasks(scheduled);
  
  return {
    created: true,
    task,
    totalTasks: scheduled.tasks.length
  };
}

function cancelScheduledTask(taskId) {
  const scheduled = loadScheduledTasks();
  const task = scheduled.tasks.find(t => t.id === taskId);
  
  if (!task) {
    return {
      cancelled: false,
      error: 'task not found',
      taskId
    };
  }
  
  task.enabled = false;
  task.cancelledAt = Date.now();
  
  saveScheduledTasks(scheduled);
  
  return {
    cancelled: true,
    task,
    remainingTasks: scheduled.tasks.filter(t => t.enabled).length
  };
}

function listScheduledTasks() {
  const scheduled = loadScheduledTasks();
  
  const now = Date.now();
  const tasks = scheduled.tasks.map(t => ({
    ...t,
    overdue: now > t.nextRunAt && t.enabled,
    nextRunIn: t.enabled ? Math.max(0, t.nextRunAt - now) : null
  }));
  
  return {
    tasks,
    total: tasks.length,
    enabled: tasks.filter(t => t.enabled).length,
    disabled: tasks.filter(t => !t.enabled).length
  };
}

function getTasksToRun() {
  const scheduled = loadScheduledTasks();
  const now = Date.now();
  
  const toRun = scheduled.tasks.filter(t => 
    t.enabled && now >= t.nextRunAt
  );
  
  return {
    tasks: toRun,
    count: toRun.length,
    timestamp: now
  };
}

function markTaskRun(taskId) {
  const scheduled = loadScheduledTasks();
  const task = scheduled.tasks.find(t => t.id === taskId);
  
  if (!task) {
    return { error: 'task not found' };
  }
  
  task.runs++;
  task.lastRunAt = Date.now();
  task.nextRunAt = Date.now() + task.intervalMs;
  
  saveScheduledTasks(scheduled);
  
  return {
    marked: true,
    task,
    nextRunIn: task.intervalMs
  };
}

function clearAllTasks() {
  saveScheduledTasks({ tasks: [], nextRunId: 1 });
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'create':
      const name = args[1];
      const interval = args[2] || '30m';
      const prompt = args[3] || '';
      if (!name) {
        console.log('Usage: node schedule-cron-tool.js create <name> <interval> <prompt>');
        process.exit(1);
      }
      console.log(JSON.stringify(createScheduledTask(name, interval, prompt), null, 2));
      break;
    case 'list':
      console.log(JSON.stringify(listScheduledTasks(), null, 2));
      break;
    case 'cancel':
      const taskId = args[1];
      if (!taskId) {
        console.log('Usage: node schedule-cron-tool.js cancel <taskId>');
        process.exit(1);
      }
      console.log(JSON.stringify(cancelScheduledTask(taskId), null, 2));
      break;
    case 'to-run':
      console.log(JSON.stringify(getTasksToRun(), null, 2));
      break;
    case 'mark-run':
      const markId = args[1];
      if (!markId) {
        console.log('Usage: node schedule-cron-tool.js mark-run <taskId>');
        process.exit(1);
      }
      console.log(JSON.stringify(markTaskRun(markId), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearAllTasks(), null, 2));
      break;
    default:
      console.log('Usage: node schedule-cron-tool.js [create|list|cancel|to-run|mark-run|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  createScheduledTask,
  cancelScheduledTask,
  listScheduledTasks,
  getTasksToRun,
  markTaskRun,
  parseInterval
};