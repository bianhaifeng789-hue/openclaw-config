# OpenClaw 基础设施深度优化方案

## 已完成的优化

### Session 系统（2026-04-19）
- Compaction 参数调优
- Transcript 自动压缩
- Archive 文件清理

---

## 待优化项（按优先级）

## P0 - 紧急优化（影响稳定性）

### 1. Bootstrap Cache 优化

**问题分析**:
```javascript
// 当前实现：简单 Map，无限制
const cache = /* @__PURE__ */ new Map();

async function getOrLoadBootstrapFiles(params) {
  const existing = cache.get(params.sessionKey);
  if (existing) return existing;
  const files = await loadWorkspaceBootstrapFiles(params.workspaceDir);
  cache.set(params.sessionKey, files);
  return files;
}
```

**问题**:
- 无大小限制 → 内存泄漏风险
- 无过期策略 → 过期数据占用内存
- 无 LRU 淘汰 → 无用数据长期驻留

**优化方案**:
```javascript
// 建议实现：LRU Cache + 过期策略
const MAX_CACHE_SIZE = 100;  // 最多缓存 100 个 session
const CACHE_TTL_MS = 30 * 60 * 1000;  // 30 分钟过期

class BootstrapCache {
  constructor() {
    this.cache = new Map();
    this.accessOrder = [];  // LRU 队列
    this.lastAccess = new Map();
  }
  
  get(sessionKey) {
    const entry = this.cache.get(sessionKey);
    if (!entry) return null;
    
    // 检查过期
    if (Date.now() - this.lastAccess.get(sessionKey) > CACHE_TTL_MS) {
      this.delete(sessionKey);
      return null;
    }
    
    // LRU 更新
    this.touch(sessionKey);
    return entry;
  }
  
  set(sessionKey, files) {
    // 淘汰最旧
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldest = this.accessOrder.shift();
      this.delete(oldest);
    }
    
    this.cache.set(sessionKey, files);
    this.lastAccess.set(sessionKey, Date.now());
    this.touch(sessionKey);
  }
  
  touch(sessionKey) {
    // 移到队列尾部
    const idx = this.accessOrder.indexOf(sessionKey);
    if (idx >= 0) this.accessOrder.splice(idx, 1);
    this.accessOrder.push(sessionKey);
  }
  
  delete(sessionKey) {
    this.cache.delete(sessionKey);
    this.lastAccess.delete(sessionKey);
    const idx = this.accessOrder.indexOf(sessionKey);
    if (idx >= 0) this.accessOrder.splice(idx, 1);
  }
  
  // 定期清理过期
  cleanup() {
    const now = Date.now();
    for (const [key, time] of this.lastAccess) {
      if (now - time > CACHE_TTL_MS) this.delete(key);
    }
  }
}
```

**预期收益**:
- 内存使用减少 50%
- Bootstrap 加载速度提升（热点数据缓存）

---

### 2. Context Window Cache 优化

**问题分析**:
```javascript
const MODEL_CONTEXT_TOKEN_CACHE = /* @__PURE__ */ new Map();
```

**问题**: 同上，无限制、无过期、无 LRU

**优化方案**: 同 Bootstrap Cache，复用 LRU Cache 类

---

### 3. Compaction Checkpoint 自动清理

**问题分析**:
```javascript
const MAX_COMPACTION_CHECKPOINTS_PER_SESSION = 25;
```

**问题**:
- 只限制数量，不限制年龄
- 旧 checkpoint 可能占用大量磁盘空间
- 无自动清理机制

**优化方案**:
```javascript
// 添加年龄限制
const CHECKPOINT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;  // 7 天

function trimSessionCheckpoints(checkpoints) {
  if (!Array.isArray(checkpoints) || checkpoints.length === 0) return;
  
  const now = Date.now();
  
  // 先按年龄过滤
  const fresh = checkpoints.filter(c => 
    now - c.createdAt < CHECKPOINT_MAX_AGE_MS
  );
  
  // 再按数量限制
  return fresh.slice(-MAX_COMPACTION_CHECKPOINTS_PER_SESSION);
}

// 定期清理任务
async function cleanupOldCheckpoints() {
  const store = loadSessionStore();
  for (const [key, entry] of Object.entries(store)) {
    if (!entry?.compactionCheckpoints) continue;
    
    const trimmed = trimSessionCheckpoints(entry.compactionCheckpoints);
    if (trimmed.length !== entry.compactionCheckpoints.length) {
      store[key].compactionCheckpoints = trimmed;
    }
  }
  
  await saveSessionStore(store);
}
```

