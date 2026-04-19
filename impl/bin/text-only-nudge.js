#!/usr/bin/env node
/**
 * Text-Only Nudge - 检测模型描述而非执行
 * 
 * 来源：Harness Engineering - agents.py（Agent.run方法）
 * 
 * 功能：
 * - 检测模型在早期迭代（iteration ≤ 3）只写描述而不执行工具
 * - 强制介入让模型开始执行而非计划
 * 
 * 触发条件：
 * - iteration ≤ 3
 * - assistant消息包含action_words（"i will", "let me", "step 1"等）
 * - 没有prior tool calls（未执行任何工具）
 * 
 * 强制介入消息：
 * "[SYSTEM] STOP DESCRIBING. START EXECUTING.
 * You just wrote a plan/description instead of calling tools.
 * Use run_bash to execute commands NOW.
 * Do not explain what you will do — just DO it."
 * 
 * 用法：
 * node text-only-nudge.js check <messages_json> <iteration>
 * node text-only-nudge.js nudge
 * node text-only-nudge.js status
 */

const fs = require('fs');
const path = require('path');

// Action words - 表示模型在描述而非执行
const ACTION_WORDS = [
  'i will',
  'i\'ll',
  'let me',
  'first,',
  'step 1',
  'here\'s my plan',
  'i need to',
  'we need to',
  'the approach',
  'my strategy',
  'my plan is',
  'i\'m going to',
  'i intend to',
  'firstly',
  'to begin',
  'starting with'
];

// 最大迭代阈值
const MAX_ITERATION_THRESHOLD = 3;

// 强制介入消息模板
const NUDGE_MESSAGE = `[SYSTEM] STOP DESCRIBING. START EXECUTING.

You just wrote a plan/description instead of calling tools.
Use run_bash to execute commands NOW.
Do not explain what you will do — just DO it.

The user expects results, not plans. Execute immediately.`;

/**
 * 检测是否需要nudge
 * @param {Array} messages - 消息列表 [{role, content, tool_calls}]
 * @param {number} iteration - 当前迭代次数
 * @returns {Object} {needsNudge: boolean, reason: string}
 */
function check(messages, iteration) {
  // 条件1：迭代次数 ≤ 3
  if (iteration > MAX_ITERATION_THRESHOLD) {
    return {
      needsNudge: false,
      reason: `iteration=${iteration} > threshold=${MAX_ITERATION_THRESHOLD}`
    };
  }
  
  // 条件2：检查最新assistant消息
  const lastAssistant = messages.filter(m => m.role === 'assistant').pop();
  
  if (!lastAssistant || !lastAssistant.content) {
    return {
      needsNudge: false,
      reason: 'no assistant content'
    };
  }
  
  // 条件3：包含action_words
  const contentLower = lastAssistant.content.toLowerCase();
  const hasActionWords = ACTION_WORDS.some(word => contentLower.includes(word));
  
  if (!hasActionWords) {
    return {
      needsNudge: false,
      reason: 'no action words detected'
    };
  }
  
  // 条件4：没有prior tool calls
  const hasPriorTools = messages.some(m => m.role === 'tool');
  
  if (hasPriorTools) {
    return {
      needsNudge: false,
      reason: 'has prior tool calls'
    };
  }
  
  // 所有条件满足，需要nudge
  const matchedWords = ACTION_WORDS.filter(word => contentLower.includes(word));
  
  return {
    needsNudge: true,
    reason: `Model describing instead of executing (iteration=${iteration}, matched=${matchedWords.length} words)`,
    matchedWords,
    iteration,
    nudgeMessage: NUDGE_MESSAGE
  };
}

/**
 * 获取nudge消息
 * @returns {string} nudge消息
 */
function getNudgeMessage() {
  return NUDGE_MESSAGE;
}

/**
 * 统计状态
 * @param {Object} stateFile - 状态文件路径
 * @returns {Object} 统计结果
 */
function getStats(stateFile) {
  const statePath = stateFile || path.join(__dirname, '../state/text-only-nudge-state.json');
  
  if (!fs.existsSync(statePath)) {
    return {
      nudgesSent: 0,
      lastNudge: null,
      version: '1.0.0'
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch (e) {
    return {error: e.message};
  }
}

/**
 * 更新状态
 * @param {Object} stats - 统计数据
 * @param {string} stateFile - 状态文件路径
 */
function updateStats(stats, stateFile) {
  const statePath = stateFile || path.join(__dirname, '../state/text-only-nudge-state.json');
  const stateDir = path.dirname(statePath);
  
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, {recursive: true});
  }
  
  fs.writeFileSync(statePath, JSON.stringify(stats, null, 2), 'utf8');
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'check') {
    // 检查模式
    const messagesJson = args[1];
    const iteration = parseInt(args[2]) || 1;
    
    if (!messagesJson) {
      console.error('用法: node text-only-nudge.js check <messages_json> <iteration>');
      process.exit(1);
    }
    
    try {
      const messages = JSON.parse(messagesJson);
      const result = check(messages, iteration);
      
      console.log(JSON.stringify(result, null, 2));
      
      if (result.needsNudge) {
        console.log('\n⚠️ 需要强制介入');
        console.log('\n强制介入消息:');
        console.log(result.nudgeMessage);
      } else {
        console.log('\n✅ 无需介入');
      }
    } catch (err) {
      console.error('解析失败:', err.message);
      process.exit(1);
    }
  } else if (command === 'nudge') {
    // 获取nudge消息
    console.log(NUDGE_MESSAGE);
  } else if (command === 'status') {
    // 状态查询
    const stats = getStats();
    console.log(JSON.stringify({
      ...stats,
      actionWords: ACTION_WORDS.length,
      threshold: MAX_ITERATION_THRESHOLD
    }, null, 2));
  } else if (command === 'test') {
    // 测试模式
    const testMessages = [
      {role: 'system', content: 'You are an assistant'},
      {role: 'user', content: 'Build a calculator'},
      {role: 'assistant', content: 'I will start by creating the main file. First, I need to plan the structure...'}
    ];
    
    const result = check(testMessages, 1);
    console.log('测试结果:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.needsNudge) {
      console.log('\n✅ 检测成功（需要nudge）');
    } else {
      console.log('\n❌ 检测失败（不应需要nudge）');
    }
  } else {
    console.log(`
Text-Only Nudge - 检测模型描述而非执行

用法:
  node text-only-nudge.js check <messages_json> <iteration>  检查是否需要nudge
  node text-only-nudge.js nudge                              获取nudge消息
  node text-only-nudge.js status                             查看状态
  node text-only-nudge.js test                               运行测试

触发条件:
  1. iteration ≤ 3
  2. assistant消息包含action_words
  3. 没有prior tool calls

Action Words (${ACTION_WORDS.length}个):
  - i will, i'll, let me, first, step 1
  - here's my plan, i need to, we need to
  - the approach, my strategy, my plan is
  - i'm going to, i intend to, firstly

来源: Harness Engineering - agents.py
`);
  }
}

// 导出函数
module.exports = {
  check,
  getNudgeMessage,
  getStats,
  updateStats,
  ACTION_WORDS,
  MAX_ITERATION_THRESHOLD,
  NUDGE_MESSAGE
};

// CLI入口
if (require.main === module) {
  main();
}