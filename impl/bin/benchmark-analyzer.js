#!/usr/bin/env node
/**
 * Benchmark Results Analyzer - TB2结果分析工具
 * 
 * 借鉴 Harness Engineering 的 analyze_results.py
 * 分析benchmark测试结果
 * 分类失败原因、生成统计报告、retry命令建议
 * 
 * 来源: https://github.com/lazyFrogLOL/Harness_Engineering
 * 参考: scripts/analyze_results.py
 */

const fs = require('fs');
const path = require('path');

/**
 * 失败类型分类
 */
const FAILURE_TYPES = {
  RATE_LIMIT: 'rate_limit',
  TIMEOUT: 'timeout',
  MISSING_TOOL: 'missing_tool',
  MISSING_MODULE: 'missing_module',
  DOCKER_CONFICT: 'docker_conflict',
  API_ERROR: 'api_error',
  INSTANT_EXIT: 'instant_exit',
  TASK_FAILURE: 'task_failure',
  OTHER_EXCEPTION: 'other_exception'
};

/**
 * 分类失败原因
 */
function classifyFailure(trialDir) {
  const excFile = path.join(trialDir, 'exception.txt');
  const resultFile = path.join(trialDir, 'result.json');
  
  // 检查异常文件
  if (fs.existsSync(excFile)) {
    const text = fs.readFileSync(excFile, 'utf8');
    
    if (text.includes('rate_limit') || text.includes('429')) {
      return FAILURE_TYPES.RATE_LIMIT;
    }
    if (text.toLowerCase().includes('timed out') || text.includes('AgentTimeoutError')) {
      return FAILURE_TYPES.TIMEOUT;
    }
    if (text.toLowerCase().includes('command not found')) {
      return FAILURE_TYPES.MISSING_TOOL;
    }
    if (text.includes('ModuleNotFoundError')) {
      return FAILURE_TYPES.MISSING_MODULE;
    }
    if (text.includes('Conflict') && text.includes('container name')) {
      return FAILURE_TYPES.DOCKER_CONFICT;
    }
    if (text.includes('Connection error') || text.includes('API preflight failed')) {
      return FAILURE_TYPES.API_ERROR;
    }
    
    return FAILURE_TYPES.OTHER_EXCEPTION;
  }
  
  // 检查结果文件
  if (fs.existsSync(resultFile)) {
    try {
      const result = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
      const ae = result.agent_execution || {};
      
      if (ae.started_at && ae.finished_at) {
        const start = new Date(ae.started_at);
        const finish = new Date(ae.finished_at);
        const duration = (finish - start) / 1000;
        
        if (duration < 10) {
          return FAILURE_TYPES.INSTANT_EXIT;
        }
      }
    } catch (err) {
      // ignore
    }
  }
  
  return FAILURE_TYPES.TASK_FAILURE;
}

/**
 * 分析Job目录中的所有trial
 */
