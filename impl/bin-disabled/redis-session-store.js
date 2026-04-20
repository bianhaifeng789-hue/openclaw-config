/**
 * Redis Session Store 简化实现（无需外部依赖）
 * 使用 ioredis 或纯 JSON 降级
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const JSON_PATH = path.join(os.homedir(), '.openclaw', 'session-store.json');
const KEY_PREFIX = 'openclaw:session:';
const DEFAULT_TTL = 7 * 24 * 60 * 60; // 7 天（秒）

class RedisSessionStore {
  constructor() {
    this.client = null;
    this.connected = false;
    this.useJSON = false;
  }

  async connect() {
    if (this.connected) return;

    // 尝试加载 redis
    try {
      const { createClient } = require('redis');
      
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          connectTimeout: 5000,  // 5秒连接超时
          reconnectStrategy: (retries) => {
            if (retries > 2) {
              console.log('[RedisStore] Max retries reached, using JSON fallback');
              this.useJSON = true;
              this.connected = true;
              return false;  // 停止重连
            }
            return 1000;  // 1秒后重试
          }
        },
        password: process.env.REDIS_PASSWORD || undefined,
        database: parseInt(process.env.REDIS_DB || '0')
      });

      this.client.on('error', (err) => {
        // 静默处理错误，避免刷屏
      });

      // 显式连接（redis 4.x 需要）
      await this.client.connect();
      
      console.log('[RedisStore] Connected to Redis');
      this.connected = true;

    } catch (e) {
      if (!this.useJSON) {
        console.log('[RedisStore] Connection failed, using JSON fallback');
      }
      this.useJSON = true;
      this.connected = true;
    }
  }

  async disconnect() {
    if (this.client && !this.useJSON) {
      await this.client.disconnect();
    }
    this.connected = false;
  }

  _key(sessionKey) {
    return `${KEY_PREFIX}${sessionKey}`;
  }

  // JSON 降级实现
  _jsonLoad() {
    if (!fs.existsSync(JSON_PATH)) return {};
    try {
      return JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    } catch (e) {
      return {};
    }
  }

  _jsonSave(data) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
  }

  async get(sessionKey) {
    await this.connect();

    if (this.useJSON) {
      const store = this._jsonLoad();
      return store[sessionKey] || null;
    }

    const data = await this.client.get(this._key(sessionKey));
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }

  async set(sessionKey, data, ttl = DEFAULT_TTL) {
    await this.connect();

    if (this.useJSON) {
      const store = this._jsonLoad();
      store[sessionKey] = { ...data, _ttl: ttl, _setAt: Date.now() };
      this._jsonSave(store);
      return { success: true };
    }

    const jsonData = JSON.stringify(data);
    await this.client.setEx(this._key(sessionKey), ttl, jsonData);
    return { success: true };
  }

  async delete(sessionKey) {
    await this.connect();

    if (this.useJSON) {
      const store = this._jsonLoad();
      delete store[sessionKey];
      this._jsonSave(store);
      return { deleted: 1 };
    }

    const result = await this.client.del(this._key(sessionKey));
    return { deleted: result };
  }

  async exists(sessionKey) {
    await this.connect();

    if (this.useJSON) {
      const store = this._jsonLoad();
      return !!store[sessionKey];
    }

    const result = await this.client.exists(this._key(sessionKey));
    return result === 1;
  }

  async getAll() {
    await this.connect();

    if (this.useJSON) {
      return this._jsonLoad();
    }

    // 获取所有 keys (使用 scanIterator 替代 keys)
    const keys = [];
    for await (const key of this.client.scanIterator({ MATCH: `${KEY_PREFIX}*` })) {
      keys.push(key);
    }
    const result = {};

    for (const key of keys) {
      const data = await this.client.get(key);
      if (data) {
        try {
          const sessionKey = key.replace(KEY_PREFIX, '');
          result[sessionKey] = JSON.parse(data);
        } catch (e) {}
      }
    }

    return result;
  }

  async getStats() {
    await this.connect();

    if (this.useJSON) {
      const store = this._jsonLoad();
      return {
        sessionCount: Object.keys(store).length,
        backend: 'json',
        note: 'redis not available'
      };
    }

    // 使用 scanIterator 替代 keys
    const keys = [];
    for await (const key of this.client.scanIterator({ MATCH: `${KEY_PREFIX}*` })) {
      keys.push(key);
    }

    const info = await this.client.info('memory');
    const usedMemory = info.match(/used_memory:(\d+)/);

    return {
      sessionCount: keys.length,
      usedMemoryBytes: usedMemory ? parseInt(usedMemory[1]) : 0,
      usedMemoryMB: usedMemory ? (parseInt(usedMemory[1]) / 1024 / 1024).toFixed(2) : '0',
      backend: 'redis'
    };
  }

  async cleanupOldSessions() {
    // Redis 自动处理过期，JSON 需要手动清理
    if (this.useJSON) {
      const store = this._jsonLoad();
      const now = Date.now();
      let deleted = 0;
      const maxAgeMs = DEFAULT_TTL * 1000;

      for (const [key, data] of Object.entries(store)) {
        const setAt = data._setAt || 0;
        if (now - setAt > maxAgeMs) {
          delete store[key];
          deleted++;
        }
      }
      this._jsonSave(store);
      return { deleted };
    }

    return { message: 'Redis handles expiration automatically' };
  }
}

// 全局实例
const redisStore = new RedisSessionStore();

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case 'connect':
        await redisStore.connect();
        console.log('Connected');
        console.log('Backend:', redisStore.useJSON ? 'JSON (fallback)' : 'Redis');
        await redisStore.disconnect();
        break;

      case 'stats':
        await redisStore.connect();
        const stats = await redisStore.getStats();
        console.log(stats);
        await redisStore.disconnect();
        break;

      case 'test':
        await redisStore.connect();
        await redisStore.set('test-session', { test: true, timestamp: Date.now() }, 60);
        const data = await redisStore.get('test-session');
        console.log('Test data:', data);
        await redisStore.delete('test-session');
        console.log('Test completed');
        await redisStore.disconnect();
        break;

      case 'check':
        try {
          await redisStore.connect();
          const info = await redisStore.getStats();
          console.log('✓ Connection OK');
          console.log('  Backend:', info.backend);
          console.log('  Sessions:', info.sessionCount);
          if (info.usedMemoryMB) {
            console.log('  Memory:', info.usedMemoryMB + 'MB');
          }
          await redisStore.disconnect();
        } catch (e) {
          console.log('✗ Connection failed:', e.message);
          process.exit(1);
        }
        break;

      default:
        console.log('Usage: node redis-session-store.js [connect|stats|test|check]');
        console.log('');
        console.log('Environment variables:');
        console.log('  REDIS_HOST - Redis host (default: localhost)');
        console.log('  REDIS_PORT - Redis port (default: 6379)');
        console.log('  REDIS_PASSWORD - Redis password');
        console.log('  REDIS_DB - Redis database (default: 0)');
    }
  })();
}

module.exports = { RedisSessionStore, redisStore };
