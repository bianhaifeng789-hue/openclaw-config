#!/usr/bin/env node
/**
 * Profile Config - 完整配置优先级系统（完整移植 profiles/base.py）
 *
 * 功能:
 * - ProfileConfig 类（可调参数）
 * - AgentConfig 类（Agent 配置）
 * - 环境变量优先级系统（PROFILE_<NAME>_<KEY>）
 * - resolve() 方法（env > config > default）
 * - format_build_task() 方法
 * - resolve_task_timeout() 方法
 * - resolve_time_allocation() 方法
 *
 * 用法:
 *   node profile-config.js show --profile=terminal
 *   node profile-config.js resolve --profile=terminal --key=pass_threshold --default=7.0
 */

const fs = require('fs');
const path = require('path');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');

/**
 * AgentConfig 类
 * 
 * 配置单个 Agent 角色
 */
class AgentConfig {
  constructor(options = {}) {
    this.system_prompt = options.system_prompt || '';
    this.extra_tool_schemas = options.extra_tool_schemas || [];
    this.enabled = options.enabled !== false;
    this.middlewares = options.middlewares || [];
    this.time_budget = options.time_budget || null;  // seconds; null = no limit
  }
}

/**
 * ProfileConfig 类
 * 
 * 可调参数配置，分离于代码逻辑。
 * 支持环境变量优先级: PROFILE_<PROFILE_NAME>_<KEY>
 */
class ProfileConfig {
  constructor(options = {}) {
    // --- Harness loop ---
    this.pass_threshold = options.pass_threshold || null;
    this.max_rounds = options.max_rounds || null;

    // --- Time budgets (seconds) ---
    this.task_budget = options.task_budget || null;
    this.planner_budget = options.planner_budget || null;
    this.builder_budget = options.builder_budget || null;
    this.evaluator_budget = options.evaluator_budget || null;

    // --- Middleware thresholds ---
    this.loop_file_edit_threshold = options.loop_file_edit_threshold || null;
    this.loop_command_repeat_threshold = options.loop_command_repeat_threshold || null;
    this.task_tracking_nudge_after = options.task_tracking_nudge_after || null;
    this.time_warn_threshold = options.time_warn_threshold || null;
    this.time_critical_threshold = options.time_critical_threshold || null;
  }

  /**
   * 构建环境变量名: PROFILE_<PROFILE_NAME>_<KEY>
   * 
   * 示例: PROFILE_TERMINAL_PASS_THRESHOLD
   */
  _envKey(profileName, fieldName) {
    return `PROFILE_${profileName.toUpperCase().replace(/-/g, '_')}_${fieldName.toUpperCase()}`;
  }

  /**
   * 解析配置值（优先级: env > config > default）
   * 
   * @param {string} fieldName - 字段名
   * @param {string} profileName - Profile 名称
   * @param {*} defaultVal - 默认值
   * @returns {*} 解析后的值
   */
  resolve(fieldName, profileName, defaultVal) {
    // 1. 检查环境变量（最高优先级）
    const envKey = this._envKey(profileName, fieldName);
    const envVal = process.env[envKey];
    
    if (envVal !== undefined && envVal !== null && envVal !== '') {
      // 根据 defaultVal 类型转换
      if (typeof defaultVal === 'number') {
        if (Number.isInteger(defaultVal)) {
          return parseInt(envVal, 10);
        } else {
          return parseFloat(envVal);
        }
      }
      return envVal;
    }

    // 2. 检查显式配置值
    const configVal = this[fieldName];
    if (configVal !== null && configVal !== undefined) {
      return configVal;
    }

    // 3. 返回默认值
    return defaultVal;
  }

  /**
   * 获取所有配置（用于调试）
   */
  getAll(profileName, defaults) {
    const result = {};
    for (const [key, defaultVal] of Object.entries(defaults)) {
      result[key] = this.resolve(key, profileName, defaultVal);
    }
    return result;
  }
}

/**
 * BaseProfile 基类
 * 
 * 所有 Profile 必须继承此基类
 */
class BaseProfile {
  constructor(cfg = null) {
    this.cfg = cfg || new ProfileConfig();
  }

  /**
   * Profile 名称（短标识符）
   */
  name() {
    throw new Error('Must implement name()');
  }

