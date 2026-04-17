#!/usr/bin/env node
/**
 * Config CLI - 配置系统（直接翻译自 config.py）
 *
 * 使用 OpenAI 兼容 API，适配任何提供商
 *
 * Setup:
 *   cp .env.template .env   # then fill in your real values
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 动态路径
const HOME = process.env.HOME || os.homedir() || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');

/**
 * 加载 .env 文件
 */
function loadDotenv() {
  const envPath = path.join(WORKSPACE, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    if (!trimmed.includes('=')) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    
    // .env takes priority over shell env vars
    if (key.trim()) {
      process.env[key.trim()] = value;
    }
  }
}

// Load .env at startup
loadDotenv();

// ---------------------------------------------------------------------------
// API Configuration
// ---------------------------------------------------------------------------

const API_KEY = process.env.OPENAI_API_KEY || '';
const BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const MODEL = process.env.HARNESS_MODEL || 'gpt-4o';

// ---------------------------------------------------------------------------
// Token Budgets
// ---------------------------------------------------------------------------

const COMPRESS_THRESHOLD = parseInt(process.env.COMPRESS_THRESHOLD || '80000');
const RESET_THRESHOLD = parseInt(process.env.RESET_THRESHOLD || '150000');

// ---------------------------------------------------------------------------
// Harness Loop
// ---------------------------------------------------------------------------

const MAX_HARNESS_ROUNDS = parseInt(process.env.MAX_HARNESS_ROUNDS || '5');
const PASS_THRESHOLD = parseFloat(process.env.PASS_THRESHOLD || '7.0');

// ---------------------------------------------------------------------------
// Agent Limits
// ---------------------------------------------------------------------------

// NOTE: Do NOT use iteration count as the primary stop condition.
// With ~8-9s per iteration, 80 iterations = ~700s, which silently
// truncates 900s+ tasks. Use a high ceiling here; TimeBudgetMiddleware
// handles the real time-based stop.
const MAX_AGENT_ITERATIONS = parseInt(process.env.MAX_AGENT_ITERATIONS || '500');
const MAX_TOOL_ERRORS = 5;  // consecutive tool errors before abort

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const HARNESS_WORKSPACE = path.resolve(process.env.HARNESS_WORKSPACE || './workspace');
const SPEC_FILE = 'spec.md';
const FEEDBACK_FILE = 'feedback.md';
const CONTRACT_FILE = 'contract.md';
const PROGRESS_FILE = 'progress.md';

// ---------------------------------------------------------------------------
// Export Configuration Object
// ---------------------------------------------------------------------------