function analyzeJob(jobDir, failedOnly = false) {
  const resultFile = path.join(jobDir, 'result.json');
  
  if (!fs.existsSync(resultFile)) {
    console.log(`No result.json in ${jobDir}`);
    return null;
  }
  
  // 收集所有trial
  const trials = [];
  const trialDirs = fs.readdirSync(jobDir)
    .filter(d => {
      const trialPath = path.join(jobDir, d);
      return fs.statSync(trialPath).isDirectory() && 
             fs.existsSync(path.join(trialPath, 'result.json'));
    })
    .sort();
  
  for (const trialName of trialDirs) {
    const trialPath = path.join(jobDir, trialName);
    const trialResultFile = path.join(trialPath, 'result.json');
    
    try {
      const tr = JSON.parse(fs.readFileSync(trialResultFile, 'utf8'));
      
      // 获取reward
      let reward = 0.0;
      const vr = tr.verifier_result;
      if (vr && vr.rewards) {
        reward = vr.rewards.reward || 0.0;
      }
      
      // 计算duration
      let duration = 0;
      const ae = tr.agent_execution || {};
      if (ae.started_at && ae.finished_at) {
        const start = new Date(ae.started_at);
        const finish = new Date(ae.finished_at);
        duration = Math.floor((finish - start) / 1000);
      }
      
      const taskName = tr.task_name || trialName;
      const failureType = reward === 0 ? classifyFailure(trialPath) : '';
      
      trials.push({
        name: taskName,
        trial: trialName,
        reward: reward,
        duration: duration,
        failure: failureType,
        dir: trialPath
      });
      
    } catch (err) {
      console.error(`Error parsing ${trialResultFile}:`, err.message);
    }
  }
  
  // 统计
  const total = trials.length;
  const passed = trials.filter(t => t.reward > 0).length;
  const failed = total - passed;
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`JOB: ${path.basename(jobDir)}`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Total: ${total}  Passed: ${passed}  Failed: ${failed}  Rate: ${(passed/total*100).toFixed(1)}%`);
  console.log('');
  
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
    const sortedCats = Object.entries(categories)
      .sort((a, b) => b[1].length - a[1].length);
    
    for (const [cat, names] of sortedCats) {
      console.log(`  ${cat.padEnd(20)}: ${names.length} tasks`);
      for (const n of names) {
        console.log(`    - ${n}`);
      }
    }
    console.log('');
  }
  
  // 显示任务详情
  const show = failedOnly ? 
    trials.filter(t => t.reward === 0) : 
    trials;
  
  console.log(`${failedOnly ? 'FAILED' : 'ALL'} TASKS (${show.length}):`);
  
  for (const t of show) {
    const status = t.reward > 0 ? '✅' : '❌';
    const dur = t.duration ? `${t.duration.toString().padStart(4)}s` : '  N/A';
    const fail = t.failure ? ` [${t.failure}]` : '';
    console.log(`  ${status} ${t.name.padEnd(40)} ${dur}${fail}`);
  }
  
  console.log('');
  
  return trials;
}

/**
 * 生成retry命令
 */
function generateRetryCmd(trials, jobDir) {
  const failed = trials.filter(t => t.reward === 0);
  
  // 排除timeout（可能retry也不会通过）
  const retryable = failed.filter(t => 
    t.failure !== FAILURE_TYPES.TIMEOUT
  );
  
  if (retryable.length === 0) {
    console.log('No retryable failures found.');
    return;
  }
  
  const taskArgs = retryable
    .map(t => `  --task-name ${t.name}`)
    .join(' \\\\n');
  
  console.log(`RETRY COMMAND (${retryable.length} tasks, excluding timeouts):`);
  console.log('');
  console.log('harbor run -d "terminal-bench@2.0" \\');
  console.log('  --agent-import-path benchmarks.harbor_agent:HarnessAgent \\');
  console.log('  -k 1 \\');
  console.log('  --n-concurrent 1 \\');
  console.log('  --agent-setup-timeout-multiplier 2 \\');
  console.log('  --max-retries 3 \\');
  console.log('  --retry-include DaytonaError \\');
  console.log('  --retry-include AgentSetupTimeoutError \\');
  console.log('  --retry-include AddTestsDirError \\');
  console.log(`${taskArgs}`);
  console.log('');
}

/**
 * 生成统计JSON
 */
function generateStats(trials) {
  const total = trials.length;
  const passed = trials.filter(t => t.reward > 0).length;
  const failed = total - passed;
  
  // 失败分类统计
  const failureStats = {};
  for (const t of trials) {
    if (t.reward === 0) {
      failureStats[t.failure] = (failureStats[t.failure] || 0) + 1;
    }
  }
  
  // 时间统计
  const durations = trials
    .filter(t => t.duration > 0)
    .map(t => t.duration);
  
  const avgDuration = durations.length > 0 ?
    Math.floor(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
  
  return {
    summary: {
      total,
      passed,
      failed,
      passRate: (passed/total*100).toFixed(1) + '%'
    },
    failures: failureStats,
    timing: {
      avgDuration,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0
    },
    timestamp: Date.now()
  };
}

// CLI entry point
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: benchmark-analyzer.js <job_dir> [--failed-only] [--retry-cmd] [--json]');
    console.log('  <job_dir>         Job directory to analyze');
    console.log('  --failed-only     Show only failed tasks');
    console.log('  --retry-cmd       Generate retry command');
    console.log('  --json            Output stats as JSON');
    process.exit(1);
  }
  
  const jobDir = path.resolve(args[0]);
  const failedOnly = args.includes('--failed-only');
  const retryCmd = args.includes('--retry-cmd');
  const jsonOutput = args.includes('--json');
  
  if (!fs.existsSync(jobDir)) {
    console.log(`Job directory not found: ${jobDir}`);
    process.exit(1);
  }
  
  const trials = analyzeJob(jobDir, failedOnly);
  
  if (trials) {
    if (retryCmd) {
      generateRetryCmd(trials, jobDir);
    }
    
    if (jsonOutput) {
      const stats = generateStats(trials);
      console.log('\nJSON Stats:');
      console.log(JSON.stringify(stats, null, 2));
    }
  }
}

module.exports = { analyzeJob, classifyFailure, generateRetryCmd, generateStats, FAILURE_TYPES };