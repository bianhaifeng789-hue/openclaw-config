#!/usr/bin/env node
/**
 * Health Monitor - 系统级健康监控
 * 
 * 监控 OpenClaw Gateway 和 Node 的健康状态：
 *   - Gateway 进程检查（pid、状态、端口）
 *   - RPC 连接测试（WebSocket probe）
 *   - 进程资源监控（CPU、内存）
 *   - 自动恢复机制（重启服务）
 *   - 健康日志记录
 * 
 * Thresholds:
 *   - cpuPercent: 80%
 *   - memoryPercent: 85%
 *   - consecutiveErrors: 3
 *   - recoveryCooldown: 60s
 * 
 * Usage:
 *   node health-monitor.js check
 *   node health-monitor.js status
 *   node health-monitor.js recover [gateway|node]
 *   node health-monitor.js history [lines]
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const HEALTH_DIR = path.join(WORKSPACE, 'state', 'health');
const STATUS_FILE = path.join(HEALTH_DIR, 'status.json');
const LOG_FILE = path.join(HEALTH_DIR, 'health-log.jsonl');
const RECOVERY_FILE = path.join(HEALTH_DIR, 'recovery-state.json');

// Thresholds
const THRESHOLDS = {
  cpuPercent: 80,
  memoryPercent: 85,
  consecutiveErrors: 3,
  recoveryCooldownMs: 60000, // 60s cooldown between recoveries
  maxRecoveryAttempts: 5,
  processAgeMaxHours: 24
};

function getTimestamp() {
  return {
    timestamp: Date.now(),
    isoTime: new Date().toISOString()
  };
}

function logHealthEvent(event) {
  const entry = { ...getTimestamp(), ...event };
  fs.mkdirSync(HEALTH_DIR, { recursive: true });
  fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n');
  return entry;
}

function checkGatewayProcess() {
  try {
    // 使用 openclaw gateway status 获取状态
    const statusOutput = execSync('openclaw gateway status', { encoding: 'utf8', timeout: 5000 });
    
    // 解析关键信息
    const pidMatch = statusOutput.match(/pid (\d+)/);
    const stateMatch = statusOutput.match(/state (\w+)/);
    const portMatch = statusOutput.match(/port (\d+)/);
    const rpcMatch = statusOutput.match(/RPC probe: (\w+)/);
    
    const pid = pidMatch ? parseInt(pidMatch[1], 10) : null;
    const state = stateMatch ? stateMatch[1] : 'unknown';
    const port = portMatch ? parseInt(portMatch[1], 10) : null;
    const rpcOk = rpcMatch ? rpcMatch[1] === 'ok' : false;
    
    // 检查进程资源
    let cpu = 0, memory = 0;
    if (pid) {
      try {
        const psOutput = execSync(`ps -p ${pid} -o %cpu,%mem`, { encoding: 'utf8' });
        const lines = psOutput.trim().split('\n');
        if (lines.length > 1) {
          const values = lines[1].trim().split(/\s+/);
          cpu = parseFloat(values[0]) || 0;
          memory = parseFloat(values[1]) || 0;
        }
      } catch {
        // Process may not exist
      }
    }
    
    return {
      ok: state === 'active' && rpcOk,
      pid,
      state,
      port,
      rpcOk,
      cpu,
      memory,
      cpuWarning: cpu > THRESHOLDS.cpuPercent,
      memoryWarning: memory > THRESHOLDS.memoryPercent
    };
  } catch (e) {
    return {
      ok: false,
      error: e.message,
      state: 'error'
    };
  }
}

function checkNodeConnections() {
  try {
    const nodeListOutput = execSync('openclaw node list 2>/dev/null || echo "NO_NODES"', { 
      encoding: 'utf8', 
      timeout: 5000 
    });
    
    if (nodeListOutput.includes('NO_NODES')) {
      return { hasNodes: false, nodes: [] };
    }
    
    // 解析节点列表
    const nodes = [];
    const lines = nodeListOutput.trim().split('\n').filter(l => l.includes(':'));
    
    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length >= 2) {
        nodes.push({
          name: parts[0],
          address: parts[1],
          status: parts[2] || 'unknown'
        });
      }
    }
    
    return { hasNodes: nodes.length > 0, nodes };
  } catch {
    return { hasNodes: false, nodes: [], error: 'node list failed' };
  }
}

function getRecoveryState() {
  if (!fs.existsSync(RECOVERY_FILE)) {
    return {
      consecutiveErrors: 0,
      lastRecoveryAt: null,
      totalRecoveries: 0
    };
  }
  try {
    return JSON.parse(fs.readFileSync(RECOVERY_FILE, 'utf8'));
  } catch {
    return {
      consecutiveErrors: 0,
      lastRecoveryAt: null,
      totalRecoveries: 0
    };
  }
}

function saveRecoveryState(state) {
  fs.mkdirSync(HEALTH_DIR, { recursive: true });
  fs.writeFileSync(RECOVERY_FILE, JSON.stringify(state, null, 2));
}

function canRecover(recoveryState) {
  // Check cooldown
  if (recoveryState.lastRecoveryAt) {
    const elapsed = Date.now() - recoveryState.lastRecoveryAt;
    if (elapsed < THRESHOLDS.recoveryCooldownMs) {
      return {
        canRecover: false,
        reason: 'cooldown',
        remainingMs: THRESHOLDS.recoveryCooldownMs - elapsed
      };
    }
  }
  
  // Check max attempts
  if (recoveryState.totalRecoveries >= THRESHOLDS.maxRecoveryAttempts) {
    return {
      canRecover: false,
      reason: 'max_attempts'
    };
  }
  
  return { canRecover: true };
}

function recoverGateway() {
  const recoveryState = getRecoveryState();
  const recoveryCheck = canRecover(recoveryState);
  
  if (!recoveryCheck.canRecover) {
    return {
      success: false,
      reason: recoveryCheck.reason,
      ...recoveryCheck
    };
  }
  
  try {
    // 停止 Gateway
    execSync('openclaw gateway stop', { encoding: 'utf8', timeout: 10000 });
    
    // 等待 2 秒
    setTimeout(() => {}, 2000);
    
    // 启动 Gateway
    execSync('openclaw gateway start', { encoding: 'utf8', timeout: 10000 });
    
    // 更新恢复状态
    const newState = {
      consecutiveErrors: 0,
      lastRecoveryAt: Date.now(),
      totalRecoveries: recoveryState.totalRecoveries + 1
    };
    saveRecoveryState(newState);
    
    // 记录恢复事件
    logHealthEvent({
      process: 'gateway',
      type: 'recovery',
      severity: 'info',
      message: 'Gateway recovered successfully',
      totalRecoveries: newState.totalRecoveries
    });
    
    return {
      success: true,
      ...newState
    };
  } catch (e) {
    logHealthEvent({
      process: 'gateway',
      type: 'recovery-failed',
      severity: 'critical',
      message: `Gateway recovery failed: ${e.message}`,
      error: e.message
    });
    
    return {
      success: false,
      error: e.message
    };
  }
}

function checkHealth() {
  const gateway = checkGatewayProcess();
  const nodes = checkNodeConnections();
  const recoveryState = getRecoveryState();
  
  // 计算整体健康状态
  let overallOk = gateway.ok;
  let issues = 0;
  let criticalIssues = 0;
  let warningIssues = 0;
  
  // Gateway 检查
  if (!gateway.ok) {
    issues++;
    if (gateway.state === 'error' || !gateway.pid) {
      criticalIssues++;
      recoveryState.consecutiveErrors++;
    }
  } else {
    recoveryState.consecutiveErrors = 0;
  }
  
  // CPU/Memory 警告
  if (gateway.cpuWarning) {
    warningIssues++;
    logHealthEvent({
      process: 'gateway',
      type: 'high-cpu',
      severity: 'warning',
      message: `Gateway CPU ${gateway.cpu}% exceeds threshold ${THRESHOLDS.cpuPercent}%`,
      pid: gateway.pid,
      cpu: gateway.cpu
    });
  }
  
  if (gateway.memoryWarning) {
    warningIssues++;
    logHealthEvent({
      process: 'gateway',
      type: 'high-memory',
      severity: 'warning',
      message: `Gateway memory ${gateway.memory}% exceeds threshold ${THRESHOLDS.memoryPercent}%`,
      pid: gateway.pid,
      memory: gateway.memory
    });
  }
  
  // 连续错误检查
  if (recoveryState.consecutiveErrors >= THRESHOLDS.consecutiveErrors) {
    const recoveryCheck = canRecover(recoveryState);
    if (recoveryCheck.canRecover) {
      // 自动恢复
      const recoveryResult = recoverGateway();
      return {
        ...getTimestamp(),
        overallOk: recoveryResult.success,
        checks: 2,
        issues,
        criticalIssues,
        warningIssues,
        gateway,
        nodes,
        recovery: recoveryResult,
        autoRecovered: true,
        thresholds: THRESHOLDS
      };
    }
  }
  
  saveRecoveryState(recoveryState);
  
  const status = {
    ...getTimestamp(),
    overallOk,
    checks: 2,
    issues,
    criticalIssues,
    warningIssues,
    gateway,
    nodes,
    recoveryState: {
      consecutiveErrors: recoveryState.consecutiveErrors,
      totalRecoveries: recoveryState.totalRecoveries
    },
    thresholds: THRESHOLDS
  };
  
  // 保存状态
  fs.mkdirSync(HEALTH_DIR, { recursive: true });
  fs.writeFileSync(STATUS_FILE, JSON.stringify(status, null, 2));
  
  return status;
}

function getHealthHistory(lines = 50) {
  if (!fs.existsSync(LOG_FILE)) {
    return { events: [] };
  }
  
  const content = fs.readFileSync(LOG_FILE, 'utf8');
  const allEvents = content.trim().split('\n').map(line => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(e => e);
  
  return {
    total: allEvents.length,
    events: allEvents.slice(-lines)
  };
}

function getHealthStatus() {
  if (!fs.existsSync(STATUS_FILE)) {
    return { status: 'no_data', message: 'No health check performed yet' };
  }
  
  try {
    const status = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    const ageMs = Date.now() - status.timestamp;
    const ageMinutes = Math.floor(ageMs / 60000);
    
    return {
      ...status,
      statusAgeMinutes: ageMinutes,
      fresh: ageMinutes < 5
    };
  } catch {
    return { status: 'error', message: 'Failed to read status file' };
  }
}

// CLI
const command = process.argv[2] || 'check';

try {
  switch (command) {
    case 'check':
      const result = checkHealth();
      console.log(JSON.stringify(result, null, 2));
      break;
      
    case 'status':
      const status = getHealthStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
      
    case 'recover':
      const target = process.argv[3] || 'gateway';
      if (target === 'gateway') {
        const recovery = recoverGateway();
        console.log(JSON.stringify(recovery, null, 2));
      } else {
        console.log(JSON.stringify({ error: 'Only gateway recovery supported' }, null, 2));
      }
      break;
      
    case 'history':
      const lines = parseInt(process.argv[3], 10) || 50;
      const history = getHealthHistory(lines);
      console.log(JSON.stringify(history, null, 2));
      break;
      
    case 'reset':
      saveRecoveryState({
        consecutiveErrors: 0,
        lastRecoveryAt: null,
        totalRecoveries: 0
      });
      console.log(JSON.stringify({ success: true, message: 'Recovery state reset' }, null, 2));
      break;
      
    default:
      console.log('Unknown command:', command);
      console.log('');
      console.log('Available commands:');
      console.log('  check         - 执行健康检查');
      console.log('  status        - 显示当前状态');
      console.log('  recover       - 手动恢复 Gateway');
      console.log('  history [N]   - 显示最近 N 条日志');
      console.log('  reset         - 重置恢复状态');
      process.exit(1);
  }
} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
}