#!/usr/bin/env node
/**
 * Run Harness Example - 运行 Harness 简单示例
 * 
 * 来源：Harness Engineering - run_simple_example.py
 * 
 * 功能：
 * - 加载环境配置
 * - 运行 Harness 任务
 * - 显示结果
 * 
 * 用法：
 *   node run-example.js task "Create hello.txt"
 *   node run-example.js task "Build a timer" --profile=terminal
 *   node run-example.js test
 */

const path = require('path');
const fs = require('fs');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');

// ---------------------------------------------------------------------------
// 加载环境配置
// ---------------------------------------------------------------------------

function loadEnv() {
  // 检查 .env 文件
  const envPath = path.join(WORKSPACE, '.env');
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^"|"$/g, '');
        process.env[key] = value;
      }
    }
  }
  
  // 设置默认值
  process.env.WORKSPACE = process.env.WORKSPACE || WORKSPACE;
  process.env.API_KEY = process.env.API_KEY || process.env.OPENAI_API_KEY || '';
  process.env.BASE_URL = process.env.BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  process.env.MODEL = process.env.MODEL || process.env.HARNESS_MODEL || 'gpt-4o';
}

// ---------------------------------------------------------------------------
// 运行 Harness 任务
// ---------------------------------------------------------------------------

async function runHarnessTask(task, profileName = 'terminal') {
  console.log('=== 开始运行Harness示例 ===');
  console.log(`任务: ${task}`);
  console.log(`Profile: ${profileName}`);
  console.log();
  
  try {
    // 导入 harness 模块
    const harness = require('./harness.js');
    
    // 运行任务
    const result = await harness.run(task, { profileName });
    
    console.log('\n✅ 任务完成');
    console.log(`结果: ${result}`);
    
    return result;
  } catch (err) {
    console.log('\n❌ 运行失败:', err.message);
    console.log(err.stack);
    
    throw err;
  }
}

// ---------------------------------------------------------------------------
// CLI 入口
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // 加载环境
  loadEnv();
  
  if (!command || command === 'help') {
    console.log(`
Run Harness Example - 运行 Harness 任务

用法:
  node run-example.js task <task_description>
  node run-example.js task <task> --profile=<profile>
  node run-example.js test
  node run-example.js demo

示例:
  node run-example.js task "Create hello.txt"
  node run-example.js task "Build a Pomodoro timer" --profile=terminal
  node run-example.js demo

可用 Profile:
  terminal     - 终端任务
  app-builder  - 应用构建
  swe-bench    - SWE-Bench
  reasoning    - 推理任务
`);
    process.exit(0);
  }
  
  if (command === 'test') {
    console.log('\n🧪 测试 Harness Example:\n');
    
    // 测试环境加载
    loadEnv();
    console.log(`  WORKSPACE: ${process.env.WORKSPACE} ✓`);
    console.log(`  MODEL: ${process.env.MODEL} ✓`);
    console.log(`  API_KEY: ${process.env.API_KEY ? '已设置' : '未设置'} ⚠️`);
    
    console.log('\n✅ Tests passed');
    process.exit(0);
  }
  
  if (command === 'demo') {
    // 运行演示任务
    const task = "Create a file named hello.txt with content 'Hello World'";
    const profileName = 'terminal';
    
    await runHarnessTask(task, profileName);
    process.exit(0);
  }
  
  if (command === 'task') {
    const task = args[1];
    
    if (!task) {
      console.error('用法: node run-example.js task <task_description>');
      process.exit(1);
    }
    
    // 解析 profile 参数
    let profileName = 'terminal';
    for (const arg of args) {
      if (arg.startsWith('--profile=')) {
        profileName = arg.split('=')[1];
      }
    }
    
    await runHarnessTask(task, profileName);
    process.exit(0);
  }
  
  console.error(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// 导出
module.exports = {
  loadEnv,
  runHarnessTask
};

// CLI 入口
if (require.main === module) {
  main();
}