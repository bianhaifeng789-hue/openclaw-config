/**
 * Terminal Profile - CLI 任务配置（TB2优化）
 * 
 * 来源：Harness Engineering - profiles/terminal.py
 * 
 * 特性：
 * - 动态时间分配（TB2 元数据驱动）
 * - ENV_BOOTSTRAP_COMMANDS（15条）
 * - 单 Agent 架构（无 Planner）
 * - 所有参数可配置
 */

const { BaseProfile } = require('./base');
const fs = require('fs');
const path = require('path');

// TB2 任务元数据（从 benchmarks/tb2_tasks.json 加载）
let TB2_TASKS = null;

function loadTB2Tasks() {
  if (TB2_TASKS === null) {
    const tb2Path = path.join(__dirname, '..', 'benchmarks', 'tb2_tasks.json');
    if (fs.existsSync(tb2Path)) {
      TB2_TASKS = JSON.parse(fs.readFileSync(tb2Path, 'utf8'));
    } else {
      TB2_TASKS = {};
    }
  }
  return TB2_TASKS;
}

// 环境探测命令（启动时预收集）
const ENV_BOOTSTRAP_COMMANDS = [
  'uname -a',
  'pwd',
  'ls -la /app/ 2>/dev/null || echo "/app not found"',
  'ls -la . 2>/dev/null',
  'python3 --version 2>/dev/null; python --version 2>/dev/null',
  'which gcc g++ make cmake 2>/dev/null || true',
  'pip3 list 2>/dev/null | head -30 || true',
  'cat /etc/os-release 2>/dev/null | head -5 || true',
  'df -h / 2>/dev/null | tail -1 || true',
  'free -h 2>/dev/null | head -2 || true',
  'env | grep -iE "^(PATH|HOME|USER|LANG|LC_)" 2>/dev/null || true',
  // Git context
  'git -C /app log --oneline -5 2>/dev/null || true',
  'git -C /app status --short 2>/dev/null || true',
  'git -C /app branch -a 2>/dev/null | head -10 || true',
  // Service detection
  'which qemu-system-x86_64 docker postfix 2>/dev/null || true',
  'ss -tlnp 2>/dev/null | head -10 || netstat -tlnp 2>/dev/null | head -10 || true'
];

class TerminalProfile extends BaseProfile {
  constructor(config = {}) {
    super({
      taskBudget: 1800, // 30 min default
      plannerBudget: 0, // 跳过 Planner
      evaluatorBudget: 0, // 动态决定
      passThreshold: 8.0, // TB2 binary pass/fail
      maxRounds: 2, // TB2 最多 2 轮
      ...config
    });

    this.middlewares = [
      'loop-detection',
      'time-budget',
      'pre-exit-verification',
      'task-tracking',
      'error-guidance',
      'skeleton-detection'
    ];

    this.bootstrapCommands = ENV_BOOTSTRAP_COMMANDS;
  }

  name() {
    return 'terminal';
  }

  description() {
    return 'Solve terminal/CLI tasks (Terminal-Bench-2 style)';
  }

  // 动态时间分配（基于 TB2 元数据）
  getDynamicTimeout(workspacePath, taskPrompt) {
    const tasks = loadTB2Tasks();
    
    // 尝试匹配任务
    const taskName = this.matchTask(workspacePath, taskPrompt, tasks);
    
    if (taskName && tasks[taskName]) {
      return {
        timeout: tasks[taskName].agent_timeout_sec,
        difficulty: tasks[taskName].difficulty,
        category: tasks[taskName].category
      };
    }
    
    // 默认配置
    return {
      timeout: this.resolve('taskBudget'),
      difficulty: 'unknown',
      category: 'general'
    };
  }

  // 任务匹配算法
  matchTask(workspacePath, taskPrompt, tasks) {
    // 1. Workspace 路径精确匹配（最可靠）
    for (const [name, meta] of Object.entries(tasks)) {
      if (workspacePath.includes(name) || workspacePath.includes(name.replace(/-/g, '_'))) {
        return name;
      }
    }
    
    // 2. Prompt 文本匹配
    const promptLower = taskPrompt.toLowerCase();
    for (const [name, meta] of Object.entries(tasks)) {
      const nameVariants = [
        name,
        name.replace(/-/g, ' '),
        name.replace(/-/g, '_')
      ];
      
      for (const variant of nameVariants) {
        if (promptLower.includes(variant.toLowerCase())) {
          return name;
        }
      }
    }
    
    return null;
  }

  // 时间分配策略（基于 TB2 leaderboard 分析）
  allocateTime(timeout) {
    // ≤900s: 跳过 Planner + Evaluator，Builder 独立
    if (timeout <= 900) {
      return {
        planner: 0,
        builder: timeout,
        evaluator: 0,
        strategy: 'skip-all'
      };
    }
    
    // ≤1800s: 跳过 Planner，Builder 独立
    if (timeout <= 1800) {
      return {
        planner: 0,
        builder: timeout,
        evaluator: 0,
        strategy: 'skip-planner'
      };
    }
    
    // >1800s: 跳过 Planner，保留 Evaluator（Round 2 修复）
    return {
      planner: 0,
      builder: Math.floor(timeout * 0.9),
      evaluator: Math.floor(timeout * 0.1),
      strategy: 'with-evaluator'
    };
  }

  // 获取环境探测结果
  getBootstrapContext() {
    return {
      commands: this.bootstrapCommands,
      description: 'Pre-collect environment info to avoid exploration time'
    };
  }

  defaultValues = {
    ...super.defaultValues,
    taskBudget: 1800,
    plannerBudget: 0,
    evaluatorBudget: 0,
    passThreshold: 8.0,
    maxRounds: 2,
    loopFileEditThreshold: 3,
    loopCommandRepeatThreshold: 3,
    taskTrackingNudgeAfter: 5,
    timeWarnThreshold: 0.55,
    timeCriticalThreshold: 0.85
  };
}

module.exports = { 
  TerminalProfile, 
  ENV_BOOTSTRAP_COMMANDS, 
  loadTB2Tasks 
};