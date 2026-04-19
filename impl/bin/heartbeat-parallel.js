/**
 * Heartbeat 并行调度器
 * 实现并行任务执行 + 失败隔离
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const TIMEOUTS = {
  critical: 30000,   // P0: 30 秒
  high: 60000,       // P1: 60 秒
  medium: 120000,    // P2: 120 秒
  low: 300000        // P3: 300 秒
};

async function runTaskWithTimeout(task, timeoutMs) {
  return Promise.race([
    execAsync(task.cmd),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

async function runHeartbeatTasks(tasks) {
  // 按优先级分组
  const p0Tasks = tasks.filter(t => t.priority === 'critical');
  const p1Tasks = tasks.filter(t => t.priority === 'high');
  const p2Tasks = tasks.filter(t => t.priority === 'medium' || t.priority === 'low');

  const results = {
    p0: { total: p0Tasks.length, succeeded: 0, failed: 0, errors: [] },
    p1: { total: p1Tasks.length, succeeded: 0, failed: 0, errors: [] },
    p2: { total: p2Tasks.length, succeeded: 0, failed: 0, errors: [] }
  };

  // P0 任务：顺序执行（必须完成）
  for (const task of p0Tasks) {
    try {
      await runTaskWithTimeout(task, TIMEOUTS.critical);
      results.p0.succeeded++;
      console.log(`[Heartbeat] ✓ P0: ${task.name}`);
    } catch (e) {
      results.p0.failed++;
      results.p0.errors.push({ task: task.name, error: e.message });
      console.error(`[Heartbeat] ✗ P0: ${task.name} - ${e.message}`);
    }
  }

  // P1 任务：并行执行（失败隔离）
  if (p1Tasks.length > 0) {
    const p1Results = await Promise.allSettled(
      p1Tasks.map(t => runTaskWithTimeout(t, TIMEOUTS.high))
    );

    p1Results.forEach((result, idx) => {
      const task = p1Tasks[idx];
      if (result.status === 'fulfilled') {
        results.p1.succeeded++;
        console.log(`[Heartbeat] ✓ P1: ${task.name}`);
      } else {
        results.p1.failed++;
        results.p1.errors.push({ task: task.name, error: result.reason.message });
        console.error(`[Heartbeat] ✗ P1: ${task.name} - ${result.reason.message}`);
      }
    });
  }

  // P2 任务：并行执行（失败隔离）
  if (p2Tasks.length > 0) {
    const p2Results = await Promise.allSettled(
      p2Tasks.map(t => runTaskWithTimeout(t, TIMEOUTS.medium))
    );

    p2Results.forEach((result, idx) => {
      const task = p2Tasks[idx];
      if (result.status === 'fulfilled') {
        results.p2.succeeded++;
        console.log(`[Heartbeat] ✓ P2: ${task.name}`);
      } else {
        results.p2.failed++;
        results.p2.errors.push({ task: task.name, error: result.reason.message });
        console.error(`[Heartbeat] ✗ P2: ${task.name} - ${result.reason.message}`);
      }
    });
  }

  // 汇总
  const totalSucceeded = results.p0.succeeded + results.p1.succeeded + results.p2.succeeded;
  const totalFailed = results.p0.failed + results.p1.failed + results.p2.failed;

  console.log(`[Heartbeat] Summary: ${totalSucceeded} succeeded, ${totalFailed} failed`);

  return {
    ...results,
    summary: { succeeded: totalSucceeded, failed: totalFailed }
  };
}

// 示例任务配置
const EXAMPLE_TASKS = [
  { name: 'health-monitor', priority: 'critical', cmd: 'node impl/bin/health-monitor.js check' },
  { name: 'memory-compact', priority: 'high', cmd: 'node impl/bin/compact-cli.js memory' },
  { name: 'cache-cleanup', priority: 'medium', cmd: 'node impl/bin/cache-lru-manager.js cleanup' },
  { name: 'checkpoint-cleanup', priority: 'low', cmd: 'node impl/bin/checkpoint-cleaner.js cleanup' }
];

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'run':
      runHeartbeatTasks(EXAMPLE_TASKS).then(results => {
        console.log('\nFinal results:', JSON.stringify(results.summary, null, 2));
      });
      break;
    case 'test':
      console.log('Testing with example tasks...');
      runHeartbeatTasks(EXAMPLE_TASKS).then(results => {
        console.log('\nTest completed');
      });
      break;
    default:
      console.log('Usage: node heartbeat-parallel.js [run|test]');
  }
}

module.exports = { runHeartbeatTasks, runTaskWithTimeout, TIMEOUTS };
