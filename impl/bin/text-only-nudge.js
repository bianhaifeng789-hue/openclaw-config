#!/usr/bin/env node
/**
 * Text-Only Nudge - 检测模型描述而不执行
 *
 * 来源：Harness Engineering - agents.py text_only_nudge 检测
 *
 * 功能：当模型在前几次迭代只描述计划而不执行工具时，注入强制提示
 * 目标：防止弱模型只写计划不执行
 *
 * 检测条件：
 * - iteration <= 3
 * - msg.content 存在
 * - 包含 action_words (i will, let me, first, step 1, etc)
 * - has_no_prior_tools (messages 中没有 tool role)
 *
 * 用法：
 * node text-only-nudge.js detect <iteration> <content> <messages_json>
 * node text-only-nudge.js status
 */

const fs = require('fs');

// Action words（来自 Harness Engineering）
const ACTION_WORDS = [
  'i will', 'i\'ll', 'let me', 'first,', 'step 1',
  'here\'s my plan', 'i need to', 'we need to',
  'the approach', 'my strategy',
  '我将', '让我', '第一步', '我的计划', '我需要'
];

const MAX_ITERATION = 3;
const NUDGE_MESSAGE = `
[SYSTEM] STOP DESCRIBING. START EXECUTING.
You just wrote a plan/description instead of calling tools.
Use run_bash to execute commands NOW.
Do not explain what you will do — just DO it.
`;

/**
 * 检测是否需要 text-only nudge
 * @param {number} iteration - 当前迭代次数
 * @param {string} content - 模型响应内容
 * @param {Array} messages - 消息历史
 * @returns {Object}检测结果
 */
function detectTextOnlyNudge(iteration, content, messages) {
  // 条件1: iteration <= 3
  if (iteration > MAX_ITERATION) {
    return { needsNudge: false, reason: `iteration ${iteration} > ${MAX_ITERATION}` };
  }
  
  // 条件2: content 存在
  if (!content || content.trim().length === 0) {
    return { needsNudge: false, reason: 'no content' };
  }
  
  // 条件3: 包含 action_words
  const contentLower = content.toLowerCase();
  const matchedWords = ACTION_WORDS.filter(w => contentLower.includes(w));
  const isPlanningText = matchedWords.length > 0;
  
  if (!isPlanningText) {
    return { needsNudge: false, reason: 'no action words detected' };
  }
  
  // 条件4: has_no_prior_tools
  const hasPriorTools = messages.some(m => m.role === 'tool');
  
  if (hasPriorTools) {
    return { needsNudge: false, reason: 'has prior tool calls' };
  }
  
  // 所有条件满足，需要 nudge
  return {
    needsNudge: true,
    iteration,
    matchedWords,
    hasPriorTools: false,
    nudgeMessage: NUDGE_MESSAGE,
    reason: 'text-only response detected (model describing instead of executing)'
  };
}

/**
 * CLI 入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'detect') {
    const iteration = parseInt(args[1]);
    const content = args[2];
    const messagesJson = args[3];
    
    if (!iteration || !content) {
      console.error('用法: node text-only-nudge.js detect <iteration> <content> [messages_json]');
      process.exit(1);
    }
    
    let messages = [];
    if (messagesJson) {
      try {
        messages = JSON.parse(messagesJson);
      } catch (err) {
        console.error('解析 messages 失败:', err.message);
        process.exit(1);
      }
    }
    
    const result = detectTextOnlyNudge(iteration, content, messages);
    console.log(JSON.stringify(result, null, 2));
    
  } else if (command === 'status') {
    console.log(JSON.stringify({
      version: '1.0.0',
      actionWords: ACTION_WORDS.length,
      maxIteration: MAX_ITERATION,
      source: 'Harness Engineering - agents.py',
      nudgeMessage: NUDGE_MESSAGE.trim()
    }, null, 2));
    
  } else {
    console.error('用法:');
    console.error('  node text-only-nudge.js detect <iteration> <content> [messages_json]');
    console.error('  node text-only-nudge.js status');
    process.exit(1);
  }
}

// Export for module usage
module.exports = {
  detectTextOnlyNudge,
  ACTION_WORDS,
  MAX_ITERATION,
  NUDGE_MESSAGE
};

// Run CLI if called directly
if (require.main === module) {
  main();
}