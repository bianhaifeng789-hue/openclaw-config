#!/usr/bin/env node
/**
 * Command Queue Service - 基于 Claude Code useCommandQueue
 * 
 * 命令队列：
 *   - 命令排队执行
 *   - 执行顺序管理
 *   - 队列状态
 * 
 * Usage:
 *   node command-queue.js add <command>
 *   node command-queue.js next
 *   node command-queue.js status
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'command-queue');
const QUEUE_FILE = path.join(STATE_DIR, 'queue-state.json');

const MAX_QUEUE_SIZE = 100;

function loadQueueState() {
  if (!fs.existsSync(QUEUE_FILE)) {
    return {
      queue: [],
      executing: null,
      completed: [],
      failed: [],
      stats: {
        totalProcessed: 0,
        totalFailed: 0,
        avgProcessingTimeMs: 0
      }
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
  } catch {
    return {
      queue: [],
      executing: null,
      completed: [],
      failed: [],
      stats: {
        totalProcessed: 0,
        totalFailed: 0,
        avgProcessingTimeMs: 0
      }
    };
  }
}

function saveQueueState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(state, null, 2));
}

function addToQueue(command, priority = 'normal', metadata = {}) {
  const state = loadQueueState();
  
  if (state.queue.length >= MAX_QUEUE_SIZE) {
    return {
      added: false,
      error: 'queue full',
      maxSize: MAX_QUEUE_SIZE
    };
  }
  
  const queueItem = {
    id: `cmd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    command,
    priority,
    metadata,
    addedAt: Date.now(),
    status: 'pending'
  };
  
  // Insert based on priority
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  const insertIndex = state.queue.findIndex(
    item => priorityOrder[item.priority] > priorityOrder[priority]
  );
  
  if (insertIndex >= 0) {
    state.queue.splice(insertIndex, 0, queueItem);
  } else {
    state.queue.push(queueItem);
  }
  
  saveQueueState(state);
  
  return {
    added: true,
    item: queueItem,
    queueSize: state.queue.length,
    position: state.queue.findIndex(i => i.id === queueItem.id) + 1
  };
}

function getNextCommand() {
  const state = loadQueueState();
  
  if (state.queue.length === 0) {
    return {
      hasNext: false,
      queueEmpty: true
    };
  }
  
  const nextItem = state.queue[0];
  
  state.queue.shift();
  state.executing = {
    ...nextItem,
    startedAt: Date.now(),
    status: 'executing'
  };
  
  saveQueueState(state);
  
  return {
    hasNext: true,
    command: nextItem,
    remainingQueue: state.queue.length
  };
}

function completeCommand(commandId, result = {}) {
  const state = loadQueueState();
  
  if (!state.executing || state.executing.id !== commandId) {
    return {
      completed: false,
      error: 'command not executing',
      commandId
    };
  }
  
  const processingTime = Date.now() - state.executing.startedAt;
  
  const completedItem = {
    ...state.executing,
    status: 'completed',
    completedAt: Date.now(),
    processingTimeMs: processingTime,
    result
  };
  
  state.completed.push(completedItem);
  state.executing = null;
  state.stats.totalProcessed++;
  
  // Update avg processing time
  const totalTime = state.completed.reduce((sum, c) => sum + c.processingTimeMs, 0);
  state.stats.avgProcessingTimeMs = totalTime / state.stats.totalProcessed;
  
  // Keep only last 50 completed
  if (state.completed.length > 50) {
    state.completed = state.completed.slice(-50);
  }
  
  saveQueueState(state);
  
  return {
    completed: true,
    item: completedItem,
    stats: state.stats
  };
}

function failCommand(commandId, error = '') {
  const state = loadQueueState();
  
  if (!state.executing || state.executing.id !== commandId) {
    return {
      failed: false,
      error: 'command not executing',
      commandId
    };
  }
  
  const processingTime = Date.now() - state.executing.startedAt;
  
  const failedItem = {
    ...state.executing,
    status: 'failed',
    failedAt: Date.now(),
    processingTimeMs: processingTime,
    error
  };
  
  state.failed.push(failedItem);
  state.executing = null;
  state.stats.totalProcessed++;
  state.stats.totalFailed++;
  
  // Keep only last 50 failed
  if (state.failed.length > 50) {
    state.failed = state.failed.slice(-50);
  }
  
  saveQueueState(state);
  
  return {
    failed: true,
    item: failedItem,
    stats: state.stats
  };
}

function getQueueStatus() {
  const state = loadQueueState();
  
  return {
    queueSize: state.queue.length,
    executing: state.executing,
    completedCount: state.completed.length,
    failedCount: state.failed.length,
    stats: state.stats,
    nextItems: state.queue.slice(0, 5)
  };
}

function getQueueHistory(limit = 20) {
  const state = loadQueueState();
  
  return {
    completed: state.completed.slice(-limit),
    failed: state.failed.slice(-limit),
    stats: state.stats
  };
}

function clearQueue() {
  const state = loadQueueState();
  
  state.queue = [];
  
  saveQueueState(state);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function getQueueStats() {
  const state = loadQueueState();
  
  const successRate = state.stats.totalProcessed > 0
    ? ((state.stats.totalProcessed - state.stats.totalFailed) / state.stats.totalProcessed * 100)
    : 0;
  
  return {
    totalProcessed: state.stats.totalProcessed,
    totalFailed: state.stats.totalFailed,
    successRate: successRate.toFixed(1) + '%',
    avgProcessingTimeMs: Math.round(state.stats.avgProcessingTimeMs),
    currentQueueSize: state.queue.length,
    currentlyExecuting: state.executing !== null
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'add':
      const addCmd = args[1];
      const addPriority = args[2] || 'normal';
      if (!addCmd) {
        console.log('Usage: node command-queue.js add <command> [priority]');
        process.exit(1);
      }
      console.log(JSON.stringify(addToQueue(addCmd, addPriority), null, 2));
      break;
    case 'next':
      console.log(JSON.stringify(getNextCommand(), null, 2));
      break;
    case 'complete':
      const completeId = args[1];
      const completeResult = args[2] ? JSON.parse(args[2]) : {};
      if (!completeId) {
        console.log('Usage: node command-queue.js complete <commandId> [resultJson]');
        process.exit(1);
      }
      console.log(JSON.stringify(completeCommand(completeId, completeResult), null, 2));
      break;
    case 'fail':
      const failId = args[1];
      const failError = args[2] || 'Unknown error';
      if (!failId) {
        console.log('Usage: node command-queue.js fail <commandId> [error]');
        process.exit(1);
      }
      console.log(JSON.stringify(failCommand(failId, failError), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getQueueStatus(), null, 2));
      break;
    case 'history':
      const histLimit = parseInt(args[1], 10) || 20;
      console.log(JSON.stringify(getQueueHistory(histLimit), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearQueue(), null, 2));
      break;
    case 'stats':
      console.log(JSON.stringify(getQueueStats(), null, 2));
      break;
    default:
      console.log('Usage: node command-queue.js [add|next|complete|fail|status|history|clear|stats]');
      process.exit(1);
  }
}

main();

module.exports = {
  addToQueue,
  getNextCommand,
  completeCommand,
  failCommand,
  getQueueStatus,
  getQueueHistory,
  getQueueStats,
  clearQueue
};