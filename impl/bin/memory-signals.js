#!/usr/bin/env node
/**
 * Memory Signals - 检测correction/reinforcement信号
 * 
 * 借鉴 DeerFlow 的 MemoryMiddleware
 * 功能：
 * - 检测用户纠正信号（"不对"、"你理解错了"）
 * - 检测用户肯定信号（"对就是这样"、"完全正确"）
 */

const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(process.env.HOME, '.openclaw/workspace/state/memory-signals.json');

// Correction信号模式（借鉴DeerFlow）
const CORRECTION_PATTERNS = [
  /\bthat(?:'s| is) (?:wrong|incorrect)\b/i,
  /\byou misunderstood\b/i,
  /\btry again\b/i,
  /\bredo\b/i,
  /不对/,
  /你理解错了/,
  /你理解有误/,
  /重试/,
  /重新来/,
  /换一种/,
  /改用/,
];

// Reinforcement信号模式（借鉴DeerFlow）
const REINFORCEMENT_PATTERNS = [
  /\byes[,.]?\s+(?:exactly|perfect|that(?:'s| is) (?:right|correct|it))\b/i,
  /\bperfect(?:[.!?]|$)/i,
  /\bexactly\s+(?:right|correct)\b/i,
  /\bthat(?:'s| is)\s+(?:exactly\s+)?(?:right|correct|what i (?:wanted|needed|meant))\b/i,
  /\bkeep\s+(?:doing\s+)?that\b/i,
  /\bjust\s+(?:like\s+)?(?:that|this)\b/i,
  /\bthis is (?:great|helpful)\b(?:[.!?]|$)/i,
  /\bthis is what i wanted\b(?:[.!?]|$)/i,
  /对[，,]?\s*就是这样(?:[。！？!?.]|$)/,
  /完全正确(?:[。！？!?.]|$)/,
  /(?:对[，,]?\s*)?就是这个意思(?:[。！？!?.]|$)/,
  /正是我想要的(?:[。！？!?.]|$)/,
  /继续保持(?:[。！？!?.]|$)/,
];

function readState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {
    corrections: [],
    reinforcements: [],
    lastAnalysis: null,
    stats: { correctionCount: 0, reinforcementCount: 0 }
  };
}

function writeState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// 分析消息
function analyzeMessages(messages) {
  const state = readState();
  const now = Date.now();
  
  let newCorrections = 0;
  let newReinforcements = 0;
  
  for (const msg of messages) {
    const text = msg.content || msg;
    
    // 检测correction信号
    for (const pattern of CORRECTION_PATTERNS) {
      if (pattern.test(text)) {
        state.corrections.push({
          text: text.substring(0, 200),
          timestamp: now,
          pattern: pattern.source
        });
        newCorrections++;
        break;
      }
    }
    
    // 检测reinforcement信号
    for (const pattern of REINFORCEMENT_PATTERNS) {
      if (pattern.test(text)) {
        state.reinforcements.push({
          text: text.substring(0, 200),
          timestamp: now,
          pattern: pattern.source
        });
        newReinforcements++;
        break;
      }
    }
  }
  
  // 更新统计
  state.stats.correctionCount += newCorrections;
  state.stats.reinforcementCount += newReinforcements;
  state.lastAnalysis = now;
  
  // 保持最近100条记录
  if (state.corrections.length > 100) {
    state.corrections = state.corrections.slice(-100);
  }
  if (state.reinforcements.length > 100) {
    state.reinforcements = state.reinforcements.slice(-100);
  }
  
  writeState(state);
  
  return {
    newCorrections,
    newReinforcements,
    totalCorrections: state.stats.correctionCount,
    totalReinforcements: state.stats.reinforcementCount,
    hasSignals: newCorrections > 0 || newReinforcements > 0
  };
}

// 获取状态摘要
function status() {
  const state = readState();
  return {
    totalCorrections: state.stats.correctionCount,
    totalReinforcements: state.stats.reinforcementCount,
    recentCorrections: state.corrections.slice(-5),
    recentReinforcements: state.reinforcements.slice(-5),
    lastAnalysis: state.lastAnalysis
  };
}

// 重置
function reset() {
  writeState({
    corrections: [],
    reinforcements: [],
    lastAnalysis: null,
    stats: { correctionCount: 0, reinforcementCount: 0 }
  });
}

// CLI入口
const args = process.argv.slice(2);
const cmd = args[0];

if (cmd === 'analyze') {
  const messagesJson = args[1];
  if (messagesJson) {
    try {
      const messages = JSON.parse(messagesJson);
      const result = analyzeMessages(messages);
      console.log(JSON.stringify(result, null, 2));
    } catch (e) {
      console.log('❌ 请提供有效的JSON格式消息');
    }
  } else {
    console.log('❌ 请提供消息JSON');
  }
} else if (cmd === 'status') {
  console.log(JSON.stringify(status(), null, 2));
} else if (cmd === 'reset') {
  reset();
  console.log('✅ 已重置所有信号记录');
} else if (cmd === 'patterns') {
  console.log('Correction信号:');
  CORRECTION_PATTERNS.forEach(p => console.log('  - ' + p.source));
  console.log('\nReinforcement信号:');
  REINFORCEMENT_PATTERNS.forEach(p => console.log('  - ' + p.source));
} else {
  console.log(`
用法:
  node memory-signals.js analyze <messages_json>  # 分析消息
  node memory-signals.js status                   # 查看状态
  node memory-signals.js reset                   # 重置
  node memory-signals.js patterns               # 显示检测模式
`);
}

module.exports = { analyzeMessages, status };