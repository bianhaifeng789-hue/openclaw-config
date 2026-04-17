#!/usr/bin/env node
/**
 * Anxiety Detector - 焦虑检测机制
 * 
 * 检测模型"提前收工"信号，触发reset而非compaction
 * 
 * 来源：Harness Engineering - context.py detect_anxiety()
 * 
 * 焦虑信号（9个正则模式）：
 * - "let me wrap up"
 * - "that should be enough"
 * - "running low/out of context"
 * - "to save tokens"
 * - "i've covered the main"
 * - "in summary"
 * - "to summarize"
 * - "i'll conclude"
 * - "moving on"
 * 
 * 触发条件：
 * - matches >= 2 → Reset（checkpoint + fresh start）
 * - matches == 1 → Warning
 * 
 * 用法：
 * node anxiety-detector.js analyze <messages_json>
 * node anxiety-detector.js status
 */

const fs = require('fs');
const path = require('path');

// 焦虑信号正则模式（来自Harness Engineering）
const ANXIETY_PATTERNS = [
  /let me wrap up/i,
  /that should be enough/i,
  /running (low|out) of context/i,
  /to save tokens/i,
  /i've covered the main/i,
  /in summary/i,
  /to summarize/i,
  /i'll conclude/i,
  /moving on/i
];

// Reset阈值（tokens）
const RESET_THRESHOLD = 150000;

// Checkpoint模板
const CHECKPOINT_TEMPLATE = `# Checkpoint - Anxiety Reset

## 焦虑触发原因
- 检测到焦虑信号：{matches}个
- 上下文大小：{tokens} tokens

## Completed Work
{completedWork}

## Current State
{currentState}

## Next Steps
{nextSteps}

## Key Decisions
{keyDecisions}

---
生成时间：{timestamp}
`;

/**
 * 检测焦虑信号
 * @param {Array} messages - 消息列表 [{role, content}]
 * @returns {Object} {anxiety: boolean, matches: number, patterns: Array}
 */
function detectAnxiety(messages) {
  const patternCounts = ANXIETY_PATTERNS.map((pattern, idx) => {
    const count = messages.filter(m => m.role === 'assistant' && pattern.test(m.content)).length;
    return {pattern: pattern.source, count, index: idx};
  });
  
  const totalMatches = patternCounts.reduce((sum, p) => sum + p.count, 0);
  const matchedPatterns = patternCounts.filter(p => p.count > 0);
  
  return {
    anxiety: totalMatches >= 2,
    matches: totalMatches,
    patterns: matchedPatterns,
    threshold: 2
  };
}

/**
 * 生成Checkpoint内容
 * @param {Object} state - 状态信息
 * @returns {string} checkpoint内容
 */
function generateCheckpoint(state) {
  const {
    matches,
    tokens,
    completedWork = '- [待补充]',
    currentState = '焦虑触发reset，需要从checkpoint继续',
    nextSteps = '- 检查已完成工作\n- 继续未完成任务',
    keyDecisions = '- 触发焦虑reset而非compaction'
  } = state;
  
  return CHECKPOINT_TEMPLATE
    .replace('{matches}', matches)
    .replace('{tokens}', tokens || '未知')
    .replace('{completedWork}', completedWork)
    .replace('{currentState}', currentState)
    .replace('{nextSteps}', nextSteps)
    .replace('{keyDecisions}', keyDecisions)
    .replace('{timestamp}', new Date().toISOString());
}

/**
 * 创建Checkpoint文件
 * @param {string} workspace - 工作目录
 * @param {Object} state - 状态信息
 * @returns {string} checkpoint文件路径
 */
