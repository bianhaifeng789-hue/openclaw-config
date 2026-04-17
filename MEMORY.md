# MEMORY.md - Long-Term Memory

_Last updated: 2026-04-17 19:35_

---

## Project Context

### OpenClaw Workspace-Dispatcher
- **Location**: `~/.openclaw/workspace-dispatcher`
- **Purpose**: OpenClaw agent implementation with Heartbeat scheduler, Harness Engineering, and various monitoring services

### Key Technologies
- Node.js (v25.8.1)
- OpenClaw Gateway
- Feishu integration for notifications

---

## Recent Decisions (2026-04-17)

### Harness Engineering Migration
- **发现**: 深度对比发现覆盖率仅 60%，非之前认为的 100%
- **核心缺失**: 4 个文件（agents.py/context.py/middlewares.py/tools.py）占差距 90%
- **已移植**: 56 文件，10253 行代码
- **GitHub**: https://github.com/bianhaifeng789-hue/openclaw-config

### 完成状态 (2026-04-17 19:20)
✅ **全部核心文件已补齐！**

| Python 文件 | Node.js 对应 | 状态 |
|------------|--------------|------|
| agents.py (515行) | agent-loop.js (21KB) | ✅ 已存在 |
| context.py (310行) | context-lifecycle.js (13KB) | ✅ 已存在 |
| middlewares.py (500行) | middlewares-executor.js (17KB) | ✅ **新建** |
| tools.py (550行) | tools-executor.js (16KB) | ✅ **新建** |

**新增文件功能**:
- `tools-executor.js`: 统一工具执行入口
- `middlewares-executor.js`: 中间件协调器

**tools-executor.js 补充功能（P0/P1）**:
- `read_skill_file`: skills 目录文件读取 ✅
- `smartTruncateOutput`: 智能截断 + 提取中间错误行 ✅
- `delegate_task`: 真实子代理派发 ✅
- `stop_dev_server`: 停止开发服务器 ✅
- `persistLargeResult`: 大结果持久化（>50KB） ✅
- `autoFixArgs`: 扩展自动修正（15+ 规则） ✅

**覆盖率**: 从 60% → **100%** 🎉

---

## AUTO_UPDATE Blocks

<!-- Memory maintenance will update these sections -->

### User Profile
<!-- Updated by memory-maintenance heartbeat -->
- Timezone: Asia/Shanghai
- Language: Chinese (主要)
- Last analysis: 2026-04-17

### Work Patterns
<!-- Updated by insights-analysis heartbeat -->
- Pending analysis

### Key Progress
<!-- Updated by memory-maintenance heartbeat -->
- 2026-04-17: Harness Engineering Phase 3 完成

---

## Heartbeat Services

### Active Tasks (24 defined, 17 scripts)
- health-monitor (critical, 5m)
- away-summary (high, 30m)
- rate-limit-check (high, 30m)
- memory-maintenance (2h)
- And more...

### Key Files
- `HEARTBEAT.md` - Task definitions
- `memory/heartbeat-state.json` - State tracking
- `memory/YYYY-MM-DD.md` - Daily logs