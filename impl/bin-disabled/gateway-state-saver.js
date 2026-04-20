#!/usr/bin/env node
/**
 * Gateway State Saver - Gateway 状态保存器
 * 
 * 功能：
 * 1. Gateway restart 前保存状态
 * 2. Gateway startup 时恢复状态
 * 3. 自动清理过期状态
 * 
 * 用法：
 *   node gateway-state-saver.js save
 *   node gateway-state-saver.js restore
 *   node gateway-state-saver.js cleanup [--max-age=5m]
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 配置
const CONFIG = {
  workspace: '/Users/mar2game/.openclaw/workspace',
  stateDir: path.join(os.homedir(), '.openclaw', 'gateway-state'),
  stateFile: 'gateway-state.json',
  
  // 状态有效期
  maxAgeMs: 5 * 60 * 1000,  // 5 分钟
  
  // 保存内容
  include: {
    sessions: true,
    heartbeat: true,
    cache: true,
    timestamp: true
  }
};

// 确保状态目录存在
function ensureStateDir() {
  if (!fs.existsSync(CONFIG.stateDir)) {
    fs.mkdirSync(CONFIG.stateDir, { recursive: true });
  }
}

// 获取状态文件路径
function getStateFilePath() {
  return path.join(CONFIG.stateDir, CONFIG.stateFile);
}

/**
 * 保存 Gateway 状态
 */
async function saveGatewayState() {
  console.log('=== 保存 Gateway 状态 ===\n');
  
  ensureStateDir();
  
  const state = {
    timestamp: Date.now(),
    version: '1.0.0'
  };
  
  // 保存 Sessions
  if (CONFIG.include.sessions) {
    try {
      const sessionStorePath = path.join(os.homedir(), '.openclaw', 'session-store.json');
      if (fs.existsSync(sessionStorePath)) {
        state.sessions = JSON.parse(fs.readFileSync(sessionStorePath, 'utf8'));
        console.log(`✓ Sessions: ${Object.keys(state.sessions).length} 个`);
      }
    } catch (e) {
      console.log(`✗ Sessions: ${e.message}`);
    }
  }
  
  // 保存 Heartbeat 状态
  if (CONFIG.include.heartbeat) {
    try {
      const heartbeatStatePath = path.join(CONFIG.workspace, 'memory', 'heartbeat-state.json');
      if (fs.existsSync(heartbeatStatePath)) {
        state.heartbeat = JSON.parse(fs.readFileSync(heartbeatStatePath, 'utf8'));
        console.log('✓ Heartbeat 状态');
      }
    } catch (e) {
      console.log(`✗ Heartbeat: ${e.message}`);
    }
  }
  
  // 保存 Cache 状态
  if (CONFIG.include.cache) {
    try {
      const cacheStatePath = path.join(CONFIG.workspace, 'state', 'cache-lru-state.json');
      if (fs.existsSync(cacheStatePath)) {
        state.cache = JSON.parse(fs.readFileSync(cacheStatePath, 'utf8'));
        console.log('✓ Cache 状态');
      }
    } catch (e) {
      console.log(`✗ Cache: ${e.message}`);
    }
  }
  
  // 保存到文件
  const stateFilePath = getStateFilePath();
  fs.writeFileSync(stateFilePath, JSON.stringify(state, null, 2));
  
  console.log(`\n✅ 状态已保存: ${stateFilePath}`);
  console.log(`时间戳: ${new Date(state.timestamp).toISOString()}`);
  
  return state;
}

/**
 * 恢复 Gateway 状态
 */
