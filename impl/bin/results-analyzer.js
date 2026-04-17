#!/usr/bin/env node
/**
 * Results Analyzer - 分析 Terminal-Bench 2.0 任务结果
 * 
 * 来源：Harness Engineering - scripts/analyze_results.py
 * 
 * 功能：
 * - 分析 job 目录中的所有 trial
 * - 分类失败原因（rate_limit/timeout/missing_tool/...）
 * - 统计通过率
 * - 生成 retry 命令
 * 
 * 用法：
 *   node results-analyzer.js analyze <job_dir>
 *   node results-analyzer.js analyze <job_dir> --failed-only
 *   node results-analyzer.js analyze <job_dir> --retry-cmd
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// 失败分类
// ---------------------------------------------------------------------------

/**
 * 分类失败原因
 * @param {string} trialDir - trial 目录路径
 * @returns {string} 失败类型
 */
function classifyFailure(trialDir) {
  const excPath = path.join(trialDir, 'exception.txt');
  const resultPath = path.join(trialDir, 'result.json');
  
  // 检查 exception.txt
  if (fs.existsSync(excPath)) {
    const text = fs.readFileSync(excPath, 'utf8');
    
    if (text.includes('rate_limit') || text.includes('429')) {
      return 'rate_limit';
    }
    if (text.toLowerCase().includes('timed out') || text.includes('AgentTimeoutError')) {
      return 'timeout';
    }
    if (text.toLowerCase().includes('command not found')) {
      return 'missing_tool';
    }
    if (text.includes('ModuleNotFoundError')) {
      return 'missing_module';
    }
    if (text.includes('Conflict') && text.includes('container name')) {
      return 'docker_conflict';
    }
    if (text.includes('Connection error') || text.includes('API preflight failed')) {
      return 'api_error';
    }
    return 'other_exception';
  }
  
  // 检查 result.json
  if (fs.existsSync(resultPath)) {
    try {
      const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      const ae = result.agent_execution || {};
      
      if (ae.started_at && ae.finished_at) {
        const start = new Date(ae.started_at);
        const end = new Date(ae.finished_at);
        const duration = (end - start) / 1000;
        
        if (duration < 10) {
          return 'instant_exit';
        }
      }
    } catch (err) {
      // 解析失败
    }
  }
  
  return 'task_failure';
}

// ---------------------------------------------------------------------------
// 分析 Job
// ---------------------------------------------------------------------------

/**
 * 分析 job 目录中的所有 trial
 * @param {string} jobDir - job 目录路径
 * @param {boolean} failedOnly - 只显示失败任务
 * @returns {Array} trial 列表
 */
function analyzeJob(jobDir, failedOnly = false) {
  const resultPath = path.join(jobDir, 'result.json');
  
  if (!fs.existsSync(resultPath)) {
    console.log(`No result.json in ${jobDir}`);
    return [];
  }
  
  // 查找所有 trial 目录
  const trials = [];
  const entries = fs.readdirSync(jobDir).sort();
  
  for (const entry of entries) {
    const trialPath = path.join(jobDir, entry);
    const trialResultPath = path.join(trialPath, 'result.json');
    
    if (!fs.statSync(trialPath).isDirectory() || !fs.existsSync(trialResultPath)) {
      continue;
    }
    
    try {
      const tr = JSON.parse(fs.readFileSync(trialResultPath, 'utf8'));
      
      // 提取 reward
      let reward = 0.0;
      const vr = tr.verifier_result;
      if (vr && vr.rewards) {
        reward = vr.rewards.reward || 0.0;
      }
      
      // 计算持续时间
      let duration = 0;
      const ae = tr.agent_execution || {};
      if (ae.started_at && ae.finished_at) {
        const start = new Date(ae.started_at);
        const end = new Date(ae.finished_at);
        duration = Math.floor((end - start) / 1000);
      }
      
      // 提取任务名
      const taskName = tr.task_name || entry;
      
      // 分类失败
      const failureType = reward === 0 ? classifyFailure(trialPath) : '';
      
      trials.push({
        name: taskName,
        trial: entry,
        reward,
        duration,
        failure: failureType,
        dir: trialPath
      });
    } catch (err) {
      console.log(`Warning: Failed to parse ${trialResultPath}: ${err.message}`);
    }
  }
  
  // 统计
  const total = trials.length;
  const passed = trials.filter(t => t.reward > 0).length;
  const failed = total - passed;
  const rate = total > 0 ? (passed / total * 100).toFixed(1) : '0.0';
  
  // 打印统计
  console.log('\n' + '='.repeat(60));
  console.log(`JOB: ${path.basename(jobDir)}`);
  console.log('=' .repeat(60));
  console.log(`Total: ${total}  Passed: ${passed}  Failed: ${failed}  Rate: ${rate}%\n`);
  
  // 失败分类统计
  if (failed > 0) {
    const categories = {};
    
    for (const t of trials) {
      if (t.reward === 0) {
        const cat = t.failure;
        if (!categories[cat]) {
          categories[cat] = [];
        }
        categories[cat].push(t.name);
      }
    }
    
    console.log('FAILURE BREAKDOWN:');
    
    // 按数量排序
    const sortedCats = Object.keys(categories).sort((a, b) => 
      categories[b].length - categories[a].length
    );
    
    for (const cat of sortedCats) {
      const names = categories[cat];
      console.log(`  ${cat.padEnd(20)}: ${names.length} tasks`);
      for (const n of names) {
        console.log(`    - ${n}`);
      }
    }
    console.log();
  }
  
  // 任务详情
  let show;
  if (failedOnly) {
    show = trials.filter(t => t.reward === 0);
    console.log(`FAILED TASKS (${show.length}):`);
  } else {
    show = trials;
    console.log(`ALL TASKS (${show.length}):`);
  }
  
  for (const t of show) {
    const status = t.reward > 0 ? '✅' : '❌';
    const dur = t.duration ? `${t.duration}s`.padStart(4) : 'N/A';
    const fail = t.failure ? ` [${t.failure}]` : '';
    console.log(`  ${status} ${t.name.padEnd(40)} ${dur}${fail}`);
  }
  
  console.log();
  return trials;
}