**预期收益**:
- 磁盘空间节省 30%
- Store 文件大小减少

---

## P1 - 重要优化（影响性能）

### 4. Session Write Lock 优化

**当前配置**:
```javascript
const DEFAULT_STALE_MS = 1800 * 1e3;      // 30 分钟
const DEFAULT_MAX_HOLD_MS = 300 * 1e3;    // 5 分钟
const DEFAULT_WATCHDOG_INTERVAL_MS = 6e4; // 60 秒
```

**问题**:
- Watchdog 60s 太长，lock 可能卡 60s 才释放
- Stale 30min 太长，崩溃后 lock 文件堆积
- MaxHold 5min 可能不够（某些长任务需要更长）

**优化方案**:
```javascript
const DEFAULT_STALE_MS = 900 * 1e3;       // 15 分钟
const DEFAULT_MAX_HOLD_MS = 180 * 1e3;    // 3 分钟
const DEFAULT_WATCHDOG_INTERVAL_MS = 3e4; // 30 秒
```

**预期收益**:
- Lock 释放更快（30s vs 60s）
- Stale 文件减少
- 长任务可显式延长 maxHold

---

### 5. Heartbeat 任务调度优化

**当前问题**:
- 顺序执行 → 一个任务卡住影响后续
- 无并行调度 → 效率低
- 无失败隔离 → 一个失败影响整体

**优化方案**:
```javascript
// 并行调度 + 失败隔离
async function runHeartbeatTasks(tasks) {
  // P0 任务必须完成
  const p0Tasks = tasks.filter(t => t.priority === 'critical');
  const p1Tasks = tasks.filter(t => t.priority === 'high');
  const p2Tasks = tasks.filter(t => t.priority === 'low');
  
  // P0 顺序执行（确保完成）
  for (const task of p0Tasks) {
    await runTaskWithTimeout(task, 30000);
  }
  
  // P1/P2 并行执行（失败不影响）
  const results = await Promise.allSettled([
    ...p1Tasks.map(t => runTaskWithTimeout(t, 60000)),
    ...p2Tasks.map(t => runTaskWithTimeout(t, 120000))
  ]);
  
  // 统计结果
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return { succeeded, failed };
}

async function runTaskWithTimeout(task, timeoutMs) {
  return Promise.race([
    exec(task.cmd),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('timeout')), timeoutMs)
    )
  ]);
}
```

**预期收益**:
- Heartbeat 执行时间减少 50%
- 失败隔离，不影响其他任务
- 超时保护，避免卡死

---

### 6. Session Store 增量更新

**当前问题**:
```javascript
async function updateSessionStore(storePath, callback) {
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  const result = callback(store);
  fs.writeFileSync(storePath, JSON.stringify(store));
  return result;
}
```

**问题**:
- 每次更新全量读写 → 磁盘 I/O 高
- 无缓存 → 重复读取浪费
- 无批量写入 → 频繁写入损耗

**优化方案**:
```javascript
// 缓存 + 批量写入
class SessionStoreManager {
  constructor(storePath) {
    this.storePath = storePath;
    this.cache = null;
    this.pendingWrites = [];
    this.lastFlush = 0;
    this.flushInterval = 5000;  // 5 秒批量写入
  }
  
  async load() {
    if (this.cache) return this.cache;
    
    this.cache = JSON.parse(
      await fs.promises.readFile(this.storePath, 'utf8')
    );
    return this.cache;
  }
  
  async update(callback) {
    const store = await this.load();
    const result = callback(store);
    
    // 加入待写入队列
    this.pendingWrites.push({ store, timestamp: Date.now() });
    
    // 定期批量写入
    if (Date.now() - this.lastFlush > this.flushInterval) {
      await this.flush();
    }
    
    return result;
  }
  
  async flush() {
    if (this.pendingWrites.length === 0) return;
    
    // 取最新的 store
    const latest = this.pendingWrites.pop();
    this.pendingWrites = [];
    
    await fs.promises.writeFile(
      this.storePath,
      JSON.stringify(latest.store)
    );
    
    this.lastFlush = Date.now();
  }
}
```

