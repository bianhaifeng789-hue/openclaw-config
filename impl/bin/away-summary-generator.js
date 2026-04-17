#!/usr/bin/env node
/**
 * Away Summary Generator - 基于 Claude Code useAwaySummary.ts
 * 
 * 离线摘要生成：
 *   - 终端失焦 5 分钟后触发
 *   - 生成 "while you were away" 摘要
 *   - 只在没有进行中的 turn 时生成
 *   - 只在上次用户消息后没有 away_summary 时生成
 * 
 * Usage:
 *   node away-summary-generator.js check-focus
 *   node away-summary-generator.js should-generate <messagesJson>
 *   node away-summary-generator.js generate <messagesJson>
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'away-summary');

const BLUR_DELAY_MS = 5 * 60_000; // 5 minutes

function getTerminalFocusState() {
  // Simulated focus state (would need real terminal integration)
  const stateFile = path.join(STATE_DIR, 'focus-state.json');
  
  if (fs.existsSync(stateFile)) {
    try {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8')).state || 'unknown';
    } catch {
      return 'unknown';
    }
  }
  
  return 'unknown';
}

function setTerminalFocusState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STATE_DIR, 'focus-state.json'),
    JSON.stringify({
      state,
      updatedAt: Date.now()
    }, null, 2)
  );
}

function recordBlurTime() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(STATE_DIR, 'blur-time.json'),
    JSON.stringify({
      blurTime: Date.now()
    }, null, 2)
  );
}

function getBlurTime() {
  const blurFile = path.join(STATE_DIR, 'blur-time.json');
  if (fs.existsSync(blurFile)) {
    try {
      return JSON.parse(fs.readFileSync(blurFile, 'utf8')).blurTime;
    } catch {
      return null;
    }
  }
  return null;
}

function hasSummarySinceLastUserTurn(messages) {
  // Check if there's already an away_summary since last user turn
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.type === 'user' && !m.isMeta && !m.isCompactSummary) {
      return false;
    }
    if (m.type === 'system' && m.subtype === 'away_summary') {
      return true;
    }
  }
  return false;
}

function shouldGenerateAwaySummary(messages, isLoading) {
  const focusState = getTerminalFocusState();
  const blurTime = getBlurTime();
  
  if (focusState !== 'blurred') {
    return {
      shouldGenerate: false,
      reason: 'not blurred',
      focusState
    };
  }
  
  if (isLoading) {
    return {
      shouldGenerate: false,
      reason: 'turn in progress',
      isLoading
    };
  }
  
  if (!blurTime) {
    return {
      shouldGenerate: false,
      reason: 'no blur time recorded'
    };
  }
  
  const timeSinceBlur = Date.now() - blurTime;
  const minutesSinceBlur = timeSinceBlur / 60000;
  
  if (timeSinceBlur < BLUR_DELAY_MS) {
    return {
      shouldGenerate: false,
      reason: 'blur time too short',
      minutesSinceBlur: minutesSinceBlur.toFixed(2),
      threshold: 5
    };
  }
  
  if (hasSummarySinceLastUserTurn(messages)) {
    return {
      shouldGenerate: false,
      reason: 'summary already exists since last user turn'
    };
  }
  
  return {
    shouldGenerate: true,
    minutesSinceBlur: minutesSinceBlur.toFixed(2),
    messagesSinceBlur: messages.length,
    reason: 'blur threshold met, no summary exists'
  };
}

function generateAwaySummary(messages) {
  // Placeholder: would use forked agent or LLM to generate summary
  // For now, generate simple summary
  
  const recentActivity = [];
  const cutoffTime = getBlurTime() || Date.now() - BLUR_DELAY_MS;
  
  for (const msg of messages) {
    if (msg.timestamp && msg.timestamp > cutoffTime) {
      if (msg.type === 'assistant' && msg.content) {
        const text = typeof msg.content === 'string' 
          ? msg.content 
          : msg.content.filter(b => b.text).map(b => b.text).join(' ');
        if (text) {
          recentActivity.push({
            type: 'assistant',
            text: text.slice(0, 100),
            timestamp: msg.timestamp
          });
        }
      }
    }
  }
  
  const summary = recentActivity.length > 0
    ? `While you were away (${recentActivity.length} recent activities):\n${recentActivity.map(a => `- ${a.text.slice(0, 50)}...`).join('\n')}`
    : 'No significant activity while you were away.';
  
  return {
    summary,
    activitiesFound: recentActivity.length,
    generatedAt: Date.now()
  };
}

function createAwaySummaryMessage(text) {
  return {
    type: 'system',
    subtype: 'away_summary',
    content: text,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check-focus';
  
  switch (command) {
    case 'check-focus':
      console.log(JSON.stringify({
        focusState: getTerminalFocusState(),
        blurTime: getBlurTime(),
        minutesSinceBlur: getBlurTime() 
          ? ((Date.now() - getBlurTime()) / 60000).toFixed(2)
          : null
      }, null, 2));
      break;
    case 'set-focus':
      const state = args[1] || 'focused';
      setTerminalFocusState(state);
      if (state === 'blurred') {
        recordBlurTime();
      }
      console.log(JSON.stringify({ state, recorded: true }, null, 2));
      break;
    case 'should-generate':
      // Would need actual messages JSON
      const isLoading = args[1] === 'true';
      const messages = []; // Placeholder
      console.log(JSON.stringify(shouldGenerateAwaySummary(messages, isLoading), null, 2));
      break;
    case 'generate':
      // Would need actual messages JSON
      const result = generateAwaySummary([]);
      console.log(JSON.stringify(result, null, 2));
      break;
    default:
      console.log('Usage: node away-summary-generator.js [check-focus|set-focus|should-generate|generate]');
      process.exit(1);
  }
}

main();

module.exports = {
  getTerminalFocusState,
  setTerminalFocusState,
  shouldGenerateAwaySummary,
  generateAwaySummary,
  createAwaySummaryMessage
};