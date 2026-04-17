#!/usr/bin/env node
/**
 * OpenClaw API Health Server
 * 
 * 提供HTTP健康检查API（端口8001）
 * 解决Gateway未实现API端口的体检问题
 * 
 * 用法:
 * node api-health-server.js --port 8001
 * node api-health-server.js status
 * node api-health-server.js stop
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 默认端口
const DEFAULT_PORT = 8001;

// Gateway配置路径
const GATEWAY_CONFIG = '/Users/mar2game/.openclaw/config/gateway-config.yaml';

// 状态文件路径
const STATE_FILE = '/Users/mar2game/.openclaw/workspace/state/api-health-server.json';

// 全局变量
let server = null;
let port = DEFAULT_PORT;

/**
 * 创建HTTP服务器
 */
function createServer() {
  server = http.createServer((req, res) => {
    // 健康检查接口
    if (req.url === '/api/health' || req.url === '/health') {
      handleHealthCheck(req, res);
    } 
    // 状态接口
    else if (req.url === '/api/status' || req.url === '/status') {
      handleStatus(req, res);
    }
    // 根路径
    else if (req.url === '/' || req.url === '/api') {
      handleRoot(req, res);
    }
    // 404
    else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
  
  return server;
}

/**
 * 处理健康检查
 */
function handleHealthCheck(req, res) {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    gateway: checkGatewayHealth(),
    services: checkServicesHealth()
  };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(health, null, 2));
}

/**
 * 处理状态查询
 */
function handleStatus(req, res) {
  const status = {
    apiServer: {
      port: port,
      uptime: process.uptime(),
      pid: process.pid,
      status: 'running'
    },
    gateway: checkGatewayHealth(),
    skills: countSkills(),
    scripts: countScripts(),
    heartbeatTasks: countHeartbeatTasks()
  };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(status, null, 2));
}

/**
 * 处理根路径
 */
function handleRoot(req, res) {
  const info = {
    name: 'OpenClaw API Health Server',
    version: '1.0.0',
    endpoints: [
      '/api/health - Health check',
      '/api/status - Status summary'
    ]
  };
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(info, null, 2));
}

/**
 * 检查Gateway健康
 */
function checkGatewayHealth() {
  // 检查Gateway进程
  try {
    const result = require('child_process').execSync('ps aux | grep openclaw-gateway | grep -v grep', { encoding: 'utf8' });
    
    if (result.trim()) {
      const parts = result.trim().split(/\s+/);
      return {
        ok: true,
        pid: parseInt(parts[1]),
        status: 'active',
        port: 18789
      };
    }
  } catch (err) {
    // ignore
  }
  
  return {
    ok: false,
    status: 'not_running'
  };
}

/**
 * 检查服务健康
 */
function checkServicesHealth() {
  const services = {};
  
  // 检查Gateway RPC端口
  try {
    const result = require('child_process').execSync('lsof -i :18789', { encoding: 'utf8' });
    services.rpc = result.trim() ? 'ok' : 'error';
  } catch (err) {
    services.rpc = 'error';
  }
  
  // 检查Skills
  services.skills = countSkills() > 0 ? 'ok' : 'error';
  
  // 检查Scripts
  services.scripts = countScripts() > 0 ? 'ok' : 'error';
  
  return services;
}

/**
 * 计数Skills
 */
function countSkills() {
  try {
    const skillsDir = '/Users/mar2game/.openclaw/workspace/skills';
    if (fs.existsSync(skillsDir)) {
      return fs.readdirSync(skillsDir).length;
    }
  } catch (err) {
    // ignore
  }
  return 0;
}

/**
 * 计数Scripts
 */
function countScripts() {
  try {
    const scriptsDir = '/Users/mar2game/.openclaw/workspace/impl/bin';
    if (fs.existsSync(scriptsDir)) {
      return fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js')).length;
    }
  } catch (err) {
    // ignore
  }
  return 0;
}

/**
 * 计数心跳任务
 */
