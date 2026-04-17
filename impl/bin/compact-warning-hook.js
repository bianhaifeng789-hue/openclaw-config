#!/usr/bin/env node
/**
 * Compact Warning Hook - 基于 Claude Code compactWarningHook
 * 
 * 压缩警告触发：
 *   - 预警告机制
 *   - 渐进式提醒
 *   - 用户干预
 * 
 * Usage:
 *   node compact-warning-hook.js check [tokens] [model]
 *   node compact-warning-hook.js warn [level]
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'compact-warning');
const STATE_FILE = path.join(STATE_DIR, 'compact-warning-state.json');

const WARNING_THRESHOLD_BUFFER = 20_000;
const ERROR_THRESHOLD_BUFFER = 20_000;

function loadWarningState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      warnings: [],
      lastWarningAt: null,
      warningLevel: 'none',
      totalWarnings: 0,
      config: {
        warningIntervalMs: 60_000,
        escalationLevels: ['none', 'info', 'warning', 'critical']
      }
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      warnings: [],
      lastWarningAt: null,
      warningLevel: 'none',
      totalWarnings: 0,
      config: {
        warningIntervalMs: 60_000,
        escalationLevels: ['none', 'info', 'warning', 'critical']
      }
    };
  }
}

function saveWarningState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function checkWarningThreshold(currentTokens, threshold) {
  const warningThreshold = threshold - WARNING_THRESHOLD_BUFFER;
  const errorThreshold = threshold - ERROR_THRESHOLD_BUFFER;
  
  let level = 'none';
  let shouldWarn = false;
  
  if (currentTokens >= errorThreshold) {
    level = 'critical';
    shouldWarn = true;
  } else if (currentTokens >= warningThreshold) {
    level = 'warning';
    shouldWarn = true;
  } else if (currentTokens >= threshold - WARNING_THRESHOLD_BUFFER * 2) {
    level = 'info';
    shouldWarn = true;
  }
  
  return {
    currentTokens,
    warningThreshold,
    errorThreshold,
    level,
    shouldWarn,
    margin: threshold - currentTokens
  };
}

function emitWarning(level, tokens, model) {
  const state = loadWarningState();
  
  // Check interval
  const elapsed = state.lastWarningAt ? Date.now() - state.lastWarningAt : Infinity;
  const shouldEmit = elapsed >= state.config.warningIntervalMs || level === 'critical';
  
  if (!shouldEmit && level !== 'critical') {
    return {
      emitted: false,
      reason: 'interval not reached',
      elapsedMs: elapsed,
      intervalMs: state.config.warningIntervalMs
    };
  }
  
  const warning = {
    level,
    tokens,
    model,
    timestamp: Date.now(),
    warningId: `warn_${Date.now()}`,
    message: getWarningMessage(level, tokens)
  };
  
  state.warnings.push(warning);
  state.lastWarningAt = Date.now();
  state.warningLevel = level;
  state.totalWarnings++;
  
  // Keep last 20
  if (state.warnings.length > 20) {
    state.warnings = state.warnings.slice(-20);
  }
  
  saveWarningState(state);
  
  return {
    emitted: true,
    warning,
    totalWarnings: state.totalWarnings,
    action: getWarningAction(level)
  };
}

function getWarningMessage(level, tokens) {
  const messages = {
    info: `Context approaching limit (${tokens} tokens). Consider compacting soon.`,
    warning: `Context near limit (${tokens} tokens). Auto-compact will trigger soon.`,
    critical: `Context CRITICAL (${tokens} tokens). Auto-compact MUST trigger NOW or session will overflow.`
  };
  
  return messages[level] || 'Unknown warning level';
}

function getWarningAction(level) {
  const actions = {
    info: 'suggest manual compact',
    warning: 'prepare for auto-compact',
    critical: 'trigger auto-compact immediately'
  };
  
  return actions[level] || 'none';
}

function getWarningHistory(limit = 10) {
  const state = loadWarningState();
  
  return {
    warnings: state.warnings.slice(-limit),
    total: state.totalWarnings,
    lastWarning: state.warnings.length > 0 ? state.warnings[state.warnings.length - 1] : null,
    currentLevel: state.warningLevel
  };
}

function getWarningStatus() {
  const state = loadWarningState();
  
  return {
    currentLevel: state.warningLevel,
    lastWarningAt: state.lastWarningAt,
    totalWarnings: state.totalWarnings,
    config: state.config
  };
}

function clearWarnings() {
  const state = loadWarningState();
  
  state.warnings = [];
  state.warningLevel = 'none';
  
  saveWarningState(state);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'check':
      const checkTokens = parseInt(args[1], 10) || 0;
      const checkThreshold = parseInt(args[2], 10) || 167000;
      console.log(JSON.stringify(checkWarningThreshold(checkTokens, checkThreshold), null, 2));
      break;
    case 'warn':
      const warnLevel = args[1] || 'warning';
      const warnTokens = parseInt(args[2], 10) || 180000;
      const warnModel = args[3] || 'glm-5';
      console.log(JSON.stringify(emitWarning(warnLevel, warnTokens, warnModel), null, 2));
      break;
    case 'history':
      const histLimit = parseInt(args[1], 10) || 10;
      console.log(JSON.stringify(getWarningHistory(histLimit), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getWarningStatus(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearWarnings(), null, 2));
      break;
    default:
      console.log('Usage: node compact-warning-hook.js [check|warn|history|status|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  checkWarningThreshold,
  emitWarning,
  getWarningHistory,
  getWarningStatus,
  clearWarnings,
  WARNING_THRESHOLD_BUFFER,
  ERROR_THRESHOLD_BUFFER
};