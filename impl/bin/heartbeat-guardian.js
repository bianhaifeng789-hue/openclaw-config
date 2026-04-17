#!/usr/bin/env node
/**
 * Heartbeat Guardian - 心跳守护进程
 * 
 * 确保心跳系统一直运行：
 *   - 定期检查 Gateway 健康状态
 *   - 自动恢复 Gateway（如果崩溃）
 *   - 监控心跳任务执行情况
 *   - 持久化守护状态
 * 
 * Usage:
 *   node heartbeat-guardian.js start
 *   node heartbeat-guardian.js stop
 *   node heartbeat-guardian.js status
 *   node heartbeat-guardian.js daemon [interval]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const GUARDIAN_DIR = path.join(WORKSPACE, 'state', 'guardian');
const GUARDIAN_FILE = path.join(GUARDIAN_DIR, 'guardian-state.json');
const LOG_FILE = path.join(GUARDIAN_DIR, 'guardian-log.jsonl');

const DEFAULT_INTERVAL = 60000; // 60 seconds

function getTimestamp() {
  return {
    timestamp: Date.now(),
    isoTime: new Date().toISOString()
  };
}

function logGuardianEvent(event) {
  const entry = { ...getTimestamp(), ...event };
  fs.mkdirSync(GUARDIAN_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  return entry;
}

function getGuardianState() {
  if (!fs.existsSync(GUARDIAN_FILE)) {
    return {
      running: false,
      lastCheck: null,
      totalChecks: 0,
      totalRecoveries: 0,
      pid: null
    };
  }
  try {
    return JSON.parse(fs.readFileSync(GUARDIAN_FILE, 'utf8'));
  } catch {
    return {
      running: false,
      lastCheck: null,
      totalChecks: 0,
      totalRecoveries: 0,
      pid: null
    };
  }
}

function saveGuardianState(state) {
  fs.mkdirSync(GUARDIAN_DIR, { recursive: true });
  fs.writeFileSync(GUARDIAN_FILE, JSON.stringify(state, null, 2));
}

function checkGatewayHealth() {
  try {
    const statusOutput = execSync('openclaw gateway status', { encoding: 'utf8', timeout: 5000 });
    
    const pidMatch = statusOutput.match(/pid (\d+)/);
    const stateMatch = statusOutput.match(/state (\w+)/);
    const rpcMatch = statusOutput.match(/RPC probe: (\w+)/);
    
    const pid = pidMatch ? parseInt(pidMatch[1], 10) : null;
    const state = stateMatch ? stateMatch[1] : 'unknown';
    const rpcOk = rpcMatch ? rpcMatch[1] === 'ok' : false;
    
    return {
      ok: state === 'active' && rpcOk,
      pid,
      state,
      rpcOk
    };
  } catch (e) {
    return {
      ok: false,
      error: e.message,
      state: 'error'
    };
  }
}

function recoverGateway() {
  logGuardianEvent({
    type: 'recovery_start',
    severity: 'warning',
    message: 'Gateway not running, attempting recovery'
  });
  
  try {
    // Stop Gateway (if exists)
    execSync('openclaw gateway stop', { encoding: 'utf8', timeout: 10000 });
    
    // Wait 2 seconds
    const waitUntil = Date.now() + 2000;
    while (Date.now() < waitUntil) {}
    
    // Start Gateway
    execSync('openclaw gateway start', { encoding: 'utf8', timeout: 10000 });
    
    // Verify
    const health = checkGatewayHealth();
    
    if (health.ok) {
      logGuardianEvent({
        type: 'recovery_success',
        severity: 'info',
        message: 'Gateway recovered successfully',
        pid: health.pid
      });
      
      return { success: true, pid: health.pid };
    } else {
      logGuardianEvent({
        type: 'recovery_failed',
        severity: 'critical',
        message: 'Gateway recovery failed',
        error: health.error
      });
      
      return { success: false, error: health.error };
    }
  } catch (e) {
    logGuardianEvent({
      type: 'recovery_failed',
      severity: 'critical',
      message: 'Gateway recovery failed',
      error: e.message
    });
    
    return { success: false, error: e.message };
  }
}

function runGuardianCheck() {
  const state = getGuardianState();
  
  // Check Gateway health
  const health = checkGatewayHealth();
  
  state.lastCheck = Date.now();
  state.totalChecks++;
  
  if (!health.ok) {
    // Gateway not running, attempt recovery
    const recovery = recoverGateway();
    
    if (recovery.success) {
      state.totalRecoveries++;
      state.running = true;
    } else {
      state.running = false;
    }
  } else {
    state.running = true;
  }
  
  saveGuardianState(state);
  
  return {
    ...getTimestamp(),
    gatewayHealth: health,
    guardianState: {
      running: state.running,
      totalChecks: state.totalChecks,
      totalRecoveries: state.totalRecoveries
    }
  };
}

function startDaemon(interval = DEFAULT_INTERVAL) {
  const state = getGuardianState();
  state.pid = process.pid;
  state.startedAt = Date.now();
  state.interval = interval;
  saveGuardianState(state);
  
  logGuardianEvent({
    type: 'daemon_start',
    severity: 'info',
    message: 'Heartbeat Guardian daemon started',
    pid: process.pid,
    interval
  });
  
  // Run initial check
  runGuardianCheck();
  
  // Set up periodic checks
  setInterval(() => {
    try {
      runGuardianCheck();
    } catch (e) {
      logGuardianEvent({
        type: 'check_error',
        severity: 'warning',
        message: 'Guardian check failed',
        error: e.message
      });
    }
  }, interval);
  
  // Keep process alive
  process.stdin.resume();
  
  // Handle termination
  process.on('SIGINT', () => {
    logGuardianEvent({
      type: 'daemon_stop',
      severity: 'info',
      message: 'Heartbeat Guardian daemon stopped (SIGINT)'
    });
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logGuardianEvent({
      type: 'daemon_stop',
      severity: 'info',
      message: 'Heartbeat Guardian daemon stopped (SIGTERM)'
    });
    process.exit(0);
  });
}

function stopDaemon() {
  const state = getGuardianState();
  
  if (state.pid) {
    try {
      process.kill(state.pid, 'SIGTERM');
      
      logGuardianEvent({
        type: 'daemon_stop',
        severity: 'info',
        message: 'Heartbeat Guardian daemon stopped',
        pid: state.pid
      });
      
      state.running = false;
      state.pid = null;
      state.stoppedAt = Date.now();
      saveGuardianState(state);
      
      return { success: true, message: 'Daemon stopped' };
    } catch (e) {
      return { success: false, error: e.message };
    }
  } else {
    return { success: true, message: 'No daemon running' };
  }
}

function getGuardianStatus() {
  const state = getGuardianState();
  
  let daemonRunning = false;
  if (state.pid) {
    try {
      process.kill(state.pid, 0); // Check if process exists
      daemonRunning = true;
    } catch {
      // Process doesn't exist
      state.pid = null;
      saveGuardianState(state);
    }
  }
  
  const health = checkGatewayHealth();
  
  return {
    ...getTimestamp(),
    daemon: {
      running: daemonRunning,
      pid: state.pid,
      startedAt: state.startedAt,
      interval: state.interval,
      uptime: state.startedAt ? Date.now() - state.startedAt : null
    },
    gateway: health,
    stats: {
      totalChecks: state.totalChecks,
      totalRecoveries: state.totalRecoveries,
      lastCheck: state.lastCheck ? new Date(state.lastCheck).toISOString() : 'never'
    }
  };
}

// CLI
const command = process.argv[2] || 'status';

try {
  switch (command) {
    case 'start':
      const interval = parseInt(process.argv[3], 10) * 1000 || DEFAULT_INTERVAL;
      startDaemon(interval);
      break;
      
    case 'stop':
      const stopResult = stopDaemon();
      console.log(JSON.stringify(stopResult, null, 2));
      break;
      
    case 'status':
      const status = getGuardianStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'check':
      const checkResult = runGuardianCheck();
      console.log(JSON.stringify(checkResult, null, 2));
      break;
      
    case 'daemon':
      // Run as daemon (for background execution)
      const daemonInterval = parseInt(process.argv[3], 10) * 1000 || DEFAULT_INTERVAL;
      startDaemon(daemonInterval);
      break;
      
    default:
      console.log('Unknown command:', command);
      console.log('');
      console.log('Available commands:');
      console.log('  start [interval]  - 启动守护进程（默认 60 秒）');
      console.log('  stop              - 停止守护进程');
      console.log('  status            - 显示守护状态');
      console.log('  check             - 执行健康检查');
      console.log('  daemon [interval] - 后台守护模式');
      process.exit(1);
  }
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}