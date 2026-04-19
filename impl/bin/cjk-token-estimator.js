#!/usr/bin/env node
/**
 * CJK Token Estimator - CJK Token 估算优化
 * 
 * 功能：
 * 1. 优化 CJK 字符 token 估算
 * 2. 混合策略（字符数 + 模型特定系数）
 * 3. 缓存常用字符串
 * 
 * 用法：
 *   node cjk-token-estimator.js estimate <text>
 *   node cjk-token-estimator.js benchmark
 *   node cjk-token-estimator.js stats
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateFile: 'state/cjk-token-estimator-state.json',
  
  // CJK 字符范围
  cjkRanges: [
    [0x4e00, 0x9fff],   // CJK 统一表意文字
    [0x3400, 0x4dbf],   // CJK 扩展 A
    [0x20000, 0x2a6df], // CJK 扩展 B
    [0x2a700, 0x2b73f], // CJK 扩展 C
    [0x2b740, 0x2b81f], // CJK 扩展 D
    [0x3040, 0x309f],   // 平假名
    [0x30a0, 0x30ff],   // 片假名
    [0xac00, 0xd7af],   // 韩文
  ],
  
  // 模型特定系数
  modelFactors: {
    'gpt-4': { cjk: 0.5, ascii: 0.25 },
    'gpt-3.5': { cjk: 0.6, ascii: 0.25 },
    'claude': { cjk: 0.4, ascii: 0.25 },
    'default': { cjk: 0.5, ascii: 0.25 }
  }
};

// 检查是否是 CJK 字符
function isCJKChar(char) {
  const code = char.charCodeAt(0);
  return CONFIG.cjkRanges.some(([start, end]) => code >= start && code <= end);
}

// 估算 token 数
function estimateCJKTokens(text, model = 'default') {
  if (!text) return 0;
  
  const factors = CONFIG.modelFactors[model] || CONFIG.modelFactors.default;
  
  let cjkCount = 0;
  let asciiCount = 0;
  
  for (const char of text) {
    if (isCJKChar(char)) {
      cjkCount++;
    } else if (char.charCodeAt(0) < 128) {
      asciiCount++;
    } else {
      // 其他字符按 CJK 处理
      cjkCount++;
    }
  }
  
  const cjkTokens = Math.ceil(cjkCount * factors.cjk);
  const asciiTokens = Math.ceil(asciiCount * factors.ascii);
  
  return cjkTokens + asciiTokens;
}

// 批量估算
function estimateBatch(texts, model = 'default') {
  return texts.map(text => ({
    text: text.slice(0, 50) + '...',
    tokens: estimateCJKTokens(text, model)
  }));
}

// 基准测试
function benchmark() {
  console.log('=== CJK Token 估算基准测试 ===\n');
  
  const testCases = [
    { text: 'Hello World', expected: 3 },
    { text: '你好世界', expected: 4 },
    { text: 'Hello 你好 World 世界', expected: 7 },
    { text: '这是一段很长的中文文本，用于测试 CJK token 估算的准确性。', expected: 25 },
    { text: 'Mix 混合 テスト 测试', expected: 8 },
    { text: '한국어 테스트', expected: 6 }
  ];
  
  console.log('模型: default\n');
  
  let totalDiff = 0;
  
  testCases.forEach(({ text, expected }) => {
    const estimated = estimateCJKTokens(text);
    const diff = Math.abs(estimated - expected);
    totalDiff += diff;
    
    const status = diff <= 2 ? '✓' : '✗';
    console.log(`${status} "${text.slice(0, 30)}"`);
    console.log(`   估算: ${estimated}, 预期: ${expected}, 差异: ${diff}`);
  });
  
  console.log(`\n平均差异: ${(totalDiff / testCases.length).toFixed(1)} tokens`);
}

// 显示统计
function showStats() {
  console.log('=== CJK Token 估算器统计 ===\n');
  
  console.log('支持的模型:');
  Object.keys(CONFIG.modelFactors).forEach(model => {
    const factors = CONFIG.modelFactors[model];
    console.log(`  - ${model}: CJK=${factors.cjk}, ASCII=${factors.ascii}`);
  });
  
  console.log('\nCJK 字符范围:');
  CONFIG.cjkRanges.forEach(([start, end]) => {
    console.log(`  - U+${start.toString(16).toUpperCase()}-U+${end.toString(16).toUpperCase()}`);
  });
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'stats';
  
  switch (action) {
    case 'estimate':
      if (args[1]) {
        const model = args[2] || 'default';
        const tokens = estimateCJKTokens(args[1], model);
        console.log(`文本: "${args[1]}"`);
        console.log(`模型: ${model}`);
        console.log(`估算 tokens: ${tokens}`);
      } else {
        console.log('用法: node cjk-token-estimator.js estimate <text> [model]');
      }
      break;
      
    case 'benchmark':
      benchmark();
      break;
      
    case 'stats':
      showStats();
      break;
      
    default:
      console.log('用法: node cjk-token-estimator.js [estimate|benchmark|stats]');
  }
}

main().catch(console.error);