async function restoreGatewayState() {
  console.log('=== 恢复 Gateway 状态 ===\n');
  
  const stateFilePath = getStateFilePath();
  
  if (!fs.existsSync(stateFilePath)) {
    console.log('状态文件不存在，无需恢复');
    return null;
  }
  
  const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
  
  // 检查是否过期
  const age = Date.now() - state.timestamp;
  if (age > CONFIG.maxAgeMs) {
    console.log(`状态已过期: ${Math.round(age / 1000)}s > ${CONFIG.maxAgeMs / 1000}s`);
    console.log('清理过期状态...');
    fs.unlinkSync(stateFilePath);
    return null;
  }
  
  console.log(`状态年龄: ${Math.round(age / 1000)}s`);
  console.log(`时间戳: ${new Date(state.timestamp).toISOString()}\n`);
  
  // 恢复 Sessions
  if (state.sessions && CONFIG.include.sessions) {
    try {
      const sessionStorePath = path.join(os.homedir(), '.openclaw', 'session-store.json');
      fs.writeFileSync(sessionStorePath, JSON.stringify(state.sessions, null, 2));
      console.log(`✓ Sessions 已恢复: ${Object.keys(state.sessions).length} 个`);
    } catch (e) {
      console.log(`✗ Sessions 恢复失败: ${e.message}`);
    }
  }
  
  // 恢复 Heartbeat 状态
  if (state.heartbeat && CONFIG.include.heartbeat) {
    try {
      const heartbeatStatePath = path.join(CONFIG.workspace, 'memory', 'heartbeat-state.json');
      fs.writeFileSync(heartbeatStatePath, JSON.stringify(state.heartbeat, null, 2));
      console.log('✓ Heartbeat 状态已恢复');
    } catch (e) {
      console.log(`✗ Heartbeat 恢复失败: ${e.message}`);
    }
  }
  
  // 恢复 Cache 状态
  if (state.cache && CONFIG.include.cache) {
    try {
      const cacheStatePath = path.join(CONFIG.workspace, 'state', 'cache-lru-state.json');
      fs.writeFileSync(cacheStatePath, JSON.stringify(state.cache, null, 2));
      console.log('✓ Cache 状态已恢复');
    } catch (e) {
      console.log(`✗ Cache 恢复失败: ${e.message}`);
    }
  }
  
  console.log('\n✅ 状态恢复完成');
  
  // 清理状态文件
  fs.unlinkSync(stateFilePath);
  console.log('状态文件已清理');
  
  return state;
}

/**
 * 清理过期状态
 */
function cleanupOldStates(maxAgeMinutes = 5) {
  console.log('=== 清理过期状态 ===\n');
  console.log(`清理阈值: > ${maxAgeMinutes} 分钟\n`);
  
  if (!fs.existsSync(CONFIG.stateDir)) {
    console.log('状态目录不存在');
    return { removed: 0 };
  }
  
  const files = fs.readdirSync(CONFIG.stateDir);
  const now = Date.now();
  const maxAgeMs = maxAgeMinutes * 60 * 1000;
  
  let removed = 0;
  
  files.forEach(file => {
    const filePath = path.join(CONFIG.stateDir, file);
    const stat = fs.statSync(filePath);
    const age = now - stat.mtimeMs;
    
    if (age > maxAgeMs) {
      console.log(`删除: ${file} (${Math.round(age / 60000)}分钟)`);
      fs.unlinkSync(filePath);
      removed++;
    }
  });
  
  console.log(`\n✅ 清理完成: ${removed} 个文件`);
  
  return { removed };
}

/**
 * 显示状态
 */
function showStatus() {
  const stateFilePath = getStateFilePath();
  
  console.log('=== Gateway 状态保存器状态 ===\n');
  
  if (fs.existsSync(stateFilePath)) {
    const state = JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
    const age = Date.now() - state.timestamp;
    
    console.log(`状态文件: 存在`);
    console.log(`时间戳: ${new Date(state.timestamp).toISOString()}`);
    console.log(`年龄: ${Math.round(age / 1000)}s`);
    console.log(`过期: ${age > CONFIG.maxAgeMs ? '是' : '否'}`);
    
    if (state.sessions) {
      console.log(`Sessions: ${Object.keys(state.sessions).length} 个`);
    }
    if (state.heartbeat) {
      console.log(`Heartbeat: 已保存`);
    }
    if (state.cache) {
      console.log(`Cache: 已保存`);
    }
  } else {
    console.log('状态文件: 不存在');
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const action = args[0] || 'status';
  
  switch (action) {
    case 'save':
      await saveGatewayState();
      break;
      
    case 'restore':
      await restoreGatewayState();
      break;
      
    case 'cleanup':
      const maxAgeArg = args.find(a => a.startsWith('--max-age='));
      const maxAge = maxAgeArg ? parseInt(maxAgeArg.split('=')[1]) : 5;
      cleanupOldStates(maxAge);
      break;
      
    case 'status':
      showStatus();
      break;
      
    default:
      console.log('用法: node gateway-state-saver.js [save|restore|cleanup|status] [--max-age=5m]');
  }
}

main().catch(console.error);