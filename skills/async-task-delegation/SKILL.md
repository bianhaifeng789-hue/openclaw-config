---
name: async-task-delegation
description: Background task execution system with worker threads, status tracking, and timeout handling. Submit, monitor, and manage async tasks for long-running operations. Use when executing background tasks, monitoring async operations, or delegating heavy computations.
---

# Async Task Delegation - 后台任务执行系统

借鉴 DeerFlow 2.0 的 Background Task Storage + ThreadPoolExecutor。

## Why Async Tasks

长任务会阻塞主线程：
- 文件迁移（数小时）
- 数据分析（大量计算）
- 批量处理（成千上万文件）

**问题**: 主线程阻塞 → 用户无响应

**解决方案**: Async Task Delegation

## Architecture

**Worker Threads**:
```
Main Thread
  ↓ submit(task)
Task Queue (Map)
  ↓ start(task)
Worker Thread (isolated)
  ↓ execute
Result → Main Thread (message)
```

**Task Status**:
```
PENDING → RUNNING → COMPLETED
                  → FAILED
                  → CANCELLED
                  → TIMED_OUT
```

## Implementation

**impl/bin/async-task.js**:
```javascript
class AsyncTaskManager {
  constructor(config) {
    this.maxWorkers = config.maxWorkers || 3;
    this.timeoutMs = config.timeoutMs || 300000; // 5min
    this.tasks = new Map();
    this.workers = new Map();
  }
  
  submit(taskType, taskScript, taskData) {
    const taskId = uuid.v4();
    const task = {
      task_id: taskId,
      task_type: taskType,
      task_script: taskScript,
      task_data: taskData,
      status: 'pending',
      created_at: Date.now(),
      started_at: null,
      completed_at: null,
      result: null,
      error: null
    };
    
    this.tasks.set(taskId, task);
    
    if (this.workers.size < this.maxWorkers) {
      this.start(taskId);
    }
    
    return taskId;
  }
  
  start(taskId) {
    const task = this.tasks.get(taskId);
    task.status = 'running';
    task.started_at = Date.now();
    
    const worker = new Worker(task.task_script, {
      workerData: {
        task_id: taskId,
        task_data: task.task_data
      }
    });
    
    worker.on('message', (msg) => {
      if (msg.type === 'progress') {
        task.progress = msg.progress;
      } else if (msg.type === 'result') {
        task.result = msg.result;
        task.status = 'completed';
        task.completed_at = Date.now();
      }
    });
    
    worker.on('error', (err) => {
      task.error = err.message;
      task.status = 'failed';
    });
  }
}
```

## Usage

**Submit task**:
```javascript
const manager = new AsyncTaskManager();

const taskId = manager.submit('migration', '/path/to/migrate.js', {
  source: '/old/path',
  target: '/new/path'
});

console.log(`Task submitted: ${taskId}`);
```

**Monitor progress**:
```javascript
const task = manager.get(taskId);
console.log(`Status: ${task.status}`);
console.log(`Progress: ${task.progress}%`);
```

**Cancel task**:
```javascript
manager.cancel(taskId);
```

## Commands

**Submit**:
```bash
node async-task.js submit migration /path/to/script.js
```

**Status**:
```bash
node async-task.js status
```

**List**:
```bash
node async-task.js list
node async-task.js list running
```

**Get**:
```bash
node async-task.js get <task_id>
```

**Cancel**:
```bash
node async-task.js cancel <task_id>
```

**Cleanup**:
```bash
node async-task.js cleanup 24
```

## Task Storage

**state/async-tasks-state.json**:
```json
{
  "tasks": {
    "uuid-xxx": {
      "task_id": "uuid-xxx",
      "trace_id": "trace-yyy",
      "task_type": "migration",
      "status": "completed",
      "created_at": 1234567890,
      "started_at": 1234567895,
      "completed_at": 1234568000,
      "result": { ... },
      "error": null
    }
  },
  "timestamp": 1234568000
}
```

## Worker Script Example

**worker-script.js**:
```javascript
const { parentPort, workerData } = require('worker_threads');

const { task_id, task_data } = workerData;

// Report progress
parentPort.postMessage({
  type: 'progress',
  progress: 25
});

// Execute task
const result = doWork(task_data);

// Report result
parentPort.postMessage({
  type: 'result',
  result: result
});

function doWork(data) {
  // Task logic
  return { success: true };
}
```

## Benefits

| Benefit | Description |
|---------|-------------|
| **Non-blocking** | Main thread stays responsive |
| **Parallel** | Multiple workers (maxWorkers) |
| **Trackable** | Progress + status tracking |
| **Timeout** | Auto-kill timeout tasks |
| **Persistent** | State saved to file |

## Borrowed From

DeerFlow 2.0 - `backend/packages/harness/deerflow/subagents/executor.py`

**关键借鉴**:
- Background Task Storage（Map + state file）
- ThreadPoolExecutor（Worker Threads）
- SubagentStatus + SubagentResult
- Timeout handling

---

_创建时间: 2026-04-15_
_借鉴来源: https://github.com/bytedance/deer-flow_