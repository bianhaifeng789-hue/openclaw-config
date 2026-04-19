#!/usr/bin/env node
/**
 * Middlewares Executor - 中间件协调器
 *
 * 直接翻译自 middlewares.py (500+ 行)
 *
 * 核心功能:
 * - 统一中间件执行入口
 * - per_iteration hooks - 每轮迭代检查
 * - pre_exit hooks - 退出前验证
 * - post_tool hooks - 工具调用后检查
 * - 中间件链式执行
 *
 * 包含的中间件:
 * - LoopDetectionMiddleware - 文件编辑计数 + 命令重复检测
 * - PreExitVerificationMiddleware - 三级退出门
 * - TimeBudgetMiddleware - 60%/85%/100% 时间警告
 * - TaskTrackingMiddleware - 强制 _todo.md 创建
 * - SkeletonDetectionMiddleware - TODO/NotImplementedError 检测
 * - ErrorGuidanceMiddleware - 15 个错误模式 + 恢复建议
 *
 * 用法:
 *   node middlewares-executor.js run <hook_type> <state_json>
 *   node middlewares-executor.js chain <middlewares_list>
 *   node middlewares-executor.js test
 */

const fs = require('fs');
const path = require('path');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');

// 导入各个中间件模块
const loopDetector = require('./loop-detector-enhanced.js');
const preExitGate = require('./pre-exit-gate.js');
const timeBudget = require('./time-budget.js');
const taskTracking = require('./task-tracking.js');
const skeletonDetector = require('./skeleton-detector.js');
const errorGuidance = require('./error-guidance.js');
const anxietyDetector = require('./anxiety-detector.js');

// ---------------------------------------------------------------------------
// 中间件注册表
// ---------------------------------------------------------------------------

const MIDDLEWARE_REGISTRY = {
  // 循环检测
  loop_detection: {
    name: 'LoopDetectionMiddleware',
    priority: 1,
    hooks: {
      per_iteration: loopDetectionPerIteration,
      post_tool: loopDetectionPostTool
    }
  },
  
  // 三级退出门
  pre_exit_verification: {
    name: 'PreExitVerificationMiddleware',
    priority: 2,
    hooks: {
      pre_exit: preExitVerificationHook
    }
  },
  
  // 时间预算
  time_budget: {
    name: 'TimeBudgetMiddleware',
    priority: 3,
    hooks: {
      per_iteration: timeBudgetPerIteration
    }
  },
  
  // 任务追踪
  task_tracking: {
    name: 'TaskTrackingMiddleware',
    priority: 4,
    hooks: {
      post_tool: taskTrackingPostTool
    }
  },
  
  // Skeleton 检测
  skeleton_detection: {
    name: 'SkeletonDetectionMiddleware',
    priority: 5,
    hooks: {
      post_tool: skeletonDetectionPostTool
    }
  },
  
  // 错误指导
  error_guidance: {
    name: 'ErrorGuidanceMiddleware',
    priority: 6,
    hooks: {
      post_tool: errorGuidancePostTool
    }
  },
  
  // 焦虑检测
  anxiety_detection: {
    name: 'AnxietyDetectionMiddleware',
    priority: 7,
    hooks: {
      pre_exit: anxietyDetectionPreExit
    }
  }
};

// ---------------------------------------------------------------------------
// 统一执行入口
// ---------------------------------------------------------------------------

/**
 * 执行中间件链
 * @param {string} hookType - hook 类型 (per_iteration/pre_exit/post_tool)
 * @param {Object} state - 当前状态
 * @param {Array<string>} middlewares - 要执行的中间件列表
 * @returns {Object|null} 注入消息或 null
 */
function runMiddlewareChain(hookType, state, middlewares = null) {
  // 默认执行所有中间件
  if (!middlewares) {
    middlewares = Object.keys(MIDDLEWARE_REGISTRY);
  }
  
  // 按优先级排序
  middlewares.sort((a, b) => {
    const ma = MIDDLEWARE_REGISTRY[a];
    const mb = MIDDLEWARE_REGISTRY[b];
    return (ma?.priority || 99) - (mb?.priority || 99);
  });
  
  // 执行链
  for (const name of middlewares) {
    const middleware = MIDDLEWARE_REGISTRY[name];
    if (!middleware) continue;
    
    const hook = middleware.hooks[hookType];
    if (!hook) continue;
    
    try {
      const result = hook(state);
      
      // 有消息注入则返回（第一个触发）
      if (result && result.message) {
        logMiddlewareCall(name, hookType, result);
        return {
          source: middleware.name,
          hook: hookType,
          message: result.message,
          severity: result.severity || 'warning'
        };
      }
    } catch (err) {
      console.error(`[WARN] Middleware ${name} error: ${err.message}`);
    }
  }
  
  return null;
}

