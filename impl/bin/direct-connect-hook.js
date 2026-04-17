#!/usr/bin/env node
/**
 * Direct Connect Hook - 基于 Claude Code useDirectConnect
 * 
 * 直接连接管理：
 *   - WebSocket 连接
 *   - 连接状态
 *   - 重连机制
 * 
 * Usage:
 *   node direct-connect-hook.js connect <url>
 *   node direct-connect-hook.js disconnect
 *   node direct-connect-hook.js status
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.OPENCLAW_WORKSPACE || path.join(require('os').homedir(), '.openclaw', 'workspace');
const STATE_DIR = path.join(WORKSPACE, 'state', 'direct-connect');
const STATE_FILE = path.join(STATE_DIR, 'direct-connect-state.json');

const DEFAULT_CONFIG = {
  reconnectAttempts: 5,
  reconnectDelayMs: 1000,
  pingIntervalMs: 30000,
  timeoutMs: 10000
};

function loadDirectConnectState() {
  if (!fs.existsSync(STATE_FILE)) {
    return {
      connections: [],
      activeConnection: null,
      stats: {
        totalConnections: 0,
        totalDisconnections: 0,
        avgConnectionDurationMs: 0
      },
      config: DEFAULT_CONFIG
    };
  }
  
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return {
      connections: [],
      activeConnection: null,
      stats: {
        totalConnections: 0,
        totalDisconnections: 0,
        avgConnectionDurationMs: 0
      },
      config: DEFAULT_CONFIG
    };
  }
}

function saveDirectConnectState(state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function connect(url, options = {}) {
  const state = loadDirectConnectState();
  
  const connection = {
    id: `conn_${Date.now()}`,
    url,
    connectedAt: Date.now(),
    status: 'connected',
    reconnectAttempts: 0,
    options,
    simulated: true
  };
  
  state.activeConnection = connection;
  state.connections.push(connection);
  state.stats.totalConnections++;
  
  // Keep only last 20 connections
  if (state.connections.length > 20) {
    state.connections = state.connections.slice(-20);
  }
  
  saveDirectConnectState(state);
  
  return {
    connected: true,
    connection,
    stats: state.stats,
    note: 'In real implementation, would create WebSocket connection'
  };
}

function disconnect(reason = 'manual') {
  const state = loadDirectConnectState();
  
  if (!state.activeConnection) {
    return {
      disconnected: false,
      error: 'no active connection'
    };
  }
  
  const duration = Date.now() - state.activeConnection.connectedAt;
  
  state.activeConnection.status = 'disconnected';
  state.activeConnection.disconnectedAt = Date.now();
  state.activeConnection.disconnectReason = reason;
  state.activeConnection.durationMs = duration;
  
  state.stats.totalDisconnections++;
  
  // Update avg duration
  const connectedItems = state.connections.filter(c => c.durationMs);
  const totalDuration = connectedItems.reduce((sum, c) => sum + c.durationMs, 0);
  state.stats.avgConnectionDurationMs = totalDuration / connectedItems.length;
  
  // Move to history
  const connectionIndex = state.connections.findIndex(c => c.id === state.activeConnection.id);
  if (connectionIndex >= 0) {
    state.connections[connectionIndex] = state.activeConnection;
  }
  
  state.activeConnection = null;
  
  saveDirectConnectState(state);
  
  return {
    disconnected: true,
    reason,
    durationMs: duration,
    stats: state.stats
  };
}

function reconnect(url) {
  const state = loadDirectConnectState();
  
  const reconnectCount = state.activeConnection
    ? state.activeConnection.reconnectAttempts + 1
    : 0;
  
  if (reconnectCount >= state.config.reconnectAttempts) {
    return {
      reconnected: false,
      error: 'max reconnect attempts reached',
      attempts: reconnectCount
    };
  }
  
  // Disconnect first if active
  if (state.activeConnection) {
    disconnect('reconnect');
  }
  
  // Reconnect
  const connection = connect(url, { reconnect: true });
  
  // Update reconnect count
  state.activeConnection.reconnectAttempts = reconnectCount;
  saveDirectConnectState(state);
  
  return {
    reconnected: true,
    attempt: reconnectCount,
    connection: state.activeConnection
  };
}

function getDirectConnectStatus() {
  const state = loadDirectConnectState();
  
  return {
    connected: state.activeConnection !== null,
    activeConnection: state.activeConnection,
    connectionCount: state.connections.length,
    stats: state.stats,
    config: state.config
  };
}

function getDirectConnectHistory(limit = 10) {
  const state = loadDirectConnectState();
  
  return {
    connections: state.connections.slice(-limit),
    stats: state.stats
  };
}

function setDirectConnectConfig(config) {
  const state = loadDirectConnectState();
  
  state.config = { ...DEFAULT_CONFIG, ...config };
  
  saveDirectConnectState(state);
  
  return {
    set: true,
    config: state.config
  };
}

function getDirectConnectConfig() {
  const state = loadDirectConnectState();
  
  return state.config;
}

function ping() {
  const state = loadDirectConnectState();
  
  if (!state.activeConnection) {
    return {
      pinged: false,
      error: 'no active connection'
    };
  }
  
  // In real implementation, would send ping
  return {
    pinged: true,
    connectionId: state.activeConnection.id,
    timestamp: Date.now(),
    simulated: true
  };
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';
  
  switch (command) {
    case 'connect':
      const connectUrl = args[1];
      if (!connectUrl) {
        console.log('Usage: node direct-connect-hook.js connect <url>');
        process.exit(1);
      }
      console.log(JSON.stringify(connect(connectUrl), null, 2));
      break;
    case 'disconnect':
      const disconnectReason = args[1] || 'manual';
      console.log(JSON.stringify(disconnect(disconnectReason), null, 2));
      break;
    case 'reconnect':
      const reconnectUrl = args[1];
      if (!reconnectUrl) {
        console.log('Usage: node direct-connect-hook.js reconnect <url>');
        process.exit(1);
      }
      console.log(JSON.stringify(reconnect(reconnectUrl), null, 2));
      break;
    case 'status':
      console.log(JSON.stringify(getDirectConnectStatus(), null, 2));
      break;
    case 'history':
      const histLimit = parseInt(args[1], 10) || 10;
      console.log(JSON.stringify(getDirectConnectHistory(histLimit), null, 2));
      break;
    case 'config':
      const configAction = args[1];
      if (configAction === 'set') {
        const reconnectAttempts = parseInt(args[2], 10) || 5;
        const reconnectDelayMs = parseInt(args[3], 10) || 1000;
        console.log(JSON.stringify(setDirectConnectConfig({
          reconnectAttempts,
          reconnectDelayMs
        }), null, 2));
      } else {
        console.log(JSON.stringify(getDirectConnectConfig(), null, 2));
      }
      break;
    case 'ping':
      console.log(JSON.stringify(ping(), null, 2));
      break;
    default:
      console.log('Usage: node direct-connect-hook.js [connect|disconnect|reconnect|status|history|config|ping]');
      process.exit(1);
  }
}

main();

module.exports = {
  connect,
  disconnect,
  reconnect,
  getDirectConnectStatus,
  getDirectConnectHistory,
  setDirectConnectConfig,
  ping,
  DEFAULT_CONFIG
};