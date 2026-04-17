#!/usr/bin/env node
/**
 * Double Press Hook - 基于 Claude Code useDoublePress
 * 
 * 双击检测：
 *   - 检测快速连续按压
 *   - 超时管理
 *   - 回调触发
 * 
 * Usage:
 *   node double-press-hook.js press
 *   node double-press-hook.js status
 *   node double-press-hook.js config
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'double-press');
const STATE_FILE = path.join(STATE_DIR, 'double-press-state.json');

const DOUBLE_PRESS_TIMEOUT_MS = 800;

function loadDoublePressState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      lastPressTime: 0,
      pending: false,
      timeoutActive: false,
      pressHistory: [],
      config: {
        timeoutMs: DOUBLE_PRESS_TIMEOUT_MS
      }
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      lastPressTime: 0,
      pending: false,
      timeoutActive: false,
      pressHistory: [],
      config: {
        timeoutMs: DOUBLE_PRESS_TIMEOUT_MS
      }
    };
  }
}

function saveDoublePressState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function recordPress() {
  const state = loadDoublePressState();
  const now = Date.now();
  const timeSinceLastPress = now - state.lastPressTime;
  
  const isDoublePress = timeSinceLastPress <= state.config.timeoutMs && state.pending;
  
  const pressRecord = {
    timestamp: now,
    timeSinceLastPress,
    isDoublePress,
    pressId: `press_${now}`
  };
  
  state.pressHistory.push(pressRecord);
  state.lastPressTime = now;
  
  // Keep only last 20
  if (state.pressHistory.length > 20) {
    state.pressHistory = state.pressHistory.slice(-20);
  }
  
  if (isDoublePress) {
    // Double press detected
    state.pending = false;
    state.timeoutActive = false;
    
    saveDoublePressState(state);
    
    return {
      type: 'doublePress',
      detected: true,
      timeSinceLastPress,
      pressRecord
    };
  } else {
    // First press
    state.pending = true;
    state.timeoutActive = true;
    
    saveDoublePressState(state);
    
    return {
      type: 'singlePress',
      pending: true,
      timeoutMs: state.config.timeoutMs,
      pressRecord
    };
  }
}

function clearPending() {
  const state = loadDoublePressState();
  
  state.pending = false;
  state.timeoutActive = false;
  
  saveDoublePressState(state);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function getDoublePressStatus() {
  const state = loadDoublePressState();
  
  return {
    pending: state.pending,
    lastPressTime: state.lastPressTime,
    timeSinceLastPress: Date.now() - state.lastPressTime,
    timeoutActive: state.timeoutActive,
    config: state.config,
    recentPresses: state.pressHistory.slice(-5)
  };
}

function getDoublePressHistory(limit = 10) {
  const state = loadDoublePressState();
  
  const doublePresses = state.pressHistory.filter(p => p.isDoublePress);
  
  return {
    pressHistory: state.pressHistory.slice(-limit),
    doublePressCount: doublePresses.length,
    singlePressCount: state.pressHistory.length - doublePresses.length,
    total: state.pressHistory.length
  };
}

function setDoublePressConfig(timeoutMs) {
  const state = loadDoublePressState();
  
  state.config.timeoutMs = timeoutMs;
  
  saveDoublePressState(state);
  
  return {
    set: true,
    config: state.config
  };
}

function getDoublePressConfig() {
  const state = loadDoublePressState();
  
  return state.config;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'press':
      console.log(JSON.stringify(recordPress(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearPending(), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getDoublePressStatus(), null, 2));
      break;
    case 'history':
      const histLimit = parseInt(args[1], 10) || 10;
      console.log(JSON.stringify(getDoublePressHistory(histLimit), null, 2));
      break;
    case 'config':
      const configAction = args[1];
      if (configAction === 'set') {
        const timeoutMs = parseInt(args[2], 10) || DOUBLE_PRESS_TIMEOUT_MS;
        console.log(JSON.stringify(setDoublePressConfig(timeoutMs), null, 2));
      } else {
        console.log(JSON.stringify(getDoublePressConfig(), null, 2));
      }
      break;
    default:
      console.log('Usage: node double-press-hook.js [press|clear|status|history|config]');
      process.exit(1);
  }
}

main();

module.exports = {
  recordPress,
  clearPending,
  getDoublePressStatus,
  getDoublePressHistory,
  setDoublePressConfig,
  DOUBLE_PRESS_TIMEOUT_MS
};