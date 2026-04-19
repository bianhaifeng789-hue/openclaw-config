# Session 系统优化分析

## 当前架构分析

### 1. Session Store 管理
- **存储方式**: JSON 文件（`~/.openclaw/session-store.json`）
- **更新机制**: 每次状态变化都全量写入
- **问题**: 
  - 无缓存层，频繁磁盘 I/O
  - 无增量更新，每次写入整个文件
  - Gateway restart 时状态可能丢失

### 2. Session Write Lock
- **Watchdog**: 60s 检查一次
- **Max Hold**: 300s (5分钟)
- **Stale Threshold**: 1800s (30分钟)
- **问题**: 
  - Lock 检查间隔可能太长
  - Lock 文件可能堆积

### 3. Transcript 文件管理
- **存储**: JSONL 格式
- **Archive**: `transcript.archived.<timestamp>`
- **清理**: `cleanupArchivedSessionTranscripts` - 有参数但无自动调度
- **问题**: 
  - Transcript 无限增长
  - Archive 文件无自动清理
  - 无压缩机制

### 4. ACP Cleanup
- **Timeout**: 15s
- **流程**: cancel → close → ensureFreshAcpResetState
- **问题**: 
  - Timeout 太长导致 reset 卡顿
  - 多次等待可能叠加

### 5. Compaction 参数
- **当前配置**:
  ```json
  {
    "bootstrapMaxChars": 40000,
    "bootstrapTotalMaxChars": 160000,
    "reserveTokens": 18000,
    "keepRecentTokens": 4000,
    "maxHistoryShare": 0.25
  }
  ```
- **问题**: 
  - bootstrapMaxChars=40000 可能太小
  - reserveTokens=18000 偏大，压缩触发早
  - maxHistoryShare=0.25 保留历史少

---

## 优化方案

### P0 - 立即可做（配置优化）

#### 1. Compaction 参数调优
```json
{
  "bootstrapMaxChars": 60000,      // 增大，减少 bootstrap 频率
  "bootstrapTotalMaxChars": 200000,
  "reserveTokens": 12000,          // 减小，推迟压缩触发
  "keepRecentTokens": 8000,        // 增大，保留更多上下文
  "maxHistoryShare": 0.35          // 增大，保留更多历史
}
```

#### 2. Session Write Lock 优化
- 减少 watchdog interval 到 30s
- 减少 maxHoldMs 到 180s
- 减少 stale threshold 到 900s

### P1 - 短期实现（脚本优化）

#### 3. Transcript 自动压缩
- 创建 `transcript-compressor.js`
- 定期检查 transcript 大小
- 超过阈值自动压缩（保留最近 N 条消息）

#### 4. Archive 文件自动清理
- 创建 `archive-cleaner.js`
- 每周清理 > 7 天的 archive 文件
- 保留最近 3 天的 archive

#### 5. Session Store 增量更新
- 创建 `session-store-cache.js`
- 缓存最近更新
- 批量写入（每 5s 一次）

### P2 - 中期优化（架构改进）

#### 6. ACP Cleanup 并行化
- cancel + close 并行执行
- Timeout 分段（cancel 5s + close 5s）

#### 7. Session 状态持久化
- Gateway restart 时保存状态
- 使用 SQLite 或 LevelDB 替代 JSON

---

## 实施计划

### 阶段 1: 配置优化（立即）
- [ ] 更新 `openclaw.json` compaction 参数
- [ ] 测试新参数效果

### 阶段 2: 脚本优化（本周）
- [ ] 创建 `transcript-compressor.js`
- [ ] 创建 `archive-cleaner.js`
- [ ] 创建 `session-store-cache.js`
- [ ] 集成到 heartbeat 任务

### 阀段 3: 架构改进（下周）
- [ ] 研究 ACP cleanup 并行化
- [ ] 研究 SQLite 替代方案

---

## 预期收益

| 优化项 | 预期收益 |
|--------|----------|
| Compaction 参数调优 | 减少 bootstrap 频率 30% |
| Transcript 压缩 | Token 使用减少 50% |
| Archive 清理 | 磁盘空间节省 70% |
| Session Store 缓存 | 磁盘 I/O 减少 80% |
| ACP Cleanup 并行 | Reset 时间减少 50% |

---

创建时间：2026-04-19