function countHeartbeatTasks() {
  try {
    const heartbeatFile = '/Users/mar2game/.openclaw/workspace/HEARTBEAT.md';
    if (fs.existsSync(heartbeatFile)) {
      const content = fs.readFileSync(heartbeatFile, 'utf8');
      const matches = content.match(/- name:/g);
      return matches ? matches.length : 0;
    }
  } catch (err) {
    // ignore
  }
  return 0;
}

/**
 * 保存状态
 */
function saveState() {
  const state = {
    pid: process.pid,
    port: port,
    startTime: Date.now(),
    status: 'running'
  };
  
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

/**
 * 加载状态
 */
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return null;
}

/**
 * 启动服务器
 */
function startServer(portNum) {
  port = portNum || DEFAULT_PORT;
  
  createServer();
  
  server.listen(port, '127.0.0.1', () => {
    console.log(`✅ API Health Server running on port ${port}`);
    console.log(`Endpoints:`);
    console.log(`  http://127.0.0.1:${port}/api/health`);
    console.log(`  http://127.0.0.1:${port}/api/status`);
    
    saveState();
  });
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} already in use`);
      process.exit(1);
    } else {
      console.error(`❌ Server error:`, err);
      process.exit(1);
    }
  });
}

/**
 * 停止服务器
 */
function stopServer() {
  const state = loadState();
  
  if (state && state.pid) {
    try {
      process.kill(state.pid, 'SIGTERM');
      console.log(`✅ API Health Server stopped (PID ${state.pid})`);
      
      // 删除状态文件
      if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
      }
    } catch (err) {
      console.error(`❌ Failed to stop server:`, err.message);
    }
  } else {
    console.log('⚠️  No running API Health Server found');
  }
}

/**
 * 查询状态
 */
function showStatus() {
  const state = loadState();
  
  if (state && state.pid) {
    try {
      // 检查进程是否存活
      process.kill(state.pid, 0);
      
      console.log(`✅ API Health Server running`);
      console.log(`PID: ${state.pid}`);
      console.log(`Port: ${state.port}`);
      console.log(`Uptime: ${Math.floor((Date.now() - state.startTime) / 1000)}s`);
    } catch (err) {
      console.log(`⚠️  API Health Server stopped (PID ${state.pid} not running)`);
      
      // 删除状态文件
      if (fs.existsSync(STATE_FILE)) {
        fs.unlinkSync(STATE_FILE);
      }
    }
  } else {
    console.log('⚠️  No API Health Server running');
  }
}

/**
 * CLI入口
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'start' || !command || command.startsWith('--')) {
    // 启动服务器
    const portArg = args.find(a => a.startsWith('--port'));
    const portNum = portArg ? parseInt(portArg.split('=')[1] || args[args.indexOf(portArg) + 1]) : DEFAULT_PORT;
    
    startServer(portNum);
    
  } else if (command === 'stop') {
    // 停止服务器
    stopServer();
    
  } else if (command === 'status') {
    // 查询状态
    showStatus();
    
  } else if (command === 'test') {
    // 测试连接
    testConnection();
    
  } else {
    console.log(`
OpenClaw API Health Server

用法:
  node api-health-server.js [start] [--port=8001]  启动服务器
  node api-health-server.js stop                    停止服务器
  node api-health-server.js status                  查询状态
  node api-health-server.js test                    测试连接

Endpoints:
  http://127.0.0.1:8001/api/health  健康检查
  http://127.0.0.1:8001/api/status   状态查询
`);
  }
}

/**
 * 测试连接
 */
function testConnection() {
  const http = require('http');
  
  const req = http.request({
    hostname: '127.0.0.1',
    port: DEFAULT_PORT,
    path: '/api/health',
    method: 'GET'
  }, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ API Health Server connection test passed');
        console.log(JSON.stringify(JSON.parse(data), null, 2));
      } else {
        console.log(`❌ Connection test failed (status ${res.statusCode})`);
      }
    });
  });
  
  req.on('error', (err) => {
    console.log('❌ Connection test failed:', err.message);
  });
  
  req.end();
}

// 导出函数
module.exports = {
  createServer,
  startServer,
  stopServer,
  showStatus,
  testConnection
};

// CLI入口
if (require.main === module) {
  main();
}