// ---------------------------------------------------------------------------
// 生成 Retry 命令
// ---------------------------------------------------------------------------

/**
 * 生成 retry 命令
 * @param {Array} trials - trial 列表
 * @param {string} jobDir - job 目录
 */
function generateRetryCmd(trials, jobDir) {
  const failed = trials.filter(t => t.reward === 0);
  // 排除 timeout（retry 也不太可能通过）
  const retryable = failed.filter(t => t.failure !== 'timeout');
  
  if (retryable.length === 0) {
    console.log('No retryable failures found.');
    return;
  }
  
  const taskArgs = retryable.map(t => `--task-name ${t.name}`).join(' \\\n  ');
  
  console.log(`RETRY COMMAND (${retryable.length} tasks, excluding timeouts):\n`);
  console.log('harbor run -d "terminal-bench@2.0" \\');
  console.log('  --agent-import-path benchmarks.harbor_agent:HarnessAgent \\');
  console.log('  -k 1 \\');
  console.log('  --n-concurrent 1 \\');
  console.log('  --agent-setup-timeout-multiplier 2 \\');
  console.log('  --max-retries 3 \\');
  console.log('  --retry-include DaytonaError \\');
  console.log('  --retry-include AgentSetupTimeoutError \\');
  console.log('  --retry-include AddTestsDirError \\');
  console.log(`  ${taskArgs}`);
  console.log();
}

// ---------------------------------------------------------------------------
// CLI 入口
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    console.log(`
Results Analyzer - 分析 TB2 任务结果

用法:
  node results-analyzer.js analyze <job_dir>
  node results-analyzer.js analyze <job_dir> --failed-only
  node results-analyzer.js analyze <job_dir> --retry-cmd

示例:
  node results-analyzer.js analyze jobs/2026-04-02__13-52-59
  node results-analyzer.js analyze jobs/2026-04-02__13-52-59 --failed-only --retry-cmd

失败分类:
  rate_limit      - API 速率限制
  timeout         - 任务超时
  missing_tool    - 缺少工具
  missing_module  - 缺少 Python 模块
  docker_conflict - Docker 容器冲突
  api_error       - API 连接错误
  instant_exit    - 瞬时退出（<10s）
  task_failure    - 任务执行失败
`);
    process.exit(0);
  }
  
  if (command === 'analyze') {
    const jobDir = args[1];
    
    if (!jobDir) {
      console.error('用法: node results-analyzer.js analyze <job_dir>');
      process.exit(1);
    }
    
    const failedOnly = args.includes('--failed-only');
    const retryCmd = args.includes('--retry-cmd');
    
    const trials = analyzeJob(jobDir, failedOnly);
    
    if (retryCmd && trials.length > 0) {
      generateRetryCmd(trials, jobDir);
    }
    
    process.exit(0);
  }
  
  console.error(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// 导出
module.exports = {
  classifyFailure,
  analyzeJob,
  generateRetryCmd
};

// CLI 入口
if (require.main === module) {
  main();
}