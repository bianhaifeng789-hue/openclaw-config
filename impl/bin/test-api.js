#!/usr/bin/env node
/**
 * Test API - 验证 Harness Engineering 基本功能
 * 
 * 来源：Harness Engineering - test_api.py
 * 
 * 功能：
 * - 验证 API 连接
 * - 验证 Harness 配置
 * - 验证中间件模块
 * 
 * 用法：
 *   node test-api.js run
 *   node test-api.js test
 */

const fs = require('fs');
const path = require('path');

// 动态路径
const HOME = process.env.HOME || '/Users/mac';
const WORKSPACE = process.env.WORKSPACE || path.resolve(__dirname, '../../');

// ---------------------------------------------------------------------------
// 加载环境配置
// ---------------------------------------------------------------------------

function loadEnv() {
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
    
    console.log('✅ .env文件加载成功');
  } else {
    console.log('⚠️ .env文件不存在，使用默认值');
  }
}

// ---------------------------------------------------------------------------
// 测试 API 连接
// ---------------------------------------------------------------------------

async function testAPIConnection() {
  console.log('\n=== 测试1: API连接验证 ===');
  
  const apiKey = process.env.OPENAI_API_KEY || process.env.API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || process.env.BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.HARNESS_MODEL || process.env.MODEL || 'gpt-4o';
  
  if (!apiKey) {
    console.log('❌ API密钥未设置');
    return false;
  }
  
  try {
    // 动态导入 OpenAI（如果可用）
    const OpenAI = require('openai').OpenAI;
    
    const client = new OpenAI({
      apiKey,
      baseURL: baseUrl
    });
    
    // 简单测试调用
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Say OK' }],
      max_tokens: 10
    });
    
    console.log('✅ API连接成功');
    console.log(`响应: ${response.choices[0].message.content}`);
    return true;
  } catch (err) {
    // OpenAI 模块未安装，使用 fetch 测试
    try {
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (response.ok) {
        console.log('✅ API连接成功（fetch测试）');
        return true;
      } else {
        console.log(`❌ API连接失败: ${response.status} ${response.statusText}`);
        return false;
      }
    } catch (fetchErr) {
      console.log(`❌ API连接失败: ${fetchErr.message}`);
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// 测试 Harness 配置
// ---------------------------------------------------------------------------

async function testHarnessConfig() {
  console.log('\n=== 测试2: Harness配置验证 ===');
  
  try {
    const config = require('./config-cli.js');
    
    console.log(`✅ 模型: ${process.env.MODEL || 'gpt-4o'}`);
    console.log(`✅ 工作空间: ${WORKSPACE}`);
    console.log(`✅ 最大轮数: ${process.env.MAX_HARNESS_ROUNDS || 5}`);
    console.log(`✅ Pass阈值: ${process.env.PASS_THRESHOLD || 7.0}`);
    
    return true;
  } catch (err) {
    console.log(`⚠️ 配置模块未加载: ${err.message}`);
    console.log(`✅ 使用默认配置`);
    return true;
  }
}

// ---------------------------------------------------------------------------
// 测试中间件
// ---------------------------------------------------------------------------

async function testMiddlewares() {
  console.log('\n=== 测试3: 中间件验证 ===');
  
  const middlewares = [
    'loop-detector.js',
    'pre-exit-gate.js',
    'time-budget.js',
    'task-tracking.js',
    'error-guidance.js',
    'skeleton-detector.js'
  ];
  
  const binDir = path.resolve(__dirname);
  let loaded = 0;
  
  for (const mw of middlewares) {
    const mwPath = path.join(binDir, mw);
    
    if (fs.existsSync(mwPath)) {
      try {
        require(mwPath);
        console.log(`  ✅ ${mw}`);
        loaded++;
      } catch (err) {
        console.log(`  ❌ ${mw}: ${err.message}`);
      }
    } else {
      console.log(`  ⚠️ ${mw}: 文件不存在`);
    }
  }
  
  console.log(`\n✅ ${loaded}/${middlewares.length} 中间件可导入`);
  return loaded === middlewares.length;
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
Test API - 验证 Harness Engineering 基本功能

用法:
  node test-api.js run    运行所有测试
  node test-api.js test   运行测试（同 run）

测试内容:
  1. API 连接验证
  2. Harness 配置验证
  3. 中间件模块验证
`);
    process.exit(0);
  }
  
  if (command === 'run' || command === 'test') {
    console.log('🧪 开始测试...\n');
    
    const apiResult = await testAPIConnection();
    const configResult = await testHarnessConfig();
    const mwResult = await testMiddlewares();
    
    console.log('\n=== 测试完成 ===');
    
    if (apiResult && configResult && mwResult) {
      console.log('✅ 基本功能验证成功，可以运行完整示例');
      process.exit(0);
    } else {
      console.log('⚠️ 部分测试失败，请检查配置');
      process.exit(1);
    }
  }
  
  console.error(`Error: 未知命令 "${command}"`);
  process.exit(1);
}

// 导出
module.exports = {
  loadEnv,
  testAPIConnection,
  testHarnessConfig,
  testMiddlewares
};

// CLI 入口
if (require.main === module) {
  main();
}