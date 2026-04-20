/**
 * Session Store 适配器
 * 统一接口，支持 JSON/SQLite/Redis 三种后端
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// 导入具体实现
const { SQLiteSessionStore } = require('./sqlite-session-store');
const { RedisSessionStore } = require('./redis-session-store');

const JSON_STORE_PATH = path.join(os.homedir(), '.openclaw', 'session-store.json');

class SessionStoreAdapter {
  constructor(backend = 'json') {
    this.backend = backend;
    this.store = null;
  }

  async init() {
    switch (this.backend) {
      case 'sqlite':
        const sqlite = new SQLiteSessionStore();
        await sqlite.init();
        this.store = sqlite;
        break;
      case 'redis':
        const redis = new RedisSessionStore();
        await redis.connect();
        this.store = redis;
        break;
      case 'json':
      default:
        this.store = new JSONSessionStore();
        break;
    }
  }

  async get(sessionKey) {
    return await this.store.get(sessionKey);
  }

  async set(sessionKey, data) {
    return await this.store.set(sessionKey, data);
  }

  async delete(sessionKey) {
    return await this.store.delete(sessionKey);
  }

  async getAll() {
    return await this.store.getAll();
  }

  async getStats() {
    return await this.store.getStats();
  }

  async cleanupOldSessions(maxAgeMs) {
    return await this.store.cleanupOldSessions(maxAgeMs);
  }

  async close() {
    if (this.backend === 'sqlite') {
      await this.store.close();
    } else if (this.backend === 'redis') {
      await this.store.disconnect();
    }
  }
}

// JSON 文件存储实现（默认）
class JSONSessionStore {
  constructor() {
    this.cache = null;
  }

  _load() {
    if (this.cache) return this.cache;

    if (fs.existsSync(JSON_STORE_PATH)) {
      try {
        this.cache = JSON.parse(fs.readFileSync(JSON_STORE_PATH, 'utf8'));
      } catch (e) {
        console.error('[JSONStore] Failed to load:', e.message);
        this.cache = {};
      }
    } else {
      this.cache = {};
    }

    return this.cache;
  }

  _save() {
    try {
      fs.writeFileSync(JSON_STORE_PATH, JSON.stringify(this.cache, null, 2));
      return true;
    } catch (e) {
      console.error('[JSONStore] Failed to save:', e.message);
      return false;
    }
  }

  async get(sessionKey) {
    const store = this._load();
    return store[sessionKey] || null;
  }

  async set(sessionKey, data) {
    const store = this._load();
    store[sessionKey] = data;
    this._save();
    return { success: true };
  }

  async delete(sessionKey) {
    const store = this._load();
    delete store[sessionKey];
    this._save();
    return { success: true };
  }

  async getAll() {
    return this._load();
  }

  async getStats() {
    const store = this._load();
    const keys = Object.keys(store);

    return {
      sessionCount: keys.length,
      backend: 'json',
      fileSize: fs.existsSync(JSON_STORE_PATH)
        ? (fs.statSync(JSON_STORE_PATH).size / 1024).toFixed(2) + 'KB'
        : 'N/A'
    };
  }

  async cleanupOldSessions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    const store = this._load();
    const now = Date.now();
    let deleted = 0;

    for (const [key, data] of Object.entries(store)) {
      const lastAccessed = data.lastAccessed || data.updatedAt || 0;
      if (now - lastAccessed > maxAgeMs) {
        delete store[key];
        deleted++;
      }
    }

    this._save();
    return { deleted };
  }
}

// 迁移工具：JSON → SQLite/Redis
async function migrateToSQLite() {
  console.log('[Migrate] Starting JSON → SQLite migration...');

  const jsonStore = new JSONSessionStore();
  const data = await jsonStore.getAll();
  const keys = Object.keys(data);

  console.log(`[Migrate] Found ${keys.length} sessions in JSON store`);

  const sqlite = new SQLiteSessionStore();
  await sqlite.init();

  let migrated = 0;
  for (const key of keys) {
    await sqlite.set(key, data[key]);
    migrated++;
    if (migrated % 100 === 0) {
      console.log(`[Migrate] Migrated ${migrated}/${keys.length}...`);
    }
  }

  console.log(`[Migrate] Completed: ${migrated} sessions migrated to SQLite`);
  await sqlite.close();

  return { migrated };
}

async function migrateToRedis() {
  console.log('[Migrate] Starting JSON → Redis migration...');

  const jsonStore = new JSONSessionStore();
  const data = await jsonStore.getAll();
  const keys = Object.keys(data);

  console.log(`[Migrate] Found ${keys.length} sessions in JSON store`);

  const redis = new RedisSessionStore();
  await redis.connect();

  let migrated = 0;
  for (const key of keys) {
    await redis.set(key, data[key]);
    migrated++;
    if (migrated % 100 === 0) {
      console.log(`[Migrate] Migrated ${migrated}/${keys.length}...`);
    }
  }

  console.log(`[Migrate] Completed: ${migrated} sessions migrated to Redis`);
  await redis.disconnect();

  return { migrated };
}

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];
  const backend = process.argv[3] || 'json';

  (async () => {
    switch (command) {
      case 'stats':
        const adapter = new SessionStoreAdapter(backend);
        await adapter.init();
        const stats = await adapter.getStats();
        console.log(stats);
        await adapter.close();
        break;

      case 'migrate-sqlite':
        await migrateToSQLite();
        break;

      case 'migrate-redis':
        await migrateToRedis();
        break;

      case 'compare':
        console.log('Comparing backends...\n');

        // JSON
        const jsonAdapter = new SessionStoreAdapter('json');
        await jsonAdapter.init();
        const jsonStats = await jsonAdapter.getStats();
        console.log('JSON Store:', jsonStats);

        // SQLite
        try {
          const sqliteAdapter = new SessionStoreAdapter('sqlite');
          await sqliteAdapter.init();
          const sqliteStats = await sqliteAdapter.getStats();
          console.log('SQLite Store:', sqliteStats);
          await sqliteAdapter.close();
        } catch (e) {
          console.log('SQLite Store: Not available');
        }

        // Redis
        try {
          const redisAdapter = new SessionStoreAdapter('redis');
          await redisAdapter.init();
          const redisStats = await redisAdapter.getStats();
          console.log('Redis Store:', redisStats);
          await redisAdapter.close();
        } catch (e) {
          console.log('Redis Store: Not available');
        }
        break;

      default:
        console.log('Usage: node session-store-adapter.js [stats|migrate-sqlite|migrate-redis|compare] [backend]');
        console.log('');
        console.log('Backends: json (default), sqlite, redis');
    }
  })();
}

module.exports = {
  SessionStoreAdapter,
  JSONSessionStore,
  migrateToSQLite,
  migrateToRedis
};
