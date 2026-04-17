#!/usr/bin/env node
/**
 * Prevent Sleep Service - 基于 Claude Code preventSleep.ts
 * 
 * 防止休眠服务：
 *   - 阻止系统休眠
 *   - 保持服务运行
 *   - 管理锁状态
 * 
 * Usage:
 *   node prevent-sleep.js enable
 *   node prevent-sleep.js disable
 *   node prevent-sleep.js status
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'sleep');
const LOCK_FILE = path.join(STATE_DIR, 'prevent-sleep.lock');

function loadSleepState() {
  if (!fs.existsSync(LOCK_FILE)) {
    return { enabled: false, locks: [] };
  }
  
  try {
    return JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
  } catch {
    return { enabled: false, locks: [] };
  }
}

function saveSleepState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(LOCK_FILE, JSON.stringify(state, null, 2));
}

function enablePreventSleep(reason = 'service running') {
  const state = loadSleepState();
  
  const lock = {
    id: `lock_${Date.now()}`,
    reason,
    enabledAt: Date.now(),
    pid: process.pid
  };
  
  state.enabled = true;
  state.locks.push(lock);
  
  saveSleepState(state);
  
  // Try to actually prevent sleep (macOS)
  try {
    if (process.platform === 'darwin') {
      // Use caffeinate on macOS
      execSync('caffeinate -i &', { timeout: 5000 });
    } else if (process.platform === 'linux') {
      // Use systemd-inhibit on Linux
      execSync('systemd-inhibit --what=sleep --who=openclaw --why="Service running" sleep infinity &', { timeout: 5000 });
    }
  } catch (e) {
    // Ignore errors - system may not support
  }
  
  return {
    enabled: true,
    lock,
    platform: process.platform,
    totalLocks: state.locks.length
  };
}

function disablePreventSleep(lockId = null) {
  const state = loadSleepState();
  
  if (lockId) {
    // Remove specific lock
    state.locks = state.locks.filter(l => l.id !== lockId);
  } else {
    // Remove all locks
    state.locks = [];
  }
  
  state.enabled = state.locks.length > 0;
  
  saveSleepState(state);
  
  return {
    disabled: true,
    removedLocks: lockId ? 1 : state.locks.length + 1,
    remainingLocks: state.locks.length,
    enabled: state.enabled
  };
}

function getSleepStatus() {
  const state = loadSleepState();
  
  // Check if caffeinate is running (macOS)
  let systemPrevented = false;
  try {
    if (process.platform === 'darwin') {
      const result = execSync('pgrep caffeinate', { encoding: 'utf8' });
      systemPrevented = result.trim().length > 0;
    }
  } catch {
    systemPrevented = false;
  }
  
  return {
    enabled: state.enabled,
    locks: state.locks,
    lockCount: state.locks.length,
    systemPrevented,
    platform: process.platform,
    oldestLock: state.locks.length > 0 ? state.locks[0] : null
  };
}

function clearAllLocks() {
  const state = { enabled: false, locks: [] };
  saveSleepState(state);
  
  return {
    cleared: true,
    timestamp: Date.now()
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'enable':
      const reason = args[1] || 'service running';
      console.log(JSON.stringify(enablePreventSleep(reason), null, 2));
      break;
    case 'disable':
      const lockId = args[1];
      console.log(JSON.stringify(disablePreventSleep(lockId), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getSleepStatus(), null, 2));
      break;
    case 'clear':
      console.log(JSON.stringify(clearAllLocks(), null, 2));
      break;
    default:
      console.log('Usage: node prevent-sleep.js [enable|disable|status|clear]');
      process.exit(1);
  }
}

main();

module.exports = {
  enablePreventSleep,
  disablePreventSleep,
  getSleepStatus,
  clearAllLocks
};