function createCheckpoint(workspace, state) {
  const checkpointDir = path.join(workspace, '.checkpoints');
  if (!fs.existsSync(checkpointDir)) {
    fs.mkdirSync(checkpointDir, {recursive: true});
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const checkpointFile = path.join(checkpointDir, `checkpoint-${timestamp}.md`);
  
  const content = generateCheckpoint(state);
  fs.writeFileSync(checkpointFile, content, 'utf8');
  
  return checkpointFile;
}

/**
 * 计算token数量（估算）
 * @param {string} text - 文本
 * @returns {number} token数量
 */
function estimateTokens(text) {
  // 简单估算：CJK字符约1 token，其他约0.25 token
  const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherCount = text.length - cjkCount;
  return Math.ceil(cjkCount + otherCount / 4);
}

/**
 * 分析消息并检测焦虑
 * @param {Array} messages - 消息列表
 * @param {Object} options - 配置选项
 * @returns {Object} 分析结果
 */
function analyze(messages, options = {}) {
  const {workspace, tokens} = options;
  
  // 检测焦虑
  const anxietyResult = detectAnxiety(messages);
  
  // 确定action
  let action = 'continue';
  let checkpointFile = null;
  
  if (anxietyResult.anxiety) {
    action = 'reset';
    
    // 创建checkpoint
    if (workspace) {
      checkpointFile = createCheckpoint(workspace, {
        matches: anxietyResult.matches,
        tokens: tokens || estimateTokens(messages.map(m => m.content).join('\n')),
        patterns: anxietyResult.patterns.map(p => p.pattern)
      });
    }
  } else if (anxietyResult.matches === 1) {
    action = 'warning';
  }
  
  return {
    ...anxietyResult,
    action,
    checkpointFile,
    recommendation: getRecommendation(action, anxietyResult)
  };
}

/**
 * 获取推荐操作
 * @param {string} action - 动作类型
 * @param {Object} result - 检测结果
 * @returns {string} 推荐信息
 */
function getRecommendation(action, result) {
  switch (action) {
    case 'reset':
      return `检测到焦虑信号 (${result.matches}个匹配)，建议Reset:\n1. 创建checkpoint记录当前进度\n2. 清空上下文\n3. 从checkpoint恢复继续`;
    
    case 'warning':
      return `检测到潜在焦虑信号 (${result.matches}个匹配)，注意:\n- Agent可能在考虑提前收工\n- 关注后续消息是否有更多焦虑信号`;
    
    default:
      return '未检测到焦虑信号，继续正常工作';
  }
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'analyze') {
    // 分析模式
    const messagesJson = args[1];
    
    if (!messagesJson) {
      console.error('用法: node anxiety-detector.js analyze <messages_json>');
      process.exit(1);
    }
    
    try {
      const messages = JSON.parse(messagesJson);
      const result = analyze(messages);
      
      console.log(JSON.stringify(result, null, 2));
      
      // 如果是reset，输出checkpoint路径
      if (result.action === 'reset' && result.checkpointFile) {
        console.log(`\n✅ Checkpoint已创建: ${result.checkpointFile}`);
      }
    } catch (err) {
      console.error('解析失败:', err.message);
      process.exit(1);
    }
  } else if (command === 'status') {
    // 状态查询
    console.log(JSON.stringify({
      patterns: ANXIETY_PATTERNS.length,
      threshold: 2,
      resetThreshold: RESET_THRESHOLD,
      version: '1.0.0'
    }, null, 2));
  } else if (command === 'test') {
    // 测试模式
    const testMessages = [
      {role: 'assistant', content: 'Let me wrap up the implementation'},
      {role: 'assistant', content: 'That should be enough for this task'}
    ];
    
    const result = analyze(testMessages);
    console.log('测试结果:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.anxiety) {
      console.log('\n✅ 焦虑检测成功（测试通过）');
    } else {
      console.log('\n❌ 焦虑检测失败（测试未通过）');
    }
  } else {
    console.log(`
焦虑检测器 - Anxiety Detector

用法:
  node anxiety-detector.js analyze <messages_json>  分析消息检测焦虑
  node anxiety-detector.js status                   查看状态
  node anxiety-detector.js test                     运行测试

焦虑信号模式:
  1. "let me wrap up"
  2. "that should be enough"
  3. "running low/out of context"
  4. "to save tokens"
  5. "i've covered the main"
  6. "in summary"
  7. "to summarize"
  8. "i'll conclude"
  9. "moving on"

触发条件:
  matches >= 2 → Reset (checkpoint + fresh start)
  matches == 1 → Warning
`);
  }
}

// 导出函数
module.exports = {
  detectAnxiety,
  analyze,
  generateCheckpoint,
  createCheckpoint,
  estimateTokens,
  ANXIETY_PATTERNS,
  RESET_THRESHOLD
};

// CLI入口
if (require.main === module) {
  main();
}