const CONFIG = {
  // API
  API_KEY,
  BASE_URL,
  MODEL,

  // Token Budgets
  COMPRESS_THRESHOLD,
  RESET_THRESHOLD,

  // Harness Loop
  MAX_HARNESS_ROUNDS,
  PASS_THRESHOLD,

  // Agent Limits
  MAX_AGENT_ITERATIONS,
  MAX_TOOL_ERRORS,

  // Paths
  WORKSPACE: HARNESS_WORKSPACE,
  SPEC_FILE,
  FEEDBACK_FILE,
  CONTRACT_FILE,
  PROGRESS_FILE,

  // Environment
  HOME,
  NODE_VERSION: process.version,
  PLATFORM: process.platform,

  // Computed
  getWorkspacePath: (subpath) => path.join(HARNESS_WORKSPACE, subpath),
  getStatePath: (filename) => path.join(HARNESS_WORKSPACE, 'state', filename),
  getMemoryPath: (filename) => path.join(HARNESS_WORKSPACE, 'memory', filename),

  // Validation
  validate: () => {
    const errors = [];

    if (!API_KEY) {
      errors.push('OPENAI_API_KEY is not set');
    }

    if (COMPRESS_THRESHOLD > RESET_THRESHOLD) {
      errors.push('COMPRESS_THRESHOLD must be less than RESET_THRESHOLD');
    }

    if (PASS_THRESHOLD > 10 || PASS_THRESHOLD < 0) {
      errors.push('PASS_THRESHOLD must be between 0 and 10');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Summary
  summary: () => {
    return {
      api: {
        key: API_KEY ? `${API_KEY.slice(0, 10)}...` : 'NOT SET',
        baseUrl: BASE_URL,
        model: MODEL
      },
      thresholds: {
        compress: COMPRESS_THRESHOLD,
        reset: RESET_THRESHOLD,
        pass: PASS_THRESHOLD
      },
      limits: {
        maxRounds: MAX_HARNESS_ROUNDS,
        maxIterations: MAX_AGENT_ITERATIONS,
        maxToolErrors: MAX_TOOL_ERRORS
      },
      paths: {
        workspace: HARNESS_WORKSPACE,
        spec: SPEC_FILE,
        feedback: FEEDBACK_FILE,
        contract: CONTRACT_FILE
      }
    };
  }
};

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log(`
Config CLI - 配置系统

用法:
  node config-cli.js show           显示当前配置
  node config-cli.js validate       验证配置
  node config-cli.js env            生成 .env.template
  node config-cli.js set <key> <value>  设置配置（临时）

环境变量:
  OPENAI_API_KEY        API密钥（必需）
  OPENAI_BASE_URL       API端点（默认: https://api.openai.com/v1）
  HARNESS_MODEL         模型名称（默认: gpt-4o）
  COMPRESS_THRESHOLD    压缩阈值（默认: 80000）
  RESET_THRESHOLD       重置阈值（默认: 150000）
  MAX_HARNESS_ROUNDS    最大轮数（默认: 5）
  PASS_THRESHOLD        通过阈值（默认: 7.0）
  MAX_AGENT_ITERATIONS  Agent最大迭代（默认: 500）
  HARNESS_WORKSPACE     工作目录（默认: ./workspace）
`);
    process.exit(0);
  }

  if (command === 'show') {
    const summary = CONFIG.summary();
    
    console.log('\n📊 当前配置:\n');
    console.log('API:');
    console.log(`  Key: ${summary.api.key}`);
    console.log(`  Base URL: ${summary.api.baseUrl}`);
    console.log(`  Model: ${summary.api.model}`);
    console.log('\nThresholds:');
    console.log(`  Compress: ${summary.thresholds.compress} tokens`);
    console.log(`  Reset: ${summary.thresholds.reset} tokens`);
    console.log(`  Pass: ${summary.thresholds.pass}/10`);
    console.log('\nLimits:');
    console.log(`  Max Rounds: ${summary.limits.maxRounds}`);
    console.log(`  Max Iterations: ${summary.limits.maxIterations}`);
    console.log(`  Max Tool Errors: ${summary.limits.maxToolErrors}`);
    console.log('\nPaths:');
    console.log(`  Workspace: ${summary.paths.workspace}`);
    console.log(`  Spec: ${summary.paths.spec}`);
    console.log(`  Feedback: ${summary.paths.feedback}`);
    console.log(`  Contract: ${summary.paths.contract}`);
    process.exit(0);
  }

  if (command === 'validate') {
    const result = CONFIG.validate();
    
    if (result.valid) {
      console.log('\n✅ 配置有效');
    } else {
      console.log('\n❌ 配置错误:');
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
      process.exit(1);
    }
    process.exit(0);
  }

  if (command === 'env') {
    const template = `# Harness Configuration
# Copy this file to .env and fill in your values

# API Configuration (REQUIRED)
OPENAI_API_KEY=sk-your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
HARNESS_MODEL=gpt-4o

# Alternative Providers
# OpenRouter: OPENAI_BASE_URL=https://openrouter.ai/api/v1
# Ollama (local): OPENAI_BASE_URL=http://localhost:11434/v1

# Token Budgets
COMPRESS_THRESHOLD=80000
RESET_THRESHOLD=150000

# Harness Loop
MAX_HARNESS_ROUNDS=5
PASS_THRESHOLD=7.0

# Agent Limits
MAX_AGENT_ITERATIONS=500

# Workspace
HARNESS_WORKSPACE=./workspace
`;

    const envPath = path.join(WORKSPACE, '.env.template');
    fs.writeFileSync(envPath, template, 'utf8');
    console.log(`\n✅ .env.template 已生成: ${envPath}`);
    console.log('\n下一步:');
    console.log('  cp .env.template .env');
    console.log('  # 编辑 .env 填入你的 API key');
    process.exit(0);
  }

  if (command === 'set') {
    const key = args[1];
    const value = args[2];

    if (!key || !value) {
      console.log('Error: 需要 key 和 value');
      process.exit(1);
    }

    // 临时设置（仅当前进程）
    process.env[key] = value;
    console.log(`\n✅ ${key} = ${value}（临时设置）`);
    console.log('⚠️ 注意: 这只影响当前进程，重启后失效');
    console.log('要永久保存，请编辑 .env 文件');
    process.exit(0);
  }

  console.log(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// Export
module.exports = CONFIG;

// CLI Entry
if (require.main === module) {
  main();
}