#!/usr/bin/env node
/**
 * Rate Limit Messages Handler - 基于 Claude Code rateLimitMessages.ts
 * 
 * Rate limit 消息处理：
 *   - 检测 rate limit 状态
 *   - 生成用户友好的错误消息
 *   - 记录 limit 状态供监控
 * 
 * Usage:
 *   node rate-limit-messages.js check
 *   node rate-limit-messages.js record <errorType> <remaining>
 *   node rate-limit-messages.js get-message <errorType>
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'rate-limit');
const LIMIT_FILE = path.join(STATE_DIR, 'limits.json');

// Rate limit error types
const RATE_LIMIT_TYPES = {
  'prompt_too_long': {
    severity: 'critical',
    message: 'Context too large. Please run /compact to reduce context size.',
    action: 'compact'
  },
  'rate_limit_reached': {
    severity: 'warning',
    message: 'API rate limit reached. Please try again later.',
    action: 'wait'
  },
  'max_requests_exceeded': {
    severity: 'warning',
    message: 'Maximum requests exceeded. Please wait before making more requests.',
    action: 'wait'
  },
  'max_tokens_exceeded': {
    severity: 'warning',
    message: 'Token limit exceeded. Please reduce request size.',
    action: 'reduce'
  },
  'overloaded': {
    severity: 'warning',
    message: 'Service temporarily overloaded. Please retry in a moment.',
    action: 'retry'
  }
};

function getRateLimitState() {
  if (!fs.existsSync(LIMIT_FILE)) {
    return {
      hasLimit: false,
      lastError: null,
      remaining: null
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(LIMIT_FILE, 'utf8'));
  } catch {
    return {
      hasLimit: false,
      lastError: null,
      remaining: null
    };
  }
}

function recordRateLimitError(errorType, remaining, resetTime) {
  const state = {
    hasLimit: true,
    lastError: errorType,
    remaining: remaining || 0,
    resetTime: resetTime || Date.now() + 60000,
    recordedAt: Date.now()
  };
  
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(LIMIT_FILE, JSON.stringify(state, null, 2));
  
  return state;
}

function clearRateLimitError() {
  if (fs.existsSync(LIMIT_FILE)) {
    fs.unlinkSync(LIMIT_FILE);
  }
  
  return {
    hasLimit: false,
    clearedAt: Date.now()
  };
}

function getRateLimitMessage(errorType) {
  const typeInfo = RATE_LIMIT_TYPES[errorType] || {
    severity: 'unknown',
    message: 'Unknown rate limit error occurred.',
    action: 'unknown'
  };
  
  const state = getRateLimitState();
  
  return {
    errorType,
    severity: typeInfo.severity,
    userMessage: typeInfo.message,
    recommendedAction: typeInfo.action,
    currentRemaining: state.remaining,
    resetTime: state.resetTime
  };
}

function checkRateLimitStatus() {
  const state = getRateLimitState();
  
  if (!state.hasLimit) {
    return {
      status: 'ok',
      hasLimit: false,
      message: 'No rate limit active'
    };
  }
  
  const timeSinceError = Date.now() - state.recordedAt;
  const minutesSinceError = timeSinceError / 60000;
  const timeUntilReset = state.resetTime - Date.now();
  
  if (timeUntilReset <= 0) {
    // Reset time passed, clear limit
    clearRateLimitError();
    return {
      status: 'ok',
      hasLimit: false,
      message: 'Rate limit reset'
    };
  }
  
  return {
    status: 'limited',
    hasLimit: true,
    lastError: state.lastError,
    remaining: state.remaining,
    timeUntilResetMs: timeUntilReset,
    secondsUntilReset: Math.ceil(timeUntilReset / 1000),
    message: getRateLimitMessage(state.lastError).userMessage
  };
}

function generateWarningCard() {
  const status = checkRateLimitStatus();
  
  if (status.status !== 'limited') {
    return null;
  }
  
  return {
    type: 'rate_limit_warning',
    severity: RATE_LIMIT_TYPES[status.lastError]?.severity || 'warning',
    title: '⚠️ Rate Limit Warning',
    message: status.message,
    details: {
      errorType: status.lastError,
      remaining: status.remaining,
      secondsUntilReset: status.secondsUntilReset
    },
    actions: [
      { type: 'wait', label: `Wait ${status.secondsUntilReset}s` },
      { type: 'retry', label: 'Retry' }
    ]
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'check';
  
  switch (command) {
    case 'check':
      console.log(JSON.stringify(checkRateLimitStatus(), null, 2));
      break;
    case 'record':
      const errorType = args[1] || 'rate_limit_reached';
      const remaining = parseInt(args[2], 10) || 0;
      const resetTime = parseInt(args[3], 10) || Date.now() + 60000;
      console.log(JSON.stringify(recordRateLimitError(errorType, remaining, resetTime), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearRateLimitError(), null, 2));
      break;
    case 'get-message':
      const getType = args[1] || 'rate_limit_reached';
      console.log(JSON.stringify(getRateLimitMessage(getType), null, 2));
      break;
    case 'card':
      const card = generateWarningCard();
      if (card) {
        console.log(JSON.stringify(card, null, 2));
      } else {
        console.log(JSON.stringify({ message: 'No rate limit active' }, null, 2));
      }
      break;
    default:
      console.log('Usage: node rate-limit-messages.js [check|record|clear|get-message|card]');
      process.exit(1);
  }
}

main();

module.exports = {
  getRateLimitState,
  recordRateLimitError,
  clearRateLimitError,
  getRateLimitMessage,
  checkRateLimitStatus,
  generateWarningCard
};