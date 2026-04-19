/**
 * Session Store 增量更新管理器
 * 实现缓存 + 批量写入，减少磁盘 I/O
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const STORE_FILE = path.join(os.homedir(), '.openclaw', 'session-store.json');
const FLUSH_INTERVAL_MS = 5000;  // 5 秒批量写入
const MAX_PENDING_UPDATES = 100;  // 最多缓存 100 个更新

class SessionStoreManager {
  constructor() {
    this.cache = null;
    this.pendingUpdates = new Map();
    this.lastFlush = 0;
    this.flushTimer = null;
    this.updateCount = 0;
  }

  async load() {
    if (this.cache) return this.cache;

    try {
      if (fs.existsSync(STORE_FILE)) {
        const data = await fs.promises.readFile(STORE_FILE, 'utf8');
        this.cache = JSON.parse(data);
      } else {
        this.cache = {};
      }
    } catch (e) {
      console.error('[SessionStore] Failed to load:', e.message);
      this.cache = {};
    }

    return this.cache;
  }

  async update(sessionKey, updater) {
    const store = await this.load();

    // 应用更新
    if (!store[sessionKey]) {
      store[sessionKey] = {};
    }
    const result = updater(store[sessionKey]);

    // 加入待写入队列
    this.pendingUpdates.set(sessionKey, {
      data: store[sessionKey],
      timestamp: Date.now()
    });

    this.updateCount++;

    // 触发批量写入
    this.scheduleFlush();

    // 如果队列太大，立即写入
    if (this.pendingUpdates.size >= MAX_PENDING_UPDATES) {
      await this.flush();
    }

    return result;
  }

  scheduleFlush() {
    if (this.flushTimer) return;

    const timeSinceLastFlush = Date.now() - this.lastFlush;
    const delay = Math.max(0, FLUSH_INTERVAL_MS - timeSinceLastFlush);

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, delay);
  }

  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.pendingUpdates.size === 0) return;

    const store = await this.load();

    // 应用所有待处理更新
    for (const [key, update] of this.pendingUpdates) {
      store[key] = update.data;
    }

    try {
      await fs.promises.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
      this.lastFlush = Date.now();

      const count = this.pendingUpdates.size;
      this.pendingUpdates.clear();

      console.log(`[SessionStore] Flushed ${count} updates`);
    } catch (e) {
      console.error('[SessionStore] Failed to flush:', e.message);
    }
  }

  async get(sessionKey) {
    const store = await this.load();
    return store[sessionKey] || null;
  }

  async getAll() {
    return await this.load();
  }

  getStats() {
    return {
      cached: this.cache !== null,
      pendingUpdates: this.pendingUpdates.size,
      updateCount: this.updateCount,
      lastFlush: this.lastFlush,
      flushInterval: FLUSH_INTERVAL_MS
    };
  }

  // 强制立即写入
  async forceFlush() {
    await this.flush();
  }
}

// 全局实例
const storeManager = new SessionStoreManager();

// 进程退出时强制写入
process.on('beforeExit', async () => {
  await storeManager.forceFlush();
});

process.on('SIGINT', async () => {
  await storeManager.forceFlush();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await storeManager.forceFlush();
  process.exit(0);
});

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'stats':
      console.log(storeManager.getStats());
      break;
    case 'flush':
      storeManager.forceFlush().then(() => {
        console.log('[SessionStore] Forced flush completed');
      });
      break;
    default:
      console.log('Usage: node session-store-manager.js [stats|flush]');
  }
}

module.exports = { SessionStoreManager, storeManager };
