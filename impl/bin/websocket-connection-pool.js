#!/usr/bin/env node
/**
 * WebSocket Connection Pool - WebSocket 连接池
 * 
 * 功能：
 * 1. 管理 WebSocket 连接复用
 * 2. 连接健康检查
 * 3. 自动重连优化
 * 
 * 用法：
 *   node websocket-connection-pool.js status
 *   node websocket-connection-pool.js cleanup
 *   node websocket-connection-pool.js stats
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateFile: 'state/websocket-connection-pool.json',
  
  // 连接池配置
  pool: {
    maxConnections: 5,      // 最大连接数
    maxIdleTime: 5 * 60 * 1000,  // 最大空闲时间 5 分钟
    healthCheckInterval: 30 * 1000  // 健康检查间隔 30 秒
  }
};

// 连接池类
class WebSocketConnectionPool {
  constructor() {
    this.connections = new Map();
    this.stats = {
      created: 0,
      reused: 0,
      closed: 0,
      failed: 0
    };
  }
  
  // 获取连接
  getConnection(key) {
    const conn = this.connections.get(key);
    
    if (!conn) {
      return null;
    }
    
    // 检查是否过期
    if (Date.now() - conn.lastUsed > CONFIG.pool.maxIdleTime) {
      this.closeConnection(key);
      return null;
    }
    
    // 更新使用时间
    conn.lastUsed = Date.now();
    conn.useCount++;
    this.stats.reused++;
    
    return conn;
  }
  
  // 创建连接
  createConnection(key, ws) {
    // 淘汰最旧的连接
    if (this.connections.size >= CONFIG.pool.maxConnections) {
      const oldestKey = this.findOldestConnection();
      if (oldestKey) {
        this.closeConnection(oldestKey);
      }
    }
    
    const conn = {
      key,
      ws,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      useCount: 0,
      healthChecks: 0,
      failedChecks: 0
    };
    
    this.connections.set(key, conn);
    this.stats.created++;
    
    return conn;
  }
  
  // 关闭连接
  closeConnection(key) {
    const conn = this.connections.get(key);
    if (!conn) return;
    
    try {
      if (conn.ws && conn.ws.readyState === 1) {  // OPEN
        conn.ws.close();
      }
    } catch {}
    
    this.connections.delete(key);
    this.stats.closed++;
  }
  
  // 查找最旧的连接
  findOldestConnection() {
    let oldest = null;
    let oldestTime = Infinity;
    
    for (const [key, conn] of this.connections) {
      if (conn.lastUsed < oldestTime) {
        oldestTime = conn.lastUsed;
        oldest = key;
      }
    }
    
    return oldest;
  }
  
  // 健康检查
  healthCheck() {
    const now = Date.now();
    let checked = 0;
    let failed = 0;
    let closed = 0;
    
    for (const [key, conn] of this.connections) {
      // 检查空闲时间
      if (now - conn.lastUsed > CONFIG.pool.maxIdleTime) {
        this.closeConnection(key);
        closed++;
        continue;
      }
      
      // 检查连接状态
      conn.healthChecks++;
      checked++;
      
      if (!conn.ws || conn.ws.readyState !== 1) {
        conn.failedChecks++;
        failed++;
        
        if (conn.failedChecks > 3) {
          this.closeConnection(key);
          closed++;
        }
      }
    }
    
    return { checked, failed, closed };
  }
  
  // 清理所有连接
  cleanup() {
    let closed = 0;
    
    for (const key of this.connections.keys()) {
      this.closeConnection(key);
      closed++;
    }
    
    return closed;
  }
  
  // 获取统计
  getStats() {
    return {
      activeConnections: this.connections.size,
      maxConnections: CONFIG.pool.maxConnections,
      ...this.stats
    };
  }
  
  // 导出
  export() {
    return {
      connections: Array.from(this.connections.entries()).map(([key, conn]) => ({
        key,
        createdAt: conn.createdAt,
        lastUsed: conn.lastUsed,
        useCount: conn.useCount,
        healthChecks: conn.healthChecks,
        failedChecks: conn.failedChecks
      })),
      stats: this.stats,
      exportedAt: Date.now()
    };
  }
  
  // 导入
  import(data) {
    if (data.stats) {
      this.stats = data.stats;
    }
  }
}

// 全局实例
const connectionPool = new WebSocketConnectionPool();

// 加载状态
function loadState() {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  if (fs.existsSync(statePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      connectionPool.import(data);
    } catch {}
  }
}

// 保存状态
function saveState() {
  const statePath = path.join(CONFIG.workspace, CONFIG.stateFile);
  const data = connectionPool.export();
  fs.writeFileSync(statePath, JSON.stringify(data, null, 2));
}

// 显示状态
function showStatus() {
  console.log('=== WebSocket 连接池状态 ===\n');
  
  const stats = connectionPool.getStats();
  
  console.log(`活跃连接: ${stats.activeConnections}/${stats.maxConnections}`);
  console.log(`创建: ${stats.created}`);
  console.log(`复用: ${stats.reused}`);
  console.log(`关闭: ${stats.closed}`);
  console.log(`失败: ${stats.failed}`);
}

// 健康检查
function runHealthCheck() {
  console.log('=== WebSocket 连接池健康检查 ===\n');
  
  const result = connectionPool.healthCheck();
  saveState();
  
  console.log(`检查: ${result.checked}`);
  console.log(`失败: ${result.failed}`);
  console.log(`关闭: ${result.closed}`);
}

// 清理连接
function cleanupConnections() {
  console.log('=== 清理 WebSocket 连接 ===\n');
  
  const closed = connectionPool.cleanup();
  saveState();
  
  console.log(`关闭连接: ${closed}`);
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'status';
  
  loadState();
  
  switch (action) {
    case 'status':
      showStatus();
      break;
      
    case 'health':
      runHealthCheck();
      break;
      
    case 'cleanup':
      cleanupConnections();
      break;
      
    default:
      console.log('用法: node websocket-connection-pool.js [status|health|cleanup]');
  }
  
  saveState();
}

main().catch(console.error);