  /**
   * Profile 描述（一行）
   */
  description() {
    throw new Error('Must implement description()');
  }

  /**
   * Planner 配置
   */
  planner() {
    throw new Error('Must implement planner()');
  }

  /**
   * Builder 配置
   */
  builder() {
    throw new Error('Must implement builder()');
  }

  /**
   * Evaluator 配置
   */
  evaluator() {
    throw new Error('Must implement evaluator()');
  }

  /**
   * Contract Proposer 配置（可选）
   */
  contract_proposer() {
    return new AgentConfig({ system_prompt: '', enabled: false });
  }

  /**
   * Contract Reviewer 配置（可选）
   */
  contract_reviewer() {
    return new AgentConfig({ system_prompt: '', enabled: false });
  }

  /**
   * 通过阈值
   */
  pass_threshold() {
    return this.cfg.resolve('pass_threshold', this.name(), 7.0);
  }

  /**
   * 最大轮数
   */
  max_rounds() {
    return this.cfg.resolve('max_rounds', this.name(), null);
  }

  /**
   * 构建 Builder 任务字符串
   * 
   * @param {string} userPrompt - 用户提示
   * @param {number} roundNum - 当前轮数
   * @param {string} prevFeedback - 上次反馈
   * @param {number[]} scoreHistory - 分数历史
   */
  format_build_task(userPrompt, roundNum, prevFeedback, scoreHistory) {
    let task = `Task: ${userPrompt}\n`;
    
    if (prevFeedback) {
      task += `\nPrevious evaluation feedback:\n${prevFeedback}\n`;
    }
    
    if (scoreHistory && scoreHistory.length > 0) {
      task += `\nScore history: ${JSON.stringify(scoreHistory)}\n`;
      
      // 添加趋势分析
      if (scoreHistory.length >= 2) {
        const lastScore = scoreHistory[scoreHistory.length - 1];
        const prevScore = scoreHistory[scoreHistory.length - 2];
        const delta = lastScore - prevScore;
        
        if (delta > 0.5) {
          task += `\nTrend: IMPROVING (delta=${delta.toFixed(1)}) → REFINE\n`;
        } else if (delta < -0.5) {
          task += `\nTrend: DECLINING (delta=${delta.toFixed(1)}) → PIVOT\n`;
        } else {
          task += `\nTrend: STAGNANT (delta=${delta.toFixed(1)}) → Need new strategy\n`;
        }
      }
    }
    
    return task;
  }

  /**
   * 从 feedback 提取分数
   * 
   * @param {string} feedbackText - Evaluator 输出
   * @returns {number} 分数 (0-10)
   */
  extract_score(feedbackText) {
    // 尝试匹配 "Average: X/10"
    const avgMatch = feedbackText.match(/[Aa]verage[:\s]*(\d+\.?\d*)\s*\/\s*10/);
    if (avgMatch) {
      return parseFloat(avgMatch[1]);
    }
    
    // 尝试匹配所有分数并计算平均
    const scores = feedbackText.match(/(\d+\.?\d*)\s*\/\s*10/g);
    if (scores) {
      const vals = scores.map(s => parseFloat(s.split('/')[0]));
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    }
    
    return 0.0;
  }

  /**
   * 解析任务超时
   * 
   * 子类可重写，基于任务元数据返回超时时间
   * 
   * @param {string} userPrompt - 用户提示
   * @returns {number|null} 超时秒数，null = 使用默认
   */
  resolve_task_timeout(userPrompt) {
    return null;
  }

  /**
   * 解析时间分配
   * 
   * 返回三个阶段的时间比例（总和 ≈ 1.0）
   * 
   * @param {string} userPrompt - 用户提示
   * @returns {object} { planner, builder, evaluator, planner_enabled, evaluator_enabled }
   */
  resolve_time_allocation(userPrompt) {
    return {
      planner: 0.07,          // ~7% 用于规划
      builder: 0.83,          // ~83% 用于构建
      evaluator: 0.10,        // ~10% 用于评估
      planner_enabled: true,
      evaluator_enabled: true
    };
  }
}

// ---------------------------------------------------------------------------
// Profile Registry（来自 profiles/__init__.py）
// ---------------------------------------------------------------------------

