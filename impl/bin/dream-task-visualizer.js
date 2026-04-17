#!/usr/bin/env node
/**
 * Dream Task Visualizer - 基于 Claude Code DreamTask.ts
 * 
 * 让后台 dream agent 可见：
 *   - Footer pill 显示
 *   - Shift+Down dialog 详细信息
 * 
 * Task State:
 *   - type: 'dream'
 *   - phase: 'starting' | 'updating'
 *   - sessionsReviewing: number
 *   - filesTouched: string[]
 *   - turns: DreamTurn[]
 * 
 * Usage:
 *   node dream-task-visualizer.js register <sessionId>
 *   node dream-task-visualizer.js update <taskId> <phase> <text>
 *   node dream-task-visualizer.js complete <taskId>
 *   node dream-task-visualizer.js list
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const TASKS_DIR = path.join(WORKSPACE, 'state', 'tasks');
const DREAM_TASKS_FILE = path.join(TASKS_DIR, 'dream-tasks.json');

// Constants
const MAX_TURNS = 30; // Keep only the N most recent turns

function generateTaskId() {
  return `dream_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadDreamTasks() {
  if (!fs.existsSync(DREAM_TASKS_FILE)) {
    return { tasks: [], lastUpdate: null };
  }
  try {
    return JSON.parse(fs.readFileSync(DREAM_TASKS_FILE, 'utf8'));
  } catch {
    return { tasks: [], lastUpdate: null };
  }
}

function saveDreamTasks(data) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
  fs.writeFileSync(DREAM_TASKS_FILE, JSON.stringify(data, null, 2));
}

function registerDreamTask(sessionsReviewing, priorMtime) {
  const id = generateTaskId();
  const tasks = loadDreamTasks();
  
  const task = {
    id,
    type: 'dream',
    status: 'running',
    phase: 'starting',
    sessionsReviewing,
    filesTouched: [],
    turns: [],
    priorMtime,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  tasks.tasks.push(task);
  tasks.lastUpdate = Date.now();
  saveDreamTasks(tasks);
  
  return task;
}

function addDreamTurn(taskId, turn, touchedPaths) {
  const tasks = loadDreamTasks();
  const task = tasks.tasks.find(t => t.id === taskId);
  
  if (!task) {
    return { error: 'task not found' };
  }
  
  // Add turn
  task.turns.push(turn);
  
  // Keep only MAX_TURNS turns
  if (task.turns.length > MAX_TURNS) {
    task.turns = task.turns.slice(-MAX_TURNS);
  }
  
  // Add touched paths
  task.filesTouched = [...new Set([...task.filesTouched, ...touchedPaths])];
  
  // Update phase
  if (task.phase === 'starting' && touchedPaths.length > 0) {
    task.phase = 'updating';
  }
  
  task.updatedAt = Date.now();
  tasks.lastUpdate = Date.now();
  saveDreamTasks(tasks);
  
  return task;
}

function completeDreamTask(taskId) {
  const tasks = loadDreamTasks();
  const task = tasks.tasks.find(t => t.id === taskId);
  
  if (!task) {
    return { error: 'task not found' };
  }
  
  task.status = 'completed';
  task.phase = 'completed';
  task.completedAt = Date.now();
  task.updatedAt = Date.now();
  tasks.lastUpdate = Date.now();
  saveDreamTasks(tasks);
  
  return task;
}

function failDreamTask(taskId, error) {
  const tasks = loadDreamTasks();
  const task = tasks.tasks.find(t => t.id === taskId);
  
  if (!task) {
    return { error: 'task not found' };
  }
  
  task.status = 'failed';
  task.error = error;
  task.failedAt = Date.now();
  task.updatedAt = Date.now();
  tasks.lastUpdate = Date.now();
  saveDreamTasks(tasks);
  
  return task;
}

function getActiveDreamTasks() {
  const tasks = loadDreamTasks();
  return tasks.tasks.filter(t => t.status === 'running');
}

function getRecentDreamTasks(minutes = 5) {
  const tasks = loadDreamTasks();
  const threshold = Date.now() - minutes * 60 * 1000;
  
  return tasks.tasks.filter(t => 
    t.status === 'completed' && 
    t.completedAt && 
    t.completedAt >= threshold
  );
}

function formatTaskForDisplay(task) {
  const duration = task.completedAt 
    ? ((task.completedAt - task.createdAt) / 1000).toFixed(1) + 's'
    : ((Date.now() - task.createdAt) / 1000).toFixed(1) + 's (ongoing)';
  
  return {
    id: task.id,
    status: task.status,
    phase: task.phase,
    sessions: task.sessionsReviewing,
    filesTouched: task.filesTouched.length,
    turns: task.turns.length,
    duration,
    lastTurn: task.turns.length > 0 ? task.turns[task.turns.length - 1].text.slice(0, 100) + '...' : null
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  switch (command) {
    case 'register':
      const sessions = parseInt(args[1], 10) || 0;
      const mtime = parseInt(args[2], 10) || Date.now();
      const task = registerDreamTask(sessions, mtime);
      console.log(JSON.stringify(task, null, 2));
      break;
    case 'update':
      const taskId = args[1];
      const phase = args[2] || 'updating';
      const text = args[3] || '';
      const updated = addDreamTurn(taskId, { text, toolUseCount: 0 }, []);
      console.log(JSON.stringify(updated, null, 2));
      break;
    case 'complete':
      const completeId = args[1];
      const completed = completeDreamTask(completeId);
      console.log(JSON.stringify(completed, null, 2));
      break;
    case 'fail':
      const failId = args[1];
      const error = args[2] || 'unknown error';
      const failed = failDreamTask(failId, error);
      console.log(JSON.stringify(failed, null, 2));
      break;
    case 'list':
      const active = getActiveDreamTasks();
      console.log('=== Active Dream Tasks ===');
      active.forEach(t => console.log(JSON.stringify(formatTaskForDisplay(t), null, 2)));
      break;
    case 'recent':
      const recent = getRecentDreamTasks(parseInt(args[1], 10) || 5);
      console.log(`=== Recently Completed (last ${args[1] || 5} min) ===`);
      recent.forEach(t => console.log(JSON.stringify(formatTaskForDisplay(t), null, 2)));
      break;
    default:
      console.log('Usage: node dream-task-visualizer.js [register|update|complete|fail|list|recent]');
      process.exit(1);
  }
}

main();