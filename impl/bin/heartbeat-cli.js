#!/usr/bin/env node
/**
 * Heartbeat CLI - 统一调用各种维护脚本
 *
 * Commands:
 *   status          - 显示所有模块状态
 *   check           - 快速检查需处理任务
 *   run             - 执行第一个待处理任务
 *   tasks           - 显示活动任务
 *   auto-dream      - 检查 dream gates 状态
 *   compact         - 检查压缩阈值
 *   gates           - 检查所有 gates 状态
 *   cleanup         - 执行压缩后清理
 *   coordinator     - 显示协调模式状态
 *   cache           - 显示 forked cache 状态
 *   memory          - 显示 memory 提取状态
 *   rate-limit      - 检查 rate limit 状态
 *   away            - 检查 away summary 状态
 *   skill-files     - 列出已提取的 skill 文件
 *   all             - 运行所有检查
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const BIN_DIR = __dirname;
const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');

// Script registry
const SCRIPTS = {
  'health-monitor': path.join(BIN_DIR, 'health-monitor.js'),
  'heartbeat-guardian': path.join(BIN_DIR, 'heartbeat-guardian.js'),
  'auto-dream-gates': path.join(BIN_DIR, 'auto-dream-gates.js'),
  'compact-threshold': path.join(BIN_DIR, 'compact-threshold.js'),
  'forked-agent-cache': path.join(BIN_DIR, 'forked-agent-cache.js'),
  'dream-task-visualizer': path.join(BIN_DIR, 'dream-task-visualizer.js'),
  'extract-memories-timer': path.join(BIN_DIR, 'extract-memories-timer.js'),
  'compact-warning-hook': path.join(BIN_DIR, 'compact-warning-hook.js'),
  'post-compact-cleanup': path.join(BIN_DIR, 'post-compact-cleanup.js'),
  'agent-memory-scope': path.join(BIN_DIR, 'agent-memory-scope.js'),
  'coordinator-mode-switch': path.join(BIN_DIR, 'coordinator-mode-switch.js'),
  'bundled-skill-files': path.join(BIN_DIR, 'bundled-skill-files.js'),
  'time-based-mc-config': path.join(BIN_DIR, 'time-based-mc-config.js'),
  'session-memory-compact': path.join(BIN_DIR, 'session-memory-compact.js'),
  'away-summary-generator': path.join(BIN_DIR, 'away-summary-generator.js'),
  'rate-limit-messages': path.join(BIN_DIR, 'rate-limit-messages.js'),
  'compact-cli': path.join(BIN_DIR, 'compact-cli.js')
};

function runScript(scriptName, args = []) {
  const scriptPath = SCRIPTS[scriptName];
  if (!scriptPath || !fs.existsSync(scriptPath)) {
    return { error: `script not found: ${scriptName}`, path: scriptPath };
  }

  try {
    const result = execSync(`node "${scriptPath}" ${args.join(' ')}`, {
      encoding: 'utf8',
      timeout: 30000
    });
    return JSON.parse(result);
  } catch (e) {
    // Some scripts output non-JSON status
    return { rawOutput: e.stdout || e.message, error: e.stderr };
  }
}

function getExecutorStats() {
  const stats = {
    tasksDefined: 24,
    lastCheckTime: null,
    scriptsAvailable: Object.keys(SCRIPTS).filter(k => fs.existsSync(SCRIPTS[k])).length,
    scriptsTotal: Object.keys(SCRIPTS).length,
    modules: {}
  };

  // Check each module status
  for (const [name, scriptPath] of Object.entries(SCRIPTS)) {
    stats.modules[name] = {
      exists: fs.existsSync(scriptPath),
      path: scriptPath
    };
  }

  return stats;
}

async function quickHeartbeatCheck() {
  const checks = [];

  // Check dream gates
  try {
    const dreamGates = runScript('auto-dream-gates', ['check']);
    checks.push({ name: 'auto-dream-gates', result: dreamGates });
  } catch (e) {
    checks.push({ name: 'auto-dream-gates', error: e.message });
  }

  // Check rate limit
  try {
    const rateLimit = runScript('rate-limit-messages', ['check']);
    checks.push({ name: 'rate-limit-messages', result: rateLimit });
  } catch (e) {
    checks.push({ name: 'rate-limit-messages', error: e.message });
  }

  // Check coordinator mode
  try {
    const coordinator = runScript('coordinator-mode-switch', ['status']);
    checks.push({ name: 'coordinator-mode', result: coordinator });
  } catch (e) {
    checks.push({ name: 'coordinator-mode', error: e.message });
  }

  // Determine which tasks need processing
  const needsProcessing = [];

  for (const check of checks) {
    if (check.result) {
      // Auto-dream gates check
      if (check.name === 'auto-dream-gates' && check.result.allGatesOpen) {
        needsProcessing.push('auto-dream');
      }
      // Rate limit check
      if (check.name === 'rate-limit-messages' && check.result.hasLimit) {
        needsProcessing.push('rate-limit-check');
      }
    }
  }

  // Time-based triggers only (no hardcoded standardChecks)
  const stateFile = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');
  let state = {};
  if (fs.existsSync(stateFile)) {
    try {
      state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    } catch {
      state = {};
    }
  }

  // Check time-based triggers
  const now = Date.now();
  const intervals = {
    'task-visualizer': 30 * 60 * 1000,
    'away-summary': 30 * 60 * 1000,
    'rate-limit-check': 30 * 60 * 1000,
    'memory-maintenance': 2 * 60 * 60 * 1000,
    'extract-memories': 2 * 60 * 60 * 1000,
    'auto-dream': 24 * 60 * 60 * 1000,
    'memory-compact': 24 * 60 * 60 * 1000,
    'loop-detection-check': 30 * 60 * 1000,
    'memory-signals-check': 2 * 60 * 60 * 1000,
    'sandbox-audit-check': 6 * 60 * 60 * 1000
  };

  for (const [task, interval] of Object.entries(intervals)) {
    const lastRun = state.lastRuns?.[task] || 0;
    const elapsed = now - lastRun;
    // Only add if elapsed >= interval AND not just executed (< 1 min grace period)
    if (elapsed >= interval && elapsed > 60000) {
      needsProcessing.push(task);
    }
  }

  return {
    needsProcessing,
    checks,
    state,
    timestamp: now
  };
}

async function runHeartbeatExecutor() {
  const checkResult = await quickHeartbeatCheck();

  if (checkResult.needsProcessing.length === 0) {
    return { message: 'No tasks need processing', checkResult }; 
  }

  // Run all tasks in needsProcessing
  const results = [];
  const state = checkResult.state;

  for (const task of checkResult.needsProcessing) {
    let result;

    switch (task) {
    case 'task-visualizer':
      result = await hookTaskVisualization();
      result.task = 'task-visualizer';
      result.needsNotification = result.activeTasks?.tasks?.length > 0;
      break;
    case 'auto-dream':
      const dreamGates = runScript('auto-dream-gates', ['check']);
      if (dreamGates.allGatesOpen) {
        result = { task: 'auto-dream', status: 'gates_open', needsForkedAgent: true, gates: dreamGates };
      } else {
        result = { task: 'auto-dream', status: 'gates_closed', gates: dreamGates };
      }
      break;
    case 'memory-compact':
      const compactCheck = runScript('session-memory-compact', ['check']);
      if (compactCheck.needsCompact) {
        result = { task: 'memory-compact', status: 'needs_compact', needsNotification: true, data: compactCheck };
      }
      break;
    case 'memory-maintenance':
      const nowMs = Date.now();
      const lastReviewTs = state.lastMemoryReview || 0;
      const hoursSinceReview = (nowMs - lastReviewTs) / (1000 * 60 * 60);
      if (hoursSinceReview >= 2) {
        result = { task: 'memory-maintenance', status: 'needs_review', hoursSince: hoursSinceReview.toFixed(2), lastReview: lastReviewTs ? new Date(lastReviewTs).toISOString() : 'never' };
      } else {
        result = { task: 'memory-maintenance', status: 'within_threshold', hoursSince: hoursSinceReview.toFixed(2) };
      }
      break;
    case 'rate-limit-check':
      const rateLimitCheck = runScript('rate-limit-messages', ['check']);
      if (rateLimitCheck.approachingLimit || rateLimitCheck.exhausted) {
        result = { task: 'rate-limit-check', status: 'warning', needsNotification: true, data: rateLimitCheck };
      } else {
        result = { task: 'rate-limit-check', status: 'ok', data: rateLimitCheck };
      }
      break;
    case 'extract-memories':
      const extractCheck = runScript('extract-memories-timer', ['check']);
      if (extractCheck.shouldExtract) {
        result = { task: 'extract-memories', status: 'needs_extract', needsForkedAgent: true, data: extractCheck };
      } else {
        result = { task: 'extract-memories', status: 'within_threshold', data: extractCheck };
      }
      break;
    case 'away-summary':
      const awayCheck = runScript('away-summary-generator', ['check-focus']);
      if (awayCheck.awayDuration && awayCheck.awayDuration > 30 * 60 * 1000) {
        result = { task: 'away-summary', status: 'needs_summary', needsNotification: true, data: awayCheck };
      } else {
        result = { task: 'away-summary', status: 'within_threshold', data: awayCheck };
      }
      break;
    case 'health-monitor':
      const healthCheck = runScript('health-monitor', ['check']);
      if (!healthCheck.overallOk) {
        result = { task: 'health-monitor', status: 'issues_detected', needsNotification: true, needsRecovery: healthCheck.gateway?.state !== 'active', data: healthCheck };
      } else if (healthCheck.warningIssues > 0) {
        result = { task: 'health-monitor', status: 'warnings', needsNotification: true, data: healthCheck };
      } else {
        result = { task: 'health-monitor', status: 'healthy', data: healthCheck };
      }
      break;
    case 'loop-detection-check':
      const loopDetectorPath = path.join(BIN_DIR, 'loop-detector.js');
      try {
        const loopStatus = execSync(`node "${loopDetectorPath}" status`, { encoding: 'utf8', timeout: 5000 });
        const loopData = JSON.parse(loopStatus);
        if (loopData.highRiskLoops > 3) {
          result = { task: 'loop-detection-check', status: 'high_risk', needsNotification: true, data: loopData };
        } else {
          result = { task: 'loop-detection-check', status: 'ok', data: loopData };
        }
      } catch (e) {
        result = { task: 'loop-detection-check', status: 'ok', data: { threads: 0, totalCalls: 0, warnedThreads: 0 } };
      }
      break;
    case 'memory-signals-check':
      const lastSignalsCheck = state.lastMemorySignalsCheck || 0;
      const hoursSinceSignals = (Date.now() - lastSignalsCheck) / (1000 * 60 * 60);
      if (hoursSinceSignals >= 2) {
        result = { task: 'memory-signals-check', status: 'needs_check', hoursSince: hoursSinceSignals.toFixed(2), lastCheck: lastSignalsCheck ? new Date(lastSignalsCheck).toISOString() : 'never' };
      } else {
        result = { task: 'memory-signals-check', status: 'within_threshold', hoursSince: hoursSinceSignals.toFixed(2) };
      }
      break;
    case 'sandbox-audit-check':
      const auditLogPath = path.join(WORKSPACE, 'state', 'sandbox-audit.jsonl');
      if (fs.existsSync(auditLogPath)) {
        try {
          const auditContent = fs.readFileSync(auditLogPath, 'utf8');
          const lines = auditContent.trim().split('\n').slice(-100);  // Last 100 entries
          const recentOps = lines.map(l => JSON.parse(l)).filter(op => op.timestamp >= Date.now() - 6 * 60 * 60 * 1000);
          const highRiskCount = recentOps.filter(op => op.risk_level === 'high').length;
          if (highRiskCount > 10) {
            result = { task: 'sandbox-audit-check', status: 'high_risk', needsNotification: true, data: { highRiskCount, totalOps: recentOps.length } };
          } else {
            result = { task: 'sandbox-audit-check', status: 'ok', data: { highRiskCount, totalOps: recentOps.length } };
          }
        } catch (e) {
          result = { task: 'sandbox-audit-check', status: 'ok', data: { error: e.message } };
        }
      } else {
        result = { task: 'sandbox-audit-check', status: 'no_logs' };
      }
      break;
    default:
      result = { task, message: 'Task handler not implemented' };
  }

    // Update state for each task
    state.lastRuns = state.lastRuns || {};
    state.lastRuns[task] = Date.now();

    results.push({ task, result });
  }

  // Save state
  const stateFile = path.join(WORKSPACE, 'memory', 'heartbeat-state.json');
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

  return {
    tasksProcessed: checkResult.needsProcessing,
    results,
    stateUpdated: true
  };
}

async function hookTaskVisualization() {
  // Get active dream tasks - use getActiveDreamTasks directly
  const dreamTasksPath = path.join(WORKSPACE, 'state', 'tasks', 'dream-tasks.json');
  let activeTasks = { tasks: [] };
  if (fs.existsSync(dreamTasksPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dreamTasksPath, 'utf8'));
      activeTasks = { tasks: data.tasks.filter(t => t.status === 'running') || [] };
    } catch {}
  }

  // Get recently completed
  const recentThreshold = Date.now() - 5 * 60 * 1000;
  let recentCompleted = { tasks: [] };
  if (fs.existsSync(dreamTasksPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(dreamTasksPath, 'utf8'));
      recentCompleted = { tasks: data.tasks.filter(t => t.status === 'completed' && t.completedAt >= recentThreshold) || [] };
    } catch {}
  }

  // Get cache status
  const cacheStatus = runScript('forked-agent-cache', ['list']);

  return {
    activeTasks,
    recentCompleted,
    cacheStatus,
    timestamp: Date.now()
  };
}

async function getAutoDreamState() {
  return runScript('auto-dream-gates', ['status']);
}

async function compactSessionMemory() {
  const config = runScript('session-memory-compact', ['get-config']);
  const check = runScript('session-memory-compact', ['check']);

  return {
    config,
    check,
    needsCompact: check.needsCompact || false
  };
}

async function checkAllGates() {
  const gates = {};

  // Dream gates
  gates.autoDream = runScript('auto-dream-gates', ['check']);

  // Compact threshold
  gates.compact = runScript('compact-threshold', ['calculate', 'glm-5']);

  // Rate limit
  gates.rateLimit = runScript('rate-limit-messages', ['check']);

  // Coordinator mode
  gates.coordinator = runScript('coordinator-mode-switch', ['status']);

  // Away summary
  gates.away = runScript('away-summary-generator', ['check-focus']);

  return gates;
}

async function runAllChecks() {
  const results = {};

  for (const [name] of Object.entries(SCRIPTS)) {
    try {
      results[name] = runScript(name, ['status']);
    } catch (e) {
      results[name] = { error: e.message };
    }
  }

  return {
    results,
    timestamp: Date.now(),
    workspace: WORKSPACE
  };
}

const command = process.argv[2] || 'status';

async function main() {
  try {
    switch (command) {
      case 'status':
        console.log(JSON.stringify(getExecutorStats(), null, 2));
        break;

      case 'check':
        const checkResult = await quickHeartbeatCheck();
        // Output simplified list for heartbeat
        if (checkResult.needsProcessing.length > 0) {
          console.log(`"需处理: ${checkResult.needsProcessing.join(', ')}"`);
        } else {
          console.log('"无需处理任务"');
        }
        break;

      case 'run':
        const runResult = await runHeartbeatExecutor();
        console.log(JSON.stringify(runResult, null, 2));
        break;

      case 'auto-dream':
        const dreamState = await getAutoDreamState();
        console.log(JSON.stringify(dreamState, null, 2));
        break;

      case 'compact':
        const compactResult = await compactSessionMemory();
        console.log(JSON.stringify(compactResult, null, 2));
        break;

      case 'tasks':
        const tasks = await hookTaskVisualization();
        console.log(JSON.stringify(tasks, null, 2));
        break;

      case 'gates':
        const gates = await checkAllGates();
        console.log(JSON.stringify(gates, null, 2));
        break;

      case 'cleanup':
        const cleanupResult = runScript('post-compact-cleanup', ['run']);
        console.log(JSON.stringify(cleanupResult, null, 2));
        break;

      case 'coordinator':
        const coordinatorStatus = runScript('coordinator-mode-switch', ['status']);
        console.log(JSON.stringify(coordinatorStatus, null, 2));
        break;

      case 'cache':
        const cacheStatus = runScript('forked-agent-cache', ['list']);
        console.log(JSON.stringify(cacheStatus, null, 2));
        break;

      case 'memory':
        const memoryStatus = runScript('extract-memories-timer', ['status']);
        console.log(JSON.stringify(memoryStatus, null, 2));
        break;

      case 'rate-limit':
        const rateLimitStatus = runScript('rate-limit-messages', ['check']);
        console.log(JSON.stringify(rateLimitStatus, null, 2));
        break;

      case 'away':
        const awayStatus = runScript('away-summary-generator', ['check-focus']);
        console.log(JSON.stringify(awayStatus, null, 2));
        break;

      case 'skill-files':
        const skillFiles = runScript('bundled-skill-files', ['list-extracted']);
        console.log(JSON.stringify(skillFiles, null, 2));
        break;

      case 'all':
        const allResults = await runAllChecks();
        console.log(JSON.stringify(allResults, null, 2));
        break;

      default:
        console.log('Unknown command:', command);
        console.log('');
        console.log('Available commands:');
        console.log('  status          - 显示所有模块状态');
        console.log('  check           - 快速检查需处理任务');
        console.log('  run             - 执行第一个待处理任务');
        console.log('  tasks           - 显示活动任务');
        console.log('  auto-dream      - 检查 dream gates');
        console.log('  compact         - 检查压缩阈值');
        console.log('  gates           - 检查所有 gates');
        console.log('  cleanup         - 执行压缩后清理');
        console.log('  coordinator     - 协调模式状态');
        console.log('  cache           - Forked cache 状态');
        console.log('  memory          - Memory 提取状态');
        console.log('  rate-limit      - Rate limit 状态');
        console.log('  away            - Away summary 状态');
        console.log('  skill-files     - Skill 文件列表');
        console.log('  all             - 运行所有检查');
        process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();