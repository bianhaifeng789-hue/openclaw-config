#!/usr/bin/env node
/**
 * OpenClaw Async Task Delegation - 后台任务执行系统
 * 
 * 借鉴 DeerFlow 2.0 的 Background Task Storage + ThreadPoolExecutor
 * 支持后台任务执行、状态跟踪、结果存储
 * 
 * 来源: https://github.com/bytedance/deer-flow
 * 参考: backend/packages/harness/deerflow/subagents/executor.py
 */

const fs = require('fs');
const path = require('path');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const uuid = require('uuid');

const WORKSPACE = path.join(__dirname, '..', '..');
const STATE_DIR = path.join(WORKSPACE, 'state');
const TASKS_FILE = path.join(STATE_DIR, 'async-tasks-state.json');

/**
 * Task Status
 */
const TaskStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  TIMED_OUT: 'timed_out'
};

/**
 * Async Task Manager
 */
class AsyncTaskManager {
  constructor(config = {}) {
    this.maxWorkers = config.maxWorkers || 3;
    this.timeoutMs = config.timeoutMs || 300000; // 5min
    this.tasks = new Map();
    this.workers = new Map();
    this.loadTasks();
  }

  /**
   * Load tasks from state file
   */
  loadTasks() {
    try {
      if (fs.existsSync(TASKS_FILE)) {
        const state = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
        for (const [taskId, task] of Object.entries(state.tasks || {})) {
          this.tasks.set(taskId, task);
        }
      }
    } catch (err) {
      console.error('[async-task] Load tasks failed:', err.message);
    }
  }

  /**
   * Save tasks to state file
   */
  saveTasks() {
    try {
      const state = {
        tasks: Object.fromEntries(this.tasks),
        timestamp: Date.now()
      };
      fs.writeFileSync(TASKS_FILE, JSON.stringify(state, null, 2));
    } catch (err) {
      console.error('[async-task] Save tasks failed:', err.message);
    }
  }

  /**
   * Submit async task
   * @param {string} taskType - Task type (e.g., 'migration', 'analysis')
   * @param {string} taskScript - Script path to execute
   * @param {object} taskData - Task data/params
   * @returns {string} Task ID
   */
  submit(taskType, taskScript, taskData = {}) {
    const taskId = uuid.v4();
    const traceId = uuid.v4();
    
    const task = {
      task_id: taskId,
      trace_id: traceId,
      task_type: taskType,
      task_script: taskScript,
      task_data: taskData,
      status: TaskStatus.PENDING,
      created_at: Date.now(),
      started_at: null,
      completed_at: null,
      result: null,
      error: null,
      progress: 0,
      worker_pid: null
    };
    
    this.tasks.set(taskId, task);
    this.saveTasks();
    
    console.log(`[async-task] Task submitted: ${taskId} (${taskType})`);
    
    // Auto-start if worker available
    if (this.workers.size < this.maxWorkers) {
      this.start(taskId);
    }
    
    return taskId;
  }

  /**
   * Start task execution
   * @param {string} taskId - Task ID
   */
  start(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.status !== TaskStatus.PENDING) {
      throw new Error(`Task ${taskId} is not pending (status: ${task.status})`);
    }
    
    task.status = TaskStatus.RUNNING;
    task.started_at = Date.now();
    this.saveTasks();
    
    console.log(`[async-task] Task started: ${taskId}`);
    
    // Create worker thread
    const worker = new Worker(task.task_script, {
      workerData: {
        task_id: taskId,
        task_data: task.task_data
      }
    });
    
    task.worker_pid = worker.threadId;
    this.workers.set(taskId, worker);
    this.saveTasks();
    
    // Handle worker messages
    worker.on('message', (msg) => {
      if (msg.type === 'progress') {
        task.progress = msg.progress;
        this.saveTasks();
        console.log(`[async-task] Task ${taskId} progress: ${msg.progress}%`);
      } else if (msg.type === 'result') {
        task.result = msg.result;
        task.status = TaskStatus.COMPLETED;
        task.completed_at = Date.now();
        this.workers.delete(taskId);
        this.saveTasks();
        console.log(`[async-task] Task completed: ${taskId}`);
      } else if (msg.type === 'error') {
        task.error = msg.error;
        task.status = TaskStatus.FAILED;
        task.completed_at = Date.now();
        this.workers.delete(taskId);
        this.saveTasks();
        console.error(`[async-task] Task failed: ${taskId} - ${msg.error}`);
      }
    });
    
    // Handle worker error
    worker.on('error', (err) => {
      task.error = err.message;
      task.status = TaskStatus.FAILED;
      task.completed_at = Date.now();
      this.workers.delete(taskId);
      this.saveTasks();
      console.error(`[async-task] Worker error: ${taskId} - ${err.message}`);
    });
    
    // Handle worker exit
    worker.on('exit', (code) => {
      if (code !== 0 && task.status === TaskStatus.RUNNING) {
        task.error = `Worker exited with code ${code}`;
        task.status = TaskStatus.FAILED;
        task.completed_at = Date.now();
        this.workers.delete(taskId);
        this.saveTasks();
        console.error(`[async-task] Worker exit: ${taskId} - code ${code}`);
      }
    });
    
    // Timeout handler
    const timeout = setTimeout(() => {
      if (task.status === TaskStatus.RUNNING) {
        task.status = TaskStatus.TIMED_OUT;
        task.error = `Task timeout (${this.timeoutMs}ms)`;
        task.completed_at = Date.now();
        worker.terminate();
        this.workers.delete(taskId);
        this.saveTasks();
        console.error(`[async-task] Task timeout: ${taskId}`);
      }
    }, this.timeoutMs);
    
