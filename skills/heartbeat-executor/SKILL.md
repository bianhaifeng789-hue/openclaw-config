---
metadata:
  openclaw:
    source: claude-code-pattern
    category: heartbeat
    tags: [heartbeat, executor, automation]
---

# HEARTBEAT 任务执行器

执行 HEARTBEAT.md 中定义的定期任务。

## 任务列表

### 1. task-visualizer (30m, high)
检查活动任务，发送飞书卡片通知。

### 2. memory-compact (24h, low)
压缩 MEMORY.md，节省 tokens。

### 3. memory-maintenance (2h)
读取 daily notes，更新 MEMORY.md AUTO_UPDATE 区块。

### 4. insights-analysis (6h)
分析用户工作模式，更新 User Profile。

### 5. auto-dream (24h)
后台记忆合并，提取持久记忆。

### 6. prompt-suggestion (on-event)
生成下一步提示建议。

### 7. magic-docs-scan (6h, medium)
扫描 # MAGIC DOC: 标记，自动更新文档。

### 8. phase1-8-stats-check (1h, medium)
检查 Phase 1-8 模块统计。

### 9. buddy-interaction-check (30m, low)
Buddy 互动里程碑检查。

### 10. limits-early-warning (30m, high)
API limits 早期警告。

### 11. memdir-stats-check (1h, high)
Memdir token 节省统计。

## 执行规则

1. 每次心跳只执行 1-2 个任务
2. 高优先级任务优先执行
3. 检查上次执行时间，跳过未超时的任务
4. 有重要发现时发送飞书卡片
5. 无需处理时返回 HEARTBEAT_OK

## 状态文件

- `memory/heartbeat-state.json` - 主状态文件
- `memory/dream-state.json` - AutoDream 状态
- `memory/session-memory-compact-state.json` - 压缩状态
- `memory/magic-docs-state.json` - Magic Docs 状态

## 集成点

- impl/utils/auto-dream-service.ts
- impl/utils/session-memory-compact.ts
- impl/utils/magic-docs-service.ts
- impl/utils/prompt-suggestion-core.ts
- impl/utils/feishu-cards.ts