#!/usr/bin/env node
/**
 * Heartbeat Parallel Executor - 心跳任务并行执行器
 * 
 * 功能：
 * 1. P0 任务顺序执行（确保完成）
 * 2. P1/P2 任务并行执行（失败隔离）
 * 3. 超时保护（避免卡死）
 * 4. 结果统计
 * 
 * 用法：
 *   node heartbeat-parallel-executor.js run
 *   node heartbeat-parallel-executor.js status
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateFile: 'state/heartbeat-parallel-state.json',
  tasksFile: 'config/heartbeat-tasks.json',
  
  // 超时配置（毫秒）
  timeouts: {
    critical: 30000,   // P0: 30s
    high: 60000,       // P1: 60s
    medium: 90000,     // P1: 90s
    low: 120000        // P2: 120s
  },
  
  // 并行配置
  parallel: {
    maxConcurrent: 5,  // 最大并行数
    failureIsolation: true  // 失败隔离
  }
};

// 加载任务配置
function loadTasks() {
  const tasksPath = path.join(CONFIG.workspace, CONFIG.tasksFile);
  if (fs.existsSync(tasksPath)) {
    return JSON.parse(fs.readFileSync(tasksPath, 'utf8')).tasks || [];
  }
  return [];
}

// 加载状态
function loadState() {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  if (fs.existsSync(statePath)) {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  }
  return {
    lastRun: null,
    totalRuns: 0,
    totalSucceeded: 0,
    totalFailed: 0,
    recentRuns: []
  };
}

// 保存状态
function saveState(state) {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}

// 执行单个任务（带超时）
async function runTaskWithTimeout(task) {
  const timeout = CONFIG.timeouts[task.priority] || CONFIG.timeouts.low;
  
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    try {
      // 同步执行（简化实现）
      const result = execSync(task.cmd, {
        cwd: CONFIG.workspace,
        timeout,
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      resolve({
        task: task.name,
        status: 'success',
        duration: Date.now() - startTime,
        output: result.slice(0, 200)
      });
    } catch (e) {
      resolve({
        task: task.name,
        status: 'failed',
        duration: Date.now() - startTime,
        error: e.message?.slice(0, 100) || 'timeout'
      });
    }
  });
}

// 并行执行心跳任务
async function runHeartbeatParallel() {
  console.log('=== 心跳任务并行执行 ===\n');
  
  const tasks = loadTasks();
  const state = loadState();
  
  // 分类任务
  const p0Tasks = tasks.filter(t => t.priority === 'critical');
  const p1Tasks = tasks.filter(t => t.priority === 'high' || t.priority === 'medium');
  const p2Tasks = tasks.filter(t => t.priority === 'low');
  
  console.log(`任务总数: ${tasks.length}`);
  console.log(`P0 (critical): ${p0Tasks.length}`);
  console.log(`P1 (high/medium): ${p1Tasks.length}`);
  console.log(`P2 (low): ${p2Tasks.length}\n`);
  
  const results = {
    p0: [],
    p1: [],
    p2: [],
    succeeded: 0,
    failed: 0,
    totalDuration: 0
  };
  
  const startTime = Date.now();
  
  // P0 任务顺序执行
  if (p0Tasks.length > 0) {
    console.log('执行 P0 任务（顺序）...');
    for (const task of p0Tasks) {
      const result = await runTaskWithTimeout(task);
      results.p0.push(result);
      
      if (result.status === 'success') {
        results.succeeded++;
        console.log(`  ✓ ${task.name} (${result.duration}ms)`);
      } else {
        results.failed++;
        console.log(`  ✗ ${task.name} (${result.error})`);
      }
    }
  }
  
  // P1/P2 任务并行执行
  if (p1Tasks.length > 0 || p2Tasks.length > 0) {
    console.log('\n执行 P1/P2 任务（并行）...');
    
    const allTasks = [...p1Tasks, ...p2Tasks];
    const parallelPromises = allTasks.map(task => runTaskWithTimeout(task));
    
    const parallelResults = await Promise.allSettled(parallelPromises);
    
    parallelResults.forEach((settled, idx) => {
      const result = settled.status === 'fulfilled' ? settled.value : {
        task: allTasks[idx].name,
        status: 'failed',
        error: settled.reason?.message || 'unknown'
      };
      
      if (allTasks[idx].priority === 'high' || allTasks[idx].priority === 'medium') {
        results.p1.push(result);
      } else {
        results.p2.push(result);
      }
      
      if (result.status === 'success') {
        results.succeeded++;
        console.log(`  ✓ ${result.task} (${result.duration}ms)`);
      } else {
        results.failed++;
        console.log(`  ✗ ${result.task} (${result.error})`);
      }
    });
  }
  
  results.totalDuration = Date.now() - startTime;
  
  // 更新状态
  state.lastRun = new Date().toISOString();
  state.totalRuns++;
  state.totalSucceeded += results.succeeded;
  state.totalFailed += results.failed;
  state.recentRuns.push({
    date: state.lastRun,
    succeeded: results.succeeded,
    failed: results.failed,
    duration: results.totalDuration
  });
  
  // 保留最近 20 次运行记录
  if (state.recentRuns.length > 20) {
    state.recentRuns = state.recentRuns.slice(-20);
  }
  
  saveState(state);
  
  // 输出结果
  console.log(`\n✅ 执行完成`);
  console.log(`  - 成功: ${results.succeeded}`);
  console.log(`  - 失败: ${results.failed}`);
  console.log(`  - 总耗时: ${results.totalDuration}ms`);
  
  return results;
}

// 显示状态
function showStatus() {
  console.log('=== 心跳并行执行状态 ===\n');
  
  const state = loadState();
  const tasks = loadTasks();
  
  console.log(`总运行次数: ${state.totalRuns}`);
  console.log(`总成功: ${state.totalSucceeded}`);
  console.log(`总失败: ${state.totalFailed}`);
  console.log(`成功率: ${Math.round(state.totalSucceeded / (state.totalSucceeded + state.totalFailed) * 100)}%`);
  console.log(`上次运行: ${state.lastRun || '从未'}`);
  
  console.log(`\n当前任务配置:`);
  console.log(`  - P0: ${tasks.filter(t => t.priority === 'critical').length}`);
  console.log(`  - P1: ${tasks.filter(t => t.priority === 'high' || t.priority === 'medium').length}`);
  console.log(`  - P2: ${tasks.filter(t => t.priority === 'low').length}`);
  
  if (state.recentRuns.length > 0) {
    console.log(`\n最近 5 次运行:`);
    state.recentRuns.slice(-5).forEach(r => {
      console.log(`  - ${r.date}: ${r.succeeded}/${r.succeeded+r.failed} (${r.duration}ms)`);
    });
  }
}

// 生成飞书卡片
function generateFeishuCard(data) {
  return {
    card: {
      header: {
        title: { tag: 'plain_text', content: '⚡ 心跳并行执行完成' },
        template: data.failed > 0 ? 'orange' : 'green'
      },
      elements: [
        {
          tag: 'div',
          fields: [
            { is_short: true, text: { tag: 'lark_md', content: `**成功**: ${data.succeeded}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**失败**: ${data.failed}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**P0**: ${data.p0.length}` } },
            { is_short: true, text: { tag: 'lark_md', content: `**总耗时**: ${data.totalDuration}ms` } }
          ]
        }
      ]
    }
  };
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'run';
  
  switch (action) {
    case 'run':
      await runHeartbeatParallel();
      break;
      
    case 'status':
      showStatus();
      break;
      
    default:
      console.log('用法: node heartbeat-parallel-executor.js [run|status]');
  }
}

main().catch(console.error);