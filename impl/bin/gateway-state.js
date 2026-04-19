/**
 * Gateway 状态保存/恢复
 * Gateway restart 时保存和恢复状态
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const STATE_FILE = path.join(os.homedir(), '.openclaw', 'gateway-state.json');
const MAX_STATE_AGE_MS = 5 * 60 * 1000;  // 5 分钟

const { bootstrapCache, contextCache } = require('./cache-lru-manager');

async function saveGatewayState() {
  try {
    // 加载 session store
    const storePath = path.join(os.homedir(), '.openclaw', 'session-store.json');
    let sessions = {};
    if (fs.existsSync(storePath)) {
      sessions = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    }

    // 加载 heartbeat 状态
    const heartbeatPath = path.join(process.cwd(), 'memory', 'heartbeat-state.json');
    let heartbeat = {};
    if (fs.existsSync(heartbeatPath)) {
      heartbeat = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
    }

    const state = {
      timestamp: Date.now(),
      sessions: Object.keys(sessions).length,
      sessionKeys: Object.keys(sessions).slice(0, 10),  // 只保存前 10 个 key
      heartbeat: {
        lastChecks: heartbeat.lastChecks || {},
        stats: heartbeat.stats || {}
      },
      cache: {
        bootstrap: bootstrapCache ? bootstrapCache.snapshot() : null,
        context: contextCache ? contextCache.snapshot() : null
      }
    };

    await fs.promises.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
    console.log('[Gateway State] Saved state:', {
      sessions: state.sessions,
      timestamp: new Date(state.timestamp).toISOString()
    });

    return true;
  } catch (e) {
    console.error('[Gateway State] Failed to save:', e.message);
    return false;
  }
}

async function restoreGatewayState() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      console.log('[Gateway State] No state file found');
      return false;
    }

    const state = JSON.parse(await fs.promises.readFile(STATE_FILE, 'utf8'));

    // 检查是否过期
    if (Date.now() - state.timestamp > MAX_STATE_AGE_MS) {
      console.log('[Gateway State] State too old, ignoring');
      await fs.promises.unlink(STATE_FILE);
      return false;
    }

    // 恢复 cache
    if (state.cache?.bootstrap && bootstrapCache) {
      bootstrapCache.restore(state.cache.bootstrap);
      console.log('[Gateway State] Restored bootstrap cache');
    }

    if (state.cache?.context && contextCache) {
      contextCache.restore(state.cache.context);
      console.log('[Gateway State] Restored context cache');
    }

    console.log('[Gateway State] Restored state:', {
      sessions: state.sessions,
      age: ((Date.now() - state.timestamp) / 1000).toFixed(0) + 's'
    });

    // 清理状态文件
    await fs.promises.unlink(STATE_FILE);

    return true;
  } catch (e) {
    console.error('[Gateway State] Failed to restore:', e.message);
    return false;
  }
}

async function getStateInfo() {
  try {
    if (!fs.existsSync(STATE_FILE)) {
      return { exists: false };
    }

    const state = JSON.parse(await fs.promises.readFile(STATE_FILE, 'utf8'));
    const age = Date.now() - state.timestamp;

    return {
      exists: true,
      sessions: state.sessions,
      age: (age / 1000).toFixed(0) + 's',
      expired: age > MAX_STATE_AGE_MS,
      timestamp: new Date(state.timestamp).toISOString()
    };
  } catch (e) {
    return { exists: false, error: e.message };
  }
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'save':
      saveGatewayState();
      break;
    case 'restore':
      restoreGatewayState();
      break;
    case 'info':
      getStateInfo().then(info => console.log(info));
      break;
    default:
      console.log('Usage: node gateway-state.js [save|restore|info]');
  }
}

module.exports = { saveGatewayState, restoreGatewayState, getStateInfo };