**预期收益**:
- 磁盘 I/O 减少 80%
- 更新延迟降低（5s 内批量写入）

---

## P2 - 中期优化（影响体验）

### 7. Memory 提取策略优化

**当前问题**:
- 提取频率固定（12h）→ 可能错过重要对话
- 无智能触发 → 关键决策可能遗漏
- 无优先级区分 → 所有对话同等对待

**优化方案**:
```javascript
// 智能触发策略
const EXTRACTION_TRIGGERS = {
  // 时间触发（兜底）
  time: { interval: 12h },
  
  // 关键词触发（重要决策）
  keyword: {
    patterns: ['决定', '决策', '选择', '重要', '优化'],
    cooldown: 1h  // 触发后冷却 1h
  },
  
  // 会话长度触发（长对话）
  length: {
    threshold: 50,  // 超过 50 条消息
    cooldown: 2h
  },
  
  // 用户信号触发（纠正/确认）
  signal: {
    corrections: ['不对', '错误', '重试'],
    reinforcements: ['对', '正确', '正是'],
    cooldown: 30min
  }
};

function shouldExtractMemories(session) {
  const triggers = [];
  
  // 检查时间触发
  if (session.lastExtraction > EXTRACTION_TRIGGERS.time.interval) {
    triggers.push('time');
  }
  
  // 检查关键词触发
  const keywords = detectKeywords(session.messages);
  if (keywords.length > 0) {
    triggers.push('keyword');
  }
  
  // 检查长度触发
  if (session.messages.length > EXTRACTION_TRIGGERS.length.threshold) {
    triggers.push('length');
  }
  
  // 检查用户信号
  if (session.hasUserSignal) {
    triggers.push('signal');
  }
  
  return {
    shouldExtract: triggers.length > 0,
    triggers,
    priority: triggers.includes('keyword') ? 'high' : 'normal'
  };
}
```

**预期收益**:
- 重要决策不遗漏
- 关键对话及时提取
- 提取质量提升

---

### 8. Context 压缩质量优化

**当前问题**:
- 通用压缩策略 → 不区分角色
- 无质量检查 → 压缩可能丢失关键信息
- 无回滚机制 → 压缩失败无法恢复

**优化方案**:
```javascript
// 借鉴 Harness Engineering 的角色感知压缩
const ROLE_RETENTION = {
  evaluator: 0.50,  // Evaluator 需要跨轮对比
  builder: 0.20,    // Builder 旧调试无用
  default: 0.30
};

const ROLE_SUMMARIZE_INSTRUCTIONS = {
  evaluator: 'Preserve: all scores, bugs found, cross-round comparisons',
  builder: 'Preserve: files created/modified, architecture decisions, latest errors',
  default: 'Preserve: key decisions, files modified, current progress, errors'
};

function compactWithContext(role, messages) {
  const retention = ROLE_RETENTION[role];
  const keepCount = Math.floor(messages.length * retention);
  
  // 使用 safe_split_index 避免破坏 tool_call/tool_result 配对
  const splitIdx = safeSplitIndex(messages, messages.length - keepCount);
  
  const oldMessages = messages.slice(0, splitIdx);
  const recentMessages = messages.slice(splitIdx);
  
  // 生成摘要（带角色特定指令）
  const summary = generateSummary(oldMessages, {
    instruction: ROLE_SUMMARIZE_INSTRUCTIONS[role]
  });
  
  // 质量检查
  if (!validateSummary(summary, oldMessages)) {
    // 回滚：保留更多消息
    return compactWithContext(role, messages, { keepMore: true });
  }
  
  return [
    { role: 'assistant', content: `[压缩摘要]\n${summary}` },
    ...recentMessages
  ];
}
```