    // Store timeout reference
    task.timeout = timeout;
  }

  /**
   * Get task status
   * @param {string} taskId - Task ID
   */
  get(taskId) {
    return this.tasks.get(taskId);
  }

  /**
   * List all tasks
   * @param {TaskStatus} status - Filter by status (optional)
   */
  list(status = null) {
    const tasks = Array.from(this.tasks.values());
    if (status) {
      return tasks.filter(t => t.status === status);
    }
    return tasks;
  }

  /**
   * Cancel task
   * @param {string} taskId - Task ID
   */
  cancel(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    if (task.status === TaskStatus.RUNNING) {
      const worker = this.workers.get(taskId);
      if (worker) {
        worker.terminate();
        this.workers.delete(taskId);
      }
    }
    
    task.status = TaskStatus.CANCELLED;
    task.completed_at = Date.now();
    this.saveTasks();
    
    console.log(`[async-task] Task cancelled: ${taskId}`);
    return task;
  }

  /**
   * Get active workers count
   */
  activeCount() {
    return this.workers.size;
  }

  /**
   * Get pending tasks count
   */
  pendingCount() {
    return this.list(TaskStatus.PENDING).length;
  }

  /**
   * Auto-start pending tasks (if workers available)
   */
  autoStart() {
    const pendingTasks = this.list(TaskStatus.PENDING);
    
    for (const task of pendingTasks) {
      if (this.workers.size < this.maxWorkers) {
        this.start(task.task_id);
      } else {
        break;
      }
    }
    
    return pendingTasks.length;
  }

  /**
   * Cleanup completed/failed tasks (older than X hours)
   * @param {number} hours - Cleanup threshold
   */
  cleanup(hours = 24) {
    const threshold = Date.now() - hours * 3600 * 1000;
    const toDelete = [];
    
    for (const [taskId, task] of this.tasks.entries()) {
      if (task.completed_at && task.completed_at < threshold) {
        toDelete.push(taskId);
      }
    }
    
    for (const taskId of toDelete) {
      this.tasks.delete(taskId);
    }
    
    if (toDelete.length > 0) {
      this.saveTasks();
      console.log(`[async-task] Cleanup ${toDelete.length} tasks`);
    }
    
    return toDelete.length;
  }

  /**
   * Get summary
   */
  summary() {
    return {
      total: this.tasks.size,
      pending: this.list(TaskStatus.PENDING).length,
      running: this.list(TaskStatus.RUNNING).length,
      completed: this.list(TaskStatus.COMPLETED).length,
      failed: this.list(TaskStatus.FAILED).length,
      cancelled: this.list(TaskStatus.CANCELLED).length,
      timed_out: this.list(TaskStatus.TIMED_OUT).length,
      active_workers: this.workers.size,
      max_workers: this.maxWorkers
    };
  }
}

// CLI
const args = process.argv.slice(2);
const command = args[0] || 'status';

if (!fs.existsSync(STATE_DIR)) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
}

const manager = new AsyncTaskManager();

if (command === 'status') {
  const summary = manager.summary();
  console.log(JSON.stringify(summary, null, 2));
} else if (command === 'list') {
  const status = args[1] || null;
  const tasks = manager.list(status);
  console.log(JSON.stringify(tasks, null, 2));
} else if (command === 'get') {
  const taskId = args[1];
  if (!taskId) {
    console.error('Usage: async-task.js get <task_id>');
    process.exit(1);
  }
  
  const task = manager.get(taskId);
  console.log(JSON.stringify(task, null, 2));
} else if (command === 'submit') {
  const taskType = args[1];
  const taskScript = args[2];
  
  if (!taskType || !taskScript) {
    console.error('Usage: async-task.js submit <type> <script>');
    process.exit(1);
  }
  
  const taskId = manager.submit(taskType, taskScript);
  console.log(`Task submitted: ${taskId}`);
} else if (command === 'cancel') {
  const taskId = args[1];
  if (!taskId) {
    console.error('Usage: async-task.js cancel <task_id>');
    process.exit(1);
  }
  
  const task = manager.cancel(taskId);
  console.log(`Task cancelled: ${taskId}`);
} else if (command === 'cleanup') {
  const hours = parseInt(args[1]) || 24;
  const deleted = manager.cleanup(hours);
  console.log(`Cleanup: ${deleted} tasks deleted`);
} else if (command === 'auto-start') {
  const started = manager.autoStart();
  console.log(`Auto-started: ${started} tasks`);
} else if (command === 'help') {
  console.log('Usage: async-task.js <command>');
  console.log('');
  console.log('Commands:');
  console.log('  status       - Show tasks summary');
  console.log('  list [status]- List all tasks (filter by status)');
  console.log('  get <id>     - Get task by ID');
  console.log('  submit <type> <script> - Submit new task');
  console.log('  cancel <id>  - Cancel task');
  console.log('  cleanup [h]  - Cleanup old tasks (default: 24h)');
  console.log('  auto-start   - Auto-start pending tasks');
  console.log('  help         - Show this help');
  console.log('');
  console.log('Task Status:');
  console.log('  pending, running, completed, failed, cancelled, timed_out');
} else {
  console.log('Unknown command:', command);
  console.log('Run: node async-task.js help');
}

module.exports = { AsyncTaskManager, TaskStatus };