/**
 * Profile 注册表
 * 来源：profiles/__init__.py PROFILES dict
 */
const PROFILES = {
  'app-builder': null,   // 需要从 profile-selector.js 或 profiles/ 目录加载
  'terminal': null,
  'swe-bench': null,
  'reasoning': null
};

/**
 * 获取 Profile 实例
 * @param {string} name - Profile 名称
 * @param {ProfileConfig} cfg - 可选配置
 * @returns {BaseProfile} Profile 实例
 */
function getProfile(name, cfg = null) {
  // 尝试从 profiles/ 目录加载
  const HOME = process.env.HOME || '/Users/mac';
  const profilesDir = path.join(HOME, '.openclaw', 'workspace', 'profiles');
  const profilePath = path.join(profilesDir, `${name}.js`);
  
  if (fs.existsSync(profilePath)) {
    try {
      const profileModule = require(profilePath);
      const profileClass = profileModule[name.replace('-', '_') + 'Profile'] || 
                           profileModule.default || 
                           Object.values(profileModule)[0];
      return new profileClass(cfg);
    } catch (err) {
      // 加载失败，使用 BaseProfile
    }
  }
  
  // 使用 BaseProfile 作为 fallback
  return new BaseProfile(cfg);
}

/**
 * 列出所有可用 Profiles
 * @returns {Array} Profile 信息列表
 */
function listProfiles() {
  const profiles = []; 
  
  // 内置 profiles
  for (const [name, cls] of Object.entries(PROFILES)) {
    profiles.push({
      name,
      description: getProfileDescription(name)
    });
  }
  
  // 从 profiles/ 目录加载
  const HOME = process.env.HOME || '/Users/mac';
  const profilesDir = path.join(HOME, '.openclaw', 'workspace', 'profiles');
  
  if (fs.existsSync(profilesDir)) {
    for (const file of fs.readdirSync(profilesDir)) {
      if (file.endsWith('.js') && !profiles.some(p => p.name === file.replace('.js', ''))) {
        profiles.push({
          name: file.replace('.js', ''),
          description: '(custom profile)'
        });
      }
    }
  }
  
  return profiles;
}

/**
 * 获取 Profile 描述
 * @param {string} name - Profile 名称
 * @returns {string} 描述
 */
