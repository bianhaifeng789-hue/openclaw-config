/**
 * SQLite Session Store 简化实现（无需外部依赖）
 * 使用 better-sqlite3 或纯 JSON 降级
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DB_PATH = path.join(os.homedir(), '.openclaw', 'session-store.db');
const JSON_PATH = path.join(os.homedir(), '.openclaw', 'session-store.json');

class SQLiteSessionStore {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.useJSON = false;
  }

  async init() {
    if (this.initialized) return;

    // 尝试加载 sqlite3
    try {
      const sqlite3 = require('sqlite3').verbose();
      this.db = new sqlite3.Database(DB_PATH);
      
      // 创建表
      await this._run('CREATE TABLE IF NOT EXISTS sessions (session_key TEXT PRIMARY KEY, data TEXT NOT NULL, created_at INTEGER, updated_at INTEGER, last_accessed INTEGER)');
      await this._run('CREATE INDEX IF NOT EXISTS idx_sessions_updated ON sessions(updated_at)');
      await this._run('CREATE INDEX IF NOT EXISTS idx_sessions_accessed ON sessions(last_accessed)');
      
      this.initialized = true;
      console.log('[SQLiteStore] Database initialized');
    } catch (e) {
      console.log('[SQLiteStore] sqlite3 not available, using JSON fallback');
      this.useJSON = true;
      this.initialized = true;
    }
  }

  _run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  _get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  _all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
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
    await this.init();

    if (this.useJSON) {
      const store = this._jsonLoad();
      return store[sessionKey] || null;
    }

    const row = await this._get('SELECT data FROM sessions WHERE session_key = ?', [sessionKey]);
    if (!row) return null;

    // 更新最后访问时间
    this._run('UPDATE sessions SET last_accessed = ? WHERE session_key = ?', [Date.now(), sessionKey]);

    try {
      return JSON.parse(row.data);
    } catch (e) {
      return null;
    }
  }

  async set(sessionKey, data) {
    await this.init();

    if (this.useJSON) {
      const store = this._jsonLoad();
      store[sessionKey] = data;
      this._jsonSave(store);
      return { success: true };
    }

    const now = Date.now();
    const jsonData = JSON.stringify(data);

    await this._run(
      'INSERT INTO sessions (session_key, data, created_at, updated_at, last_accessed) VALUES (?, ?, ?, ?, ?) ON CONFLICT(session_key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, last_accessed = excluded.last_accessed',
      [sessionKey, jsonData, now, now, now]
    );

    return { success: true };
  }

  async delete(sessionKey) {
    await this.init();

    if (this.useJSON) {
      const store = this._jsonLoad();
      delete store[sessionKey];
      this._jsonSave(store);
      return { success: true };
    }

    await this._run('DELETE FROM sessions WHERE session_key = ?', [sessionKey]);
    return { success: true };
  }

  async getAll() {
    await this.init();

    if (this.useJSON) {
      return this._jsonLoad();
    }

    const rows = await this._all('SELECT session_key, data FROM sessions ORDER BY updated_at DESC');
    const result = {};
    for (const row of rows) {
      try {
        result[row.session_key] = JSON.parse(row.data);
      } catch (e) {}
    }
    return result;
  }

  async getStats() {
    await this.init();

    if (this.useJSON) {
      const store = this._jsonLoad();
      return {
        sessionCount: Object.keys(store).length,
        backend: 'json',
        note: 'sqlite3 not available'
      };
    }

    const row = await this._get('SELECT COUNT(*) as count, MAX(updated_at) as last_update, MIN(updated_at) as first_update FROM sessions');
    return {
      sessionCount: row?.count || 0,
      lastUpdate: row?.last_update ? new Date(row.last_update).toISOString() : null,
      firstUpdate: row?.first_update ? new Date(row.first_update).toISOString() : null,
      backend: 'sqlite'
    };
  }

  async cleanupOldSessions(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    await this.init();

    if (this.useJSON) {
      const store = this._jsonLoad();
      const now = Date.now();
      let deleted = 0;
      for (const [key, data] of Object.entries(store)) {
        const lastAccessed = data.lastAccessed || data.updatedAt || 0;
        if (now - lastAccessed > maxAgeMs) {
          delete store[key];
          deleted++;
        }
      }
      this._jsonSave(store);
      return { deleted };
    }

    const cutoff = Date.now() - maxAgeMs;
    const result = await this._run('DELETE FROM sessions WHERE last_accessed < ?', [cutoff]);
    return { deleted: result.changes };
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        this.db.close(() => {
          this.initialized = false;
          resolve();
        });
      });
    }
  }
}

// 全局实例
const sqliteStore = new SQLiteSessionStore();

// 命令行接口
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    switch (command) {
      case 'init':
        await sqliteStore.init();
        console.log('Database initialized');
        await sqliteStore.close();
        break;

      case 'stats':
        const stats = await sqliteStore.getStats();
        console.log(stats);
        await sqliteStore.close();
        break;

      case 'cleanup':
        const result = await sqliteStore.cleanupOldSessions();
        console.log(`Cleaned ${result.deleted} old sessions`);
        await sqliteStore.close();
        break;

      case 'test':
        await sqliteStore.init();
        await sqliteStore.set('test-session', { test: true, timestamp: Date.now() });
        const data = await sqliteStore.get('test-session');
        console.log('Test data:', data);
        await sqliteStore.delete('test-session');
        console.log('Test completed');
        await sqliteStore.close();
        break;

      default:
        console.log('Usage: node sqlite-session-store.js [init|stats|cleanup|test]');
    }
  })();
}

module.exports = { SQLiteSessionStore, sqliteStore };