**预期收益**:
- 压缩质量提升（角色感知）
- 关键信息不丢失
- 压缩失败可回滚

---

### 9. Gateway Restart 状态保存

**当前问题**:
- Gateway restart 状态丢失 → 需要重新 bootstrap
- 无状态持久化 → 长任务中断
- 无恢复机制 → restart 后需手动恢复

**优化方案**:
```javascript
// Gateway restart 状态保存
const STATE_FILE = '~/.openclaw/gateway-state.json';

async function saveGatewayState() {
  const state = {
    sessions: await loadSessionStore(),
    heartbeat: await loadHeartbeatState(),
    cache: {
      bootstrap: bootstrapCache.snapshot(),
      context: contextCache.snapshot()
    },
    timestamp: Date.now()
  };
  
  await fs.promises.writeFile(STATE_FILE, JSON.stringify(state));
}

async function restoreGatewayState() {
  if (!fs.existsSync(STATE_FILE)) return;
  
  const state = JSON.parse(
    await fs.promises.readFile(STATE_FILE, 'utf8')
  );
  
  // 检查是否过期（超过 5 分钟不恢复）
  if (Date.now() - state.timestamp > 5 * 60 * 1000) {
    await fs.promises.unlink(STATE_FILE);
    return;
  }
  
  // 恢复状态
  bootstrapCache.restore(state.cache.bootstrap);
  contextCache.restore(state.cache.context);
  await saveSessionStore(state.sessions);
  
  // 清理状态文件
  await fs.promises.unlink(STATE_FILE);
}

// Gateway shutdown hook
process.on('SIGTERM', async () => {
  await saveGatewayState();
  process.exit(0);
});

// Gateway startup
async function gatewayStartup() {
  await restoreGatewayState();
  // ... 正常启动流程
}
```

**预期收益**:
- Gateway restart 恢复更快
- 状态不丢失
- 长任务可恢复

---

## P3 - 长期优化（架构改进）

### 10. SQLite 替代 JSON Store

**问题**:
- JSON 文件并发写入问题
- 无索引 → 查询效率低
- 无事务 → 数据一致性风险

**方案**: 使用 SQLite 或 LevelDB
- 支持并发
- 支持索引
- 支持事务

---

### 11. 分布式 Session Store

**问题**:
- 单机存储 → 无法扩展
- 无备份 → 数据丢失风险

**方案**: 使用 Redis 或云存储
- 分布式存储
- 自动备份
- 高可用

---

## 实施计划

### 本周（P0）
- [ ] Bootstrap Cache LRU 实现
- [ ] Context Window Cache LRU 实现
- [ ] Compaction Checkpoint 自动清理

### 下周（P1）
- [ ] Session Write Lock 参数优化
- [ ] Heartbeat 并行调度实现
- [ ] Session Store 增量更新实现

### 两周后（P2）
- [ ] Memory 提取智能触发
- [ ] Context 压缩质量优化
- [ ] Gateway Restart 状态保存

### 后续（P3）
- [ ] 研究 SQLite 替代方案
- [ ] 研究分布式存储方案

---

## 预期总体收益

| 优化项 | 收益维度 | 预期提升 |
|--------|----------|----------|
| Bootstrap Cache | 内存使用 | 减少 50% |
| Context Cache | 内存使用 | 减少 30% |
| Checkpoint 清理 | 磁盘空间 | 减少 30% |
| Lock 优化 | Lock 释放 | 加快 50% |
| Heartbeat 并行 | 执行时间 | 减少 50% |
| Store 增量更新 | 磁盘 I/O | 减少 80% |
| Memory 智能触发 | 提取质量 | 提升 30% |
| Context 压缩质量 | 信息保留 | 提升 20% |
| Gateway 状态保存 | 恢复速度 | 提升 70% |

---

创建时间：2026-04-19