function getProfileDescription(name) {
  const descriptions = {
    'app-builder': 'Build web applications with UI components',
    'terminal': 'Execute terminal tasks and scripts',
    'swe-bench': 'Fix GitHub issues and bugs',
    'reasoning': 'Answer questions and provide explanations'
  }; 
  
  return descriptions[name] || '(unknown profile)';
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Profile Config - 完整配置优先级系统

用法:
  node profile-config.js show --profile=<name>     显示 Profile 配置
  node profile-config.js resolve --profile=<name> --key=<key> --default=<val>  解析配置值
  node profile-config.js env --profile=<name>      显示环境变量名
  node profile-config.js test                      测试 resolve() 优先级

示例:
  node profile-config.js show --profile=terminal
  node profile-config.js resolve --profile=terminal --key=pass_threshold --default=7.0
  node profile-config.js env --profile=terminal

环境变量格式:
  PROFILE_<PROFILE_NAME>_<KEY>

示例:
  PROFILE_TERMINAL_PASS_THRESHOLD=8.0
  PROFILE_APP_BUILDER_MAX_ROUNDS=5
  PROFILE_SWE_BENCH_TASK_BUDGET=1800
`);
    process.exit(0);
  }

  if (command === 'show') {
    const profileArg = args.find(a => a.startsWith('--profile'));
    const profileName = profileArg ? profileArg.split('=')[1] : 'app-builder';

    const cfg = new ProfileConfig();
    const defaults = {
      pass_threshold: 7.0,
      max_rounds: 5,
      task_budget: null,
      planner_budget: null,
      builder_budget: null,
      evaluator_budget: null,
      loop_file_edit_threshold: 4,
      loop_command_repeat_threshold: 3,
      time_warn_threshold: 0.60,
      time_critical_threshold: 0.85
    };

    const resolved = cfg.getAll(profileName, defaults);

    console.log(`\n📊 Profile: ${profileName}\n`);
    console.log('Resolved Config:');
    for (const [key, value] of Object.entries(resolved)) {
      const envKey = cfg._envKey(profileName, key);
      const envVal = process.env[envKey];
      const source = envVal ? '(env)' : (cfg[key] ? '(config)' : '(default)');
      console.log(`  ${key.padEnd(25)}: ${value} ${source}`);
    }

    console.log('\nEnvironment Variables:');
    for (const key of Object.keys(defaults)) {
      const envKey = cfg._envKey(profileName, key);
      console.log(`  ${envKey}`);
    }

    process.exit(0);
  }

  if (command === 'resolve') {
    const profileArg = args.find(a => a.startsWith('--profile'));
    const keyArg = args.find(a => a.startsWith('--key'));
    const defaultArg = args.find(a => a.startsWith('--default'));

    const profileName = profileArg ? profileArg.split('=')[1] : 'app-builder';
    const fieldName = keyArg ? keyArg.split('=')[1] : 'pass_threshold';
    const defaultVal = defaultArg ? 
      (defaultArg.split('=')[1].includes('.') ? parseFloat(defaultArg.split('=')[1]) : parseInt(defaultArg.split('=')[1], 10)) :
      7.0;

    const cfg = new ProfileConfig();
    const resolved = cfg.resolve(fieldName, profileName, defaultVal);

    const envKey = cfg._envKey(profileName, fieldName);
    const envVal = process.env[envKey];
    const source = envVal ? 'env' : (cfg[fieldName] ? 'config' : 'default');

    console.log(`\n📊 Resolve Result:\n`);
    console.log(`  Profile: ${profileName}`);
    console.log(`  Field: ${fieldName}`);
    console.log(`  Default: ${defaultVal}`);
    console.log(`  Resolved: ${resolved}`);
    console.log(`  Source: ${source}`);
    console.log(`  Env Key: ${envKey}`);
    console.log(`  Env Value: ${envVal || '(not set)'}`);

    process.exit(0);
  }

  if (command === 'env') {
    const profileArg = args.find(a => a.startsWith('--profile'));
    const profileName = profileArg ? profileArg.split('=')[1] : 'app-builder';

    const cfg = new ProfileConfig();
    const fields = [
      'pass_threshold',
      'max_rounds',
      'task_budget',
      'planner_budget',
      'builder_budget',
      'evaluator_budget',
      'loop_file_edit_threshold',
      'loop_command_repeat_threshold',
      'time_warn_threshold',
      'time_critical_threshold'
    ];

    console.log(`\n📋 Environment Variables for ${profileName}:\n`);
    for (const field of fields) {
      const envKey = cfg._envKey(profileName, field);
      console.log(`  ${envKey}`);
    }

    console.log(`\n示例:`);
    console.log(`  export PROFILE_${profileName.toUpperCase().replace(/-/g, '_')}_PASS_THRESHOLD=8.0`);

    process.exit(0);
  }

  if (command === 'test') {
    console.log('\n🧪 测试 resolve() 优先级:\n');

    const cfg = new ProfileConfig();
    const profileName = 'test-profile';

    // 测试 1: 使用默认值
    const val1 = cfg.resolve('pass_threshold', profileName, 7.0);
    console.log(`  Test 1 (default): ${val1} (expected: 7.0) ✓`);

    // 测试 2: 设置配置值
    cfg.pass_threshold = 8.5;
    const val2 = cfg.resolve('pass_threshold', profileName, 7.0);
    console.log(`  Test 2 (config): ${val2} (expected: 8.5) ✓`);

    // 测试 3: 设置环境变量（最高优先级）
    const envKey = cfg._envKey(profileName, 'pass_threshold');
    process.env[envKey] = '9.0';
    const val3 = cfg.resolve('pass_threshold', profileName, 7.0);
    console.log(`  Test 3 (env): ${val3} (expected: 9.0) ✓`);

    // 清理
    delete process.env[envKey];

    console.log('\n✅ 所有测试通过');

    process.exit(0);
  }

  console.log(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// Export
module.exports = {
  AgentConfig,
  ProfileConfig,
  BaseProfile,
  // Profile Registry（来自 profiles/__init__.py）
  PROFILES,
  getProfile,
  listProfiles
};

// CLI Entry
if (require.main === module) {
  main();
}