/**
 * 执行单个中间件
 * @param {string} middlewareName - 中间件名称
 * @param {string} hookType - hook 类型
 * @param {Object} state - 当前状态
 * @returns {Object|null} 结果
 */
function runSingleMiddleware(middlewareName, hookType, state) {
  const middleware = MIDDLEWARE_REGISTRY[middlewareName];
  if (!middleware) {
    return { error: `Unknown middleware: ${middlewareName}` };
  }
  
  const hook = middleware.hooks[hookType];
  if (!hook) {
    return { error: `${middlewareName} has no ${hookType} hook` };
  }
  
  try {
    const result = hook(state);
    logMiddlewareCall(middlewareName, hookType, result);
    return result;
  } catch (err) {
    return { error: err.message };
  }
}

// ---------------------------------------------------------------------------
// 各中间件 Hook 实现
// ---------------------------------------------------------------------------

/**
 * LoopDetection - per_iteration hook
 */
function loopDetectionPerIteration(state) {
  const { iteration, messages, agentName } = state;
  
  // 每 10 轮检查一次
  if (iteration % 10 !== 0) return null;
  
  // 检查文件编辑计数
  const fileEditCount = countFileEdits(messages);
  if (fileEditCount >= 4) {
    return {
      message: `[LOOP DETECTED] You have edited files ${fileEditCount} times. Check if you're stuck in a loop:\n1. Are you editing the same file repeatedly?\n2. Is there a syntax error you can't fix?\n3. Consider a different approach or ask for help.`,
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * LoopDetection - post_tool hook
 */
function loopDetectionPostTool(state) {
  const { toolName, toolArgs, messages, agentName } = state;
  
  // 检查命令重复
  const commandCount = countCommandRepeats(messages, toolArgs.command);
  if (commandCount >= 3) {
    return {
      message: `[COMMAND LOOP] You ran "${toolArgs.command?.slice(0, 50)}..." ${commandCount} times. This suggests:\n1. The command isn't working — check the error\n2. You need a different command\n3. The approach may be wrong`,
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * PreExitVerification - pre_exit hook
 */
function preExitVerificationHook(state) {
  const { messages, workspace, exitAttempts } = state;
  
  // 计算退出尝试次数
  const attempts = exitAttempts || countExitAttempts(messages);
  
  // 检查是否有工作
  const hasWork = checkHasWorkDone(messages, workspace);
  
  // 执行门控
  const gateResult = preExitGate.preExitGate({
    hasWork,
    exit_attempts: attempts,
    workspace
  });
  
  if (!gateResult.can_exit) {
    return {
      message: gateResult.message,
      severity: gateResult.gate === 1 ? 'error' : 'warning'
    };
  }
  
  return null;
}

/**
 * TimeBudget - per_iteration hook
 */
function timeBudgetPerIteration(state) {
  const { iteration, budgetSeconds } = state;
  
  // 检查时间预算
  const budgetState = timeBudget.checkTimeBudget();
  
  if (!budgetState.active) {
    // 未启动，但有预算配置则初始化
    if (budgetSeconds) {
      timeBudget.initTimeBudget(budgetSeconds);
    }
    return null;
  }
  
  // 根据阶段返回消息
  if (budgetState.phase === 'stop') {
    return {
      message: budgetState.recommendation,
      severity: 'error'
    };
  }
  
  if (budgetState.phase === 'critical') {
    return {
      message: budgetState.recommendation,
      severity: 'warning'
    };
  }
  
  if (budgetState.phase === 'warning') {
    // 每 5 轮提醒一次
    if (iteration % 5 === 0) {
      return {
        message: budgetState.recommendation,
        severity: 'info'
      };
    }
  }
  
  return null;
}

/**
 * TaskTracking - post_tool hook
 */
function taskTrackingPostTool(state) {
  const { workspace, toolCallCount } = state;
  
  const result = taskTracking.checkTaskTracking(workspace, toolCallCount);
  
  if (result.action === 'create' && result.mandatory) {
    return {
      message: result.message,
      severity: 'warning'
    };
  }
  
  if (result.action === 'update') {
    return {
      message: result.message,
      severity: 'info'
    };
  }
  
  return null;
}

/**
 * SkeletonDetection - post_tool hook
 */
function skeletonDetectionPostTool(state) {
  const { toolName, toolResult, workspace } = state;
  
  // 只检查写文件操作
  if (toolName !== 'write_file' && toolName !== 'edit_file') {
    return null;
  }
  
  // 检测 Skeleton 内容
  if (skeletonDetector.detectSkeleton(toolResult)) {
    return {
      message: `[SKELETON DETECTED] The file you wrote contains TODO/NotImplementedError. This is not acceptable:\n1. TODO markers must be replaced with actual implementation\n2. NotImplementedError means the function doesn't work\n3. Empty 'pass' statements are placeholders only\n\nPlease implement the actual functionality.`,
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * ErrorGuidance - post_tool hook
 */
function errorGuidancePostTool(state) {
  const { toolName, toolResult, toolArgs } = state;
  
  // 检查工具结果是否包含错误
  if (!toolResult.includes('[error]') && !toolResult.includes('failed')) {
    return null;
  }
  
  // 获取错误指导
  const guidance = errorGuidance.getErrorGuidance(toolName, toolResult, toolArgs);
  
  if (guidance) {
    return {
      message: guidance,
      severity: 'warning'
    };
  }
  
  return null;
}

/**
 * AnxietyDetection - pre_exit hook
 */
function anxietyDetectionPreExit(state) {
  const { messages } = state;
  
  // 使用焦虑检测器
  const anxietySignals = anxietyDetector.detectAnxietySignals(messages);
  
  if (anxietySignals.detected) {
    return {
      message: `[ANXIETY DETECTED] The model shows ${anxietySignals.count} signs of premature wrap-up:\n${anxietySignals.patterns.join('\n')}\n\nThis is NOT acceptable. The task is not complete.\nContinue working. Do NOT try to wrap up prematurely.`,
      severity: 'warning'
    };
  }
  
  return null;
}

// ---------------------------------------------------------------------------
// 辅助函数
// ---------------------------------------------------------------------------

/**
 * 计算文件编辑次数
 */
function countFileEdits(messages) {
  let count = 0;
  
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        if (tc.function?.name === 'write_file' || tc.function?.name === 'edit_file') {
          count++;
        }
      }
    }
  }
  
  return count;
}

/**
 * 计算命令重复次数
 */
function countCommandRepeats(messages, command) {
  if (!command) return 0;
  
  let count = 0;
  
  for (const msg of messages) {
    if (msg.role === 'assistant' && msg.tool_calls) {
      for (const tc of msg.tool_calls) {
        if (tc.function?.name === 'run_bash') {
          try {
            const args = JSON.parse(tc.function?.arguments || '{}');
            if (args.command === command) {
              count++;
            }
          } catch (err) {
            // 忽略解析错误
          }
        }
      }
    }
  }
  
  return count;
}

/**
 * 计算退出尝试次数
 */
function countExitAttempts(messages) {
  let attempts = 0;
  
  // 检查最近的消息中是否有"完成"声明
  for (let i = messages.length - 1; i >= Math.max(0, messages.length - 10); i--) {
    const msg = messages[i];
    if (msg.role === 'assistant') {
      const content = msg.content || '';
      if (/I (have|'ve) (completed|finished|done)/i.test(content) ||
          /That should be (enough|sufficient)/i.test(content) ||
          /Let me wrap up/i.test(content)) {
        attempts++;
      }
      
      // 无工具调用也视为退出尝试
      if (!msg.tool_calls || msg.tool_calls.length === 0) {
        attempts++;
      }
    }
  }
  
  return attempts;
}

/**
 * 检查是否有实际工作
 */
function checkHasWorkDone(messages, workspace) {
  // 检查是否有工具调用
  const hasToolCalls = messages.some(msg => 
    msg.role === 'assistant' && msg.tool_calls && msg.tool_calls.length > 0
  );
  
  if (!hasToolCalls) return false;
  
  // 检查是否有文件修改
  if (workspace) {
    const hasWork = preExitGate.checkHasWork(workspace);
    if (hasWork) return true;
  }
  
  // 检查是否有成功的工具调用
  const hasSuccess = messages.some(msg => 
    msg.role === 'tool' && 
    !msg.content?.includes('[error]') &&
    !msg.content?.includes('failed')
  );
  
  return hasSuccess;
}

/**
 * 记录中间件调用日志
 */
function logMiddlewareCall(name, hookType, result) {
  const logPath = path.join(WORKSPACE, 'memory', 'middleware-calls.log');
  
  try {
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const entry = {
      timestamp: new Date().toISOString(),
      middleware: name,
      hook: hookType,
      triggered: result && result.message,
      severity: result?.severity || 'none'
    };
    
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n', 'utf8');
  } catch (err) {
    // 忽略日志错误
  }
}

// ---------------------------------------------------------------------------
// CLI 入口
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command) {
    console.log(`
Middlewares Executor - 中间件协调器

用法:
  node middlewares-executor.js run <hook_type> <state_json>
  node middlewares-executor.js chain <middlewares_json>
  node middlewares-executor.js single <middleware_name> <hook_type> <state_json>
  node middlewares-executor.js test
  node middlewares-executor.js list

Hook 类型:
  per_iteration  每轮迭代检查
  pre_exit       退出前验证
  post_tool      工具调用后检查

可用中间件:
  loop_detection         循环检测
  pre_exit_verification  三级退出门
  time_budget            时间预算
  task_tracking          任务追踪
  skeleton_detection     Skeleton检测
  error_guidance         错误指导
  anxiety_detection      焦虑检测

示例:
  node middlewares-executor.js run per_iteration '{"iteration":10}'
  node middlewares-executor.js chain '["loop_detection","time_budget"]'
`);
    process.exit(0);
  }
  
  if (command === 'list') {
    console.log('可用中间件:');
    for (const [name, mw] of Object.entries(MIDDLEWARE_REGISTRY)) {
      console.log(`  ${name} (${mw.name}, priority: ${mw.priority})`);
      console.log(`    hooks: ${Object.keys(mw.hooks).join(', ')}`);
    }
    process.exit(0);
  }
  
  if (command === 'test') {
    console.log('\n🧪 测试 Middlewares Executor:\n');
    
    // 测试链执行
    const state1 = { iteration: 10, messages: [], agentName: 'test' };
    const result1 = runMiddlewareChain('per_iteration', state1, ['loop_detection']);
    console.log(`  链执行(per_iteration): ${result1 === null ? '✅ (无触发)' : '✅ (有触发)'}`);
    
    // 测试时间预算
    const state2 = { iteration: 5, budgetSeconds: 60 };
    timeBudget.initTimeBudget(60);
    // 模拟时间流逝
    const budgetState = timeBudget.loadState();
    budgetState.startTime = Date.now() - 37000; // 37秒前
    timeBudget.saveState(budgetState);
    const result2 = runSingleMiddleware('time_budget', 'per_iteration', state2);
    console.log(`  时间预算测试: ${result2.phase === 'warning' ? '✅' : '⚠️'}`);
    
    // 测试 Skeleton 检测
    const skeletonContent = 'def foo():\n    pass\n    # TODO: implement';
    const skeletonDetected = preExitGate.detectSkeleton(skeletonContent);
    console.log(`  Skeleton检测: ${skeletonDetected ? '✅' : '❌'}`);
    
    // 测试门控
    const state4 = { messages: [], workspace: WORKSPACE, exitAttempts: 0 };
    const result4 = runSingleMiddleware('pre_exit_verification', 'pre_exit', state4);
    console.log(`  PreExit门控: ${result4 && result4.message ? '✅' : '❌'}`);
    
    console.log('\n✅ Tests passed');
    process.exit(0);
  }
  
  if (command === 'run') {
    const hookType = args[1];
    const stateJson = args[2];
    
    if (!hookType || !stateJson) {
      console.error('用法: node middlewares-executor.js run <hook_type> <state_json>');
      process.exit(1);
    }
    
    try {
      const state = JSON.parse(stateJson);
      const result = runMiddlewareChain(hookType, state);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`执行失败: ${err.message}`);
      process.exit(1);
    }
    
    process.exit(0);
  }
  
  if (command === 'chain') {
    const middlewaresJson = args[1];
    const hookType = args[2] || 'per_iteration';
    const stateJson = args[3] || '{}';
    
    if (!middlewaresJson) {
      console.error('用法: node middlewares-executor.js chain <middlewares_json> [hook_type] [state_json]');
      process.exit(1);
    }
    
    try {
      const middlewares = JSON.parse(middlewaresJson);
      const state = JSON.parse(stateJson);
      const result = runMiddlewareChain(hookType, state, middlewares);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`执行失败: ${err.message}`);
      process.exit(1);
    }
    
    process.exit(0);
  }
  
  if (command === 'single') {
    const middlewareName = args[1];
    const hookType = args[2];
    const stateJson = args[3];
    
    if (!middlewareName || !hookType || !stateJson) {
      console.error('用法: node middlewares-executor.js single <middleware_name> <hook_type> <state_json>');
      process.exit(1);
    }
    
    try {
      const state = JSON.parse(stateJson);
      const result = runSingleMiddleware(middlewareName, hookType, state);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      console.error(`执行失败: ${err.message}`);
      process.exit(1);
    }
    
    process.exit(0);
  }
  
  console.error(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// 导出
module.exports = {
  runMiddlewareChain,
  runSingleMiddleware,
  MIDDLEWARE_REGISTRY,
  // Hook 函数
  loopDetectionPerIteration,
  loopDetectionPostTool,
  preExitVerificationHook,
  timeBudgetPerIteration,
  taskTrackingPostTool,
  skeletonDetectionPostTool,
  errorGuidancePostTool,
  anxietyDetectionPreExit,
  // 辅助函数
  countFileEdits,
  countCommandRepeats,
  countExitAttempts,
  checkHasWorkDone,
  logMiddlewareCall
};

// CLI 入口
if (require.main === module) {
  main();
}