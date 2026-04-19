/**
 * Memory 智能提取触发器
 * 基于多维度信号智能触发记忆提取
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  // 时间触发（兜底）
  time: { interval: 12 * 60 * 60 * 1000 },  // 12 小时

  // 关键词触发（重要决策）
  keyword: {
    patterns: [
      '决定', '决策', '选择', '重要', '优化', '优化', '改进', '方案',
      'decide', 'decision', 'choose', 'important', 'optimize', 'improve', 'plan'
    ],
    cooldown: 60 * 60 * 1000  // 1 小时冷却
  },

  // 会话长度触发（长对话）
  length: {
    threshold: 50,  // 50 条消息
    cooldown: 2 * 60 * 60 * 1000  // 2 小时冷却
  },

  // 用户信号触发（纠正/确认）
  signal: {
    corrections: ['不对', '错误', '重试', '错了', '不对', "that's wrong", 'wrong', 'incorrect'],
    reinforcements: ['对', '正确', '正是', '完美', 'yes', 'correct', 'perfect', 'exactly'],
    cooldown: 30 * 60 * 1000  // 30 分钟冷却
  }
};

function detectKeywords(messages) {
  const text = messages.map(m => m.content || '').join(' ').toLowerCase();
  const found = [];

  for (const pattern of CONFIG.keyword.patterns) {
    if (text.includes(pattern.toLowerCase())) {
      found.push(pattern);
    }
  }

  return found;
}

function detectUserSignals(messages) {
  const signals = {
    correction: false,
    reinforcement: false,
    patterns: []
  };

  for (const msg of messages) {
    const content = (msg.content || '').toLowerCase();

    for (const pattern of CONFIG.signal.corrections) {
      if (content.includes(pattern.toLowerCase())) {
        signals.correction = true;
        signals.patterns.push(pattern);
      }
    }

    for (const pattern of CONFIG.signal.reinforcements) {
      if (content.includes(pattern.toLowerCase())) {
        signals.reinforcement = true;
        signals.patterns.push(pattern);
      }
    }
  }

  return signals;
}

function shouldExtractMemories(session) {
  const triggers = [];
  const now = Date.now();

  // 检查时间触发
  const lastExtraction = session.lastExtraction || 0;
  if (now - lastExtraction > CONFIG.time.interval) {
    triggers.push('time');
  }

  // 检查关键词触发
  const messages = session.messages || [];
  const keywords = detectKeywords(messages);
  if (keywords.length > 0) {
    const lastKeywordTrigger = session.lastKeywordTrigger || 0;
    if (now - lastKeywordTrigger > CONFIG.keyword.cooldown) {
      triggers.push('keyword');
    }
  }

  // 检查长度触发
  if (messages.length > CONFIG.length.threshold) {
    const lastLengthTrigger = session.lastLengthTrigger || 0;
    if (now - lastLengthTrigger > CONFIG.length.cooldown) {
      triggers.push('length');
    }
  }

  // 检查用户信号
  const signals = detectUserSignals(messages);
  if (signals.correction || signals.reinforcement) {
    const lastSignalTrigger = session.lastSignalTrigger || 0;
    if (now - lastSignalTrigger > CONFIG.signal.cooldown) {
      triggers.push('signal');
    }
  }

  // 确定优先级
  let priority = 'normal';
  if (triggers.includes('keyword') || triggers.includes('signal')) {
    priority = 'high';
  }

  return {
    shouldExtract: triggers.length > 0,
    triggers,
    priority,
    details: {
      keywords,
      signals,
      messageCount: messages.length
    }
  };
}

function updateSessionTriggers(session, result) {
  const now = Date.now();

  if (result.triggers.includes('time')) {
    session.lastExtraction = now;
  }
  if (result.triggers.includes('keyword')) {
    session.lastKeywordTrigger = now;
  }
  if (result.triggers.includes('length')) {
    session.lastLengthTrigger = now;
  }
  if (result.triggers.includes('signal')) {
    session.lastSignalTrigger = now;
  }
}

// 分析单个会话
function analyzeSession(sessionData) {
  return shouldExtractMemories(sessionData);
}

// 分析多个会话
function analyzeSessions(sessions) {
  const results = [];

  for (const [key, session] of Object.entries(sessions)) {
    const result = analyzeSession(session);
    if (result.shouldExtract) {
      results.push({
        sessionKey: key,
        ...result
      });
    }
  }

  return results;
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'test':
      // 测试用例
      const testSession = {
        messages: [
          { content: '我们需要决定使用哪个方案', role: 'user' },
          { content: '这是一个重要的决策', role: 'assistant' }
        ],
        lastExtraction: Date.now() - 13 * 60 * 60 * 1000  // 13 小时前
      };

      const result = analyzeSession(testSession);
      console.log('Test result:', JSON.stringify(result, null, 2));
      break;

    case 'config':
      console.log('Current config:', JSON.stringify(CONFIG, null, 2));
      break;

    default:
      console.log('Usage: node memory-smart-trigger.js [test|config]');
  }
}

module.exports = {
  shouldExtractMemories,
  analyzeSession,
  analyzeSessions,
  updateSessionTriggers,
  detectKeywords,
  detectUserSignals,
